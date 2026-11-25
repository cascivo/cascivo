//! Error wiring of select/textarea/radio-group/checkbox-group and multipart file uploads.

use std::collections::BTreeMap;

use axum::Router;
use axum::body::{Body, to_bytes};
use axum::http::{Request, StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::post;
use cascivo_server::{App, Headers, MultipartForm, Rule, Submission, UploadedFile, Validate, View};
use cascivo_web::{Bundle, Config, Engine};
use minijinja::context;
use serde::Deserialize;
use tower::ServiceExt;

const PAGE: &str = r#"{{ form.field("bio", label="Bio", kind="textarea") }}{{ form.field("size", label="Size", kind="select", options=["s", "m"]) }}{{ form.field("plan", label="Plan", hint="Pick one", kind="radio-group", options=[["a", "Free"], ["b", "Pro"]]) }}{{ form.field("tags", label="Tags", kind="checkbox-group", options=["x", "y"]) }}{{ upload }}"#;

#[derive(Debug, Deserialize)]
struct Profile {
    bio: String,
    size: String,
    plan: String,
    #[serde(default)]
    tags: Vec<String>,
}

impl Validate for Profile {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("bio", Rule::text().required()),
        ("size", Rule::text().required()),
        ("plan", Rule::text().required()),
    ];
}

fn app() -> Router {
    let engine = Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"T\"").unwrap(),
        templates: BTreeMap::from([("p.html".to_string(), PAGE.to_string())]),
        messages: BTreeMap::new(),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .unwrap();
    App::new(engine)
        .security_headers(Headers::none())
        .routes(Router::new().route(
            "/p",
            post(|m: MultipartForm<Profile>| async move {
                let up = m
                    .files
                    .iter()
                    .map(|f: &UploadedFile| format!("{}:{}:{}", f.field, f.filename, f.bytes.len()))
                    .collect::<Vec<_>>()
                    .join(",");
                match m.submission {
                    Submission::Valid(p) => {
                        format!("ok {} {} {} {:?} {up}", p.bio, p.size, p.plan, p.tags)
                            .into_response()
                    }
                    Submission::Invalid(form) => View::page("p.html")
                        .ctx(context! { form, upload => up })
                        .status(StatusCode::UNPROCESSABLE_ENTITY)
                        .into_response(),
                }
            }),
        ))
        .into_router()
}

fn part(name: &str, value: &str) -> String {
    format!("--B\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n")
}

async fn send(body: String) -> (StatusCode, String) {
    let r = Request::post("/p")
        .header(header::CONTENT_TYPE, "multipart/form-data; boundary=B")
        .body(Body::from(body))
        .unwrap();
    let res = app().oneshot(r).await.unwrap();
    let st = res.status();
    (
        st,
        String::from_utf8(to_bytes(res.into_body(), 1 << 20).await.unwrap().to_vec()).unwrap(),
    )
}

const FILE: &str = "--B\r\nContent-Disposition: form-data; name=\"avatar\"; filename=\"../me.png\"\r\nContent-Type: image/png\r\n\r\nPNGDATA\r\n";

#[tokio::test]
async fn valid_multipart_gives_values_and_files() {
    let body = format!(
        "{}{}{}{}{}{FILE}--B--\r\n",
        part("bio", "hi"),
        part("size", "m"),
        part("plan", "b"),
        part("tags", "x"),
        part("tags", "y")
    );
    let (st, text) = send(body).await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(text, "ok hi m b [\"x\", \"y\"] avatar:me.png:7");
}

#[tokio::test]
async fn invalid_multipart_wires_errors_on_every_control_kind() {
    let (st, html) = send(format!("{}{FILE}--B--\r\n", part("tags", "y"))).await;
    assert_eq!(st, StatusCode::UNPROCESSABLE_ENTITY);
    // textarea and select: aria-invalid + describedby on the control, role=alert error.
    for id in ["f-bio", "f-size"] {
        assert!(
            html.contains(&format!(r#"<p id="{id}-error" role="alert""#)),
            "{html}"
        );
        assert!(
            html.contains(&format!(r#"aria-describedby="{id}-error""#)),
            "{html}"
        );
    }
    assert!(html.contains(r#"aria-invalid="true""#));
    // radio group: the group element carries the wiring; hint and error both described.
    assert!(html.contains(
        r#"role="radiogroup" aria-labelledby="f-plan-label" aria-invalid="true" aria-describedby="f-plan-description f-plan-error""#
    ), "{html}");
    assert!(html.contains(r#"<p id="f-plan-error" role="alert""#));
    assert!(html.contains(r#"<input type="radio" id="f-plan-0" name="plan" value="a" required>"#));
    // checkbox group keeps the submitted value, no error of its own.
    assert!(html.contains(r#"role="group""#));
    assert!(
        html.contains(r#"type="checkbox" id="f-tags-1" name="tags" value="y" checked"#),
        "{html}"
    );
    assert!(!html.contains("f-tags-error"));
    assert!(html.ends_with("avatar:me.png:7"));
}

#[tokio::test]
async fn non_multipart_and_malformed_bodies_are_rejected() {
    let r = Request::post("/p")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::from("a=1"))
        .unwrap();
    assert_eq!(
        app().oneshot(r).await.unwrap().status(),
        StatusCode::UNSUPPORTED_MEDIA_TYPE
    );
    let (st, _) = send("garbage".into()).await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
}
