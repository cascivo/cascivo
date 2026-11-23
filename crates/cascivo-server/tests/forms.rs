//! B2: forms, validation, the `field` error re-render and its i18n messages, behind B3's CSRF.

use std::collections::BTreeMap;

use axum::Router;
use axum::body::{Body, to_bytes};
use axum::http::{Request, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use cascivo_server::{
    App, Csrf, Form, FormErrors, FormState, Headers, Hx, LocalPath, MemoryStore, Msg, ReqCtx, Rule,
    SessionConfig, Submission, Validate, View, check_fragment, parse_form, see_other,
};
use cascivo_web::{Bundle, Config, Engine};
use minijinja::context;
use serde::{Deserialize, Serialize};
use tower::ServiceExt;

const PAGE: &str = r#"<main><i>{{ request.csrf }}</i><div id="todo_form">{% block todo_form %}<cv-form><form method="post" action="/todo">{{ form.csrf() }}{% for e in form.errors() %}<p class="summary">{{ e }}</p>{% endfor %}{{ form.field("title", label="Title", hint="Short") }}{{ form.field("email", label="Email") }}{{ form.field("prio", label="Priority") }}{{ form.field("notes", label="Notes", kind="textarea", rows=2) }}{{ form.field("size", label="Size", kind="select", options=[["s", "Small"], "m"]) }}{{ form.field("done", label="Done") }}</form></cv-form>{% endblock %}</div></main>"#;

fn engine(messages: &[(&str, &str)]) -> Engine {
    let en = messages
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"T\"\nlang = \"en\"").unwrap(),
        templates: BTreeMap::from([("todo.html".to_string(), PAGE.to_string())]),
        messages: BTreeMap::from([("en".to_string(), en)]),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .unwrap()
}

#[derive(Debug, Deserialize, Serialize)]
struct Todo {
    title: String,
    email: Option<String>,
    prio: Option<u32>,
    #[serde(default)]
    notes: String,
    size: Option<String>,
    #[serde(default)]
    done: Option<String>,
}

impl Validate for Todo {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("title", Rule::text().required().min_len(3).max_len(20)),
        ("email", Rule::email()),
        ("prio", Rule::number().min(1.0).max(5.0)),
        ("done", Rule::checkbox()),
    ];

    fn validate(&self, e: &mut FormErrors) {
        if self.title == "taken" {
            e.add("title", Msg::new("todo.taken").arg("title", &self.title));
            e.add_form(Msg::new("todo.fix"));
        }
    }
}

fn app(messages: &[(&str, &str)]) -> Router {
    App::new(engine(messages))
        .security_headers(Headers::none())
        .sessions(MemoryStore::new(), SessionConfig::default())
        .csrf(Csrf::default())
        .routes(
            Router::new().route(
                "/todo",
                get(|| async {
                    View::page("todo.html")
                        .fragment("todo_form")
                        .ctx(context! { form => FormState::new::<Todo>() })
                })
                .post(|hx: Hx, Form(s): Form<Todo>| async move {
                    match s {
                        Submission::Valid(_) => see_other(&hx, &LocalPath::parse("/done").unwrap()),
                        Submission::Invalid(form) => View::page("todo.html")
                            .fragment("todo_form")
                            .ctx(context! { form })
                            .status(StatusCode::UNPROCESSABLE_ENTITY)
                            .into_response(),
                    }
                }),
            ),
        )
        .into_router()
}

const NAME: &str = "__Host-cv-session";
const DEFAULTS: &[(&str, &str)] = &[("todo.taken", "{title} is taken"), ("todo.fix", "Fix it")];

async fn body(r: Response) -> String {
    String::from_utf8(to_bytes(r.into_body(), 1 << 20).await.unwrap().to_vec()).unwrap()
}

/// GET the form: (session cookie, CSRF token, html).
async fn start(app: &Router) -> (String, String, String) {
    let r = app
        .clone()
        .oneshot(Request::get("/todo").body(Body::empty()).unwrap())
        .await
        .unwrap();
    let cookie = r.headers()[header::SET_COOKIE].to_str().unwrap();
    let cookie = cookie
        .split(';')
        .next()
        .unwrap()
        .split_once('=')
        .unwrap()
        .1
        .to_owned();
    let html = body(r).await;
    let tok = html
        .split("<i>")
        .nth(1)
        .unwrap()
        .split("</i>")
        .next()
        .unwrap()
        .to_owned();
    (cookie, tok, html)
}

async fn post(app: &Router, cookie: &str, form: &str, htmx: bool) -> Response {
    let mut b = Request::post("/todo")
        .header(header::COOKIE, format!("{NAME}={cookie}"))
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded");
    if htmx {
        b = b.header("hx-request", "true");
    }
    app.clone()
        .oneshot(b.body(Body::from(form.to_owned())).unwrap())
        .await
        .unwrap()
}

#[tokio::test]
async fn empty_form_carries_constraints_messages_and_csrf() {
    let app = app(DEFAULTS);
    let (_, tok, html) = start(&app).await;
    assert!(html.contains(&format!(
        r#"<input type="hidden" name="csrf" value="{tok}">"#
    )));
    // The control from the input emitter, then the rule's constraints and their messages.
    assert!(html.contains(
        r#"<input id="f-title" minlength="3" maxlength="20" data-cv-msg-value-missing="This field is required." data-cv-msg-too-short="Use at least 3 characters." data-cv-msg-too-long="Use at most 20 characters." class="cv-input-input" aria-describedby="f-title-description" aria-labelledby="f-title-label" name="title" required/>"#
    ), "{html}");
    assert!(html.contains(r#"id="f-email" data-cv-msg-type-mismatch="Enter a valid value.""#));
    assert!(html.contains(r#"type="email""#));
    assert!(html.contains(r#"id="f-prio" min="1" max="5" step="any""#));
    assert!(html.contains(r#"type="number""#));
    assert!(html.contains(r#"<textarea id="f-notes" rows="2""#));
    assert!(html.contains(r#"<option value="s">Small</option><option value="m">m</option>"#));
    assert!(html.contains(r#"type="checkbox""#) && !html.contains(" checked"));
    assert!(!html.contains("aria-invalid") && !html.contains(r#"role="alert""#));
    assert!(!html.contains("summary"));
}

#[tokio::test]
async fn invalid_post_rerenders_422_with_values_and_errors() {
    let app = app(DEFAULTS);
    let (c, tok, _) = start(&app).await;
    let r = post(
        &app,
        &c,
        &format!("csrf={tok}&title=ab&email=nope&prio=9&notes=%3Cb%3E&size=m&done=on"),
        false,
    )
    .await;
    assert_eq!(r.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let html = body(r).await;
    assert!(html.starts_with("<main>"), "a full page without htmx");
    // Values kept (and escaped), errors wired through the field emitter.
    assert!(html.contains(r#"value="ab""#) && html.contains("&lt;b&gt;</textarea>"));
    assert!(html.contains(r#"<option value="m" selected>"#));
    assert!(html.contains(" checked"));
    assert!(html.contains(r#"<div class="cv-field-field" data-state="invalid">"#));
    assert!(
        html.contains(
            r#"aria-invalid="true" aria-describedby="f-title-description f-title-error""#
        ),
        "{html}"
    );
    assert!(html.contains(r#"<p id="f-title-error" role="alert" class="cv-field-error">Use at least 3 characters.</p>"#));
    assert!(html.contains(
        r#"<p id="f-email-error" role="alert" class="cv-field-error">Enter a valid value.</p>"#
    ));
    assert!(html.contains(
        r#"<p id="f-prio-error" role="alert" class="cv-field-error">Enter 5 or less.</p>"#
    ));
    assert!(!html.contains("f-notes-error"));
}

#[tokio::test]
async fn htmx_gets_the_form_fragment_only() {
    let app = app(DEFAULTS);
    let (c, tok, _) = start(&app).await;
    let r = post(&app, &c, &format!("csrf={tok}&title="), true).await;
    assert_eq!(r.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let html = body(r).await;
    assert!(
        html.starts_with("<cv-form>") && html.ends_with("</cv-form>"),
        "{html}"
    );
    assert!(html.contains(">This field is required.</p>"));
}

#[tokio::test]
async fn valid_post_redirects_and_server_checks_run_after_rules() {
    let app = app(DEFAULTS);
    let (c, tok, _) = start(&app).await;
    let r = post(
        &app,
        &c,
        &format!("csrf={tok}&title=hello&prio=&email="),
        false,
    )
    .await;
    assert_eq!(r.status(), StatusCode::SEE_OTHER);
    assert_eq!(r.headers()[header::LOCATION], "/done");

    let r = post(&app, &c, &format!("csrf={tok}&title=taken"), false).await;
    assert_eq!(r.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let html = body(r).await;
    assert!(html.contains(r#"<p class="summary">Fix it</p>"#));
    assert!(html.contains(">taken is taken</p>"));
}

#[tokio::test]
async fn csrf_still_guards_forms() {
    let app = app(DEFAULTS);
    let (c, _, _) = start(&app).await;
    assert_eq!(
        post(&app, &c, "title=hello", false).await.status(),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        post(&app, &c, "csrf=x&title=hello", false).await.status(),
        StatusCode::FORBIDDEN
    );
}

#[tokio::test]
async fn app_messages_translate_the_builtin_keys() {
    let mut msgs = DEFAULTS.to_vec();
    msgs.push(("cascade.form.valueMissing", "Pflichtfeld"));
    msgs.push(("cascade.form.tooShort", "Mindestens {min} Zeichen"));
    let app = app(&msgs);
    let (c, tok, html) = start(&app).await;
    // The client gets the same text the server would show.
    assert!(html.contains(r#"data-cv-msg-value-missing="Pflichtfeld""#));
    assert!(html.contains(r#"data-cv-msg-too-short="Mindestens 3 Zeichen""#));
    let html = body(post(&app, &c, &format!("csrf={tok}&title="), false).await).await;
    assert!(html.contains(">Pflichtfeld</p>"));
}

#[tokio::test]
async fn other_bodies_are_rejected() {
    let app = app(DEFAULTS);
    let (c, tok, _) = start(&app).await;
    let r = Request::post("/todo")
        .header(header::COOKIE, format!("{NAME}={c}"))
        .header("x-csrf-token", tok)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from("{}"))
        .unwrap();
    assert_eq!(
        app.clone().oneshot(r).await.unwrap().status(),
        StatusCode::UNSUPPORTED_MEDIA_TYPE
    );
}

#[derive(Debug, Deserialize)]
struct Typed {
    n: u32,
    #[allow(dead_code)]
    name: String,
}
impl Validate for Typed {}

#[test]
fn serde_failures_become_field_errors() {
    let key = |s: &Submission<Typed>, f: &str| match s {
        Submission::Invalid(st) => st.error_list().field(f).first().map(|m| m.key.to_string()),
        Submission::Valid(_) => None,
    };
    let s = parse_form::<Typed>(b"n=x&name=a");
    assert_eq!(key(&s, "n").as_deref(), Some("cascade.form.badInput"));
    let s = parse_form::<Typed>(b"n=1&name=");
    assert_eq!(
        key(&s, "name").as_deref(),
        Some("cascade.form.valueMissing")
    );
    match parse_form::<Typed>(b"n=1&name=a") {
        Submission::Valid(t) => assert_eq!(t.n, 1),
        Submission::Invalid(s) => panic!("{:?}", s.error_list()),
    }
    let Submission::Invalid(s) = parse_form::<Typed>(b"n=1") else {
        panic!()
    };
    assert_eq!(s.submitted()["n"], vec!["1".to_string()]);
}

#[test]
fn form_block_is_the_page_subtree_and_prefill_works() {
    let e = engine(DEFAULTS);
    let form = FormState::new::<Todo>().values(Todo {
        title: "x\"y".into(),
        email: None,
        prio: Some(2),
        notes: String::new(),
        size: Some("s".into()),
        done: Some("on".into()),
    });
    let ctx = context! { form };
    let req = ReqCtx {
        csrf: Some("tok"),
        ..ReqCtx::default()
    };
    check_fragment(&e, "todo.html", "todo_form", &ctx, &req).unwrap();
    let html = e.render("todo.html", &ctx, &req).unwrap();
    assert!(html.contains(r#"value="x&quot;y""#) && html.contains(r#"value="2""#));
    assert!(html.contains(r#"<option value="s" selected>"#) && html.contains(" checked"));
}
