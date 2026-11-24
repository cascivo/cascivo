//! Every view's fragment is the page's subtree (checkpoint β), plus the sign-in → create →
//! edit → delete flow over HTTP, with sessions and CSRF as a browser would send them.

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use cascivo_server::{FormErrors, FormState, Msg, ReqCtx, check_fragment};
use minijinja::value::Serde;
use minijinja::{Value, context};
use __NAME_SNAKE__::demo::Signup;
use __NAME_SNAKE__::notes::{Note, NoteInput};
use tower::ServiceExt;

fn invalid<T: cascivo_server::Validate>(field: &str) -> FormState {
    let mut e = FormErrors::default();
    e.add(field, Msg::new("c.taken").arg("name", "x"));
    e.add_form(Msg::new("c.fix"));
    FormState::new::<T>().errors(e)
}

#[test]
fn every_fragment_is_the_page_subtree() {
    let engine = __NAME_SNAKE__::engine();
    let user = Value::from(Serde(context! { name => "ada" }));
    let req = ReqCtx {
        path: "/",
        csrf: Some("token"),
        nonce: "nonce",
        user: Some(&user),
        ..ReqCtx::default()
    };
    let note = Note {
        id: 1,
        owner: "ada".into(),
        title: "First".into(),
        body: "Body".into(),
    };
    let form = || FormState::new::<NoteInput>();
    let views: Vec<(&str, &str, Value)> = vec![
        (
            "login.html",
            "login",
            context! { form => FormState::new::<__NAME_SNAKE__::auth::Login>(), next => "/" },
        ),
        (
            "login.html",
            "login",
            context! { form => invalid::<__NAME_SNAKE__::auth::Login>("name"), next => "/" },
        ),
        (
            "notes.html",
            "notes",
            context! { notes => Value::from(Serde(vec![note.clone()])), form => form() },
        ),
        (
            "notes.html",
            "notes",
            context! { notes => Value::from(Serde(Vec::<Note>::new())), form => form() },
        ),
        (
            "notes.html",
            "note_form",
            context! { notes => Value::from(Serde(vec![note.clone()])), form => form() },
        ),
        (
            "notes.html",
            "note_form",
            context! { notes => Value::from(Serde(vec![note])), form => invalid::<NoteInput>("title") },
        ),
        (
            "note.html",
            "note_form",
            context! { id => 1, form => form().values(NoteInput { title: "First".into(), body: None }) },
        ),
        (
            "note.html",
            "note_form",
            context! { id => 1, form => invalid::<NoteInput>("title") },
        ),
        (
            "c/form.html",
            "signup",
            context! { form => FormState::new::<Signup>() },
        ),
        (
            "c/form.html",
            "signup",
            context! { form => invalid::<Signup>("name") },
        ),
        ("c/dialog.html", "status", context! { saved => true }),
        ("c/toast.html", "status", context! { saved => true }),
        ("c/island.html", "stats_body", context! { visits => 7 }),
        ("c/tabs.html", "details", context! { panel => "details" }),
        ("c/tabs.html", "history", context! { panel => "history" }),
    ];
    for (tpl, block, ctx) in views {
        check_fragment(&engine, tpl, block, &ctx, &req).unwrap_or_else(|e| panic!("{e}"));
    }
}

async fn send(app: &axum::Router, req: Request<Body>) -> (StatusCode, header::HeaderMap, String) {
    let res = app.clone().oneshot(req).await.unwrap();
    let (status, headers) = (res.status(), res.headers().clone());
    let body = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    (status, headers, String::from_utf8(body.to_vec()).unwrap())
}

/// A browser: keeps the session cookie, sends the CSRF token the page handed out.
struct Client {
    app: axum::Router,
    cookie: String,
    token: String,
}

impl Client {
    async fn get(&mut self, path: &str) -> (StatusCode, header::HeaderMap, String) {
        let req = Request::get(path).header(header::COOKIE, &self.cookie);
        let r = send(&self.app, req.body(Body::empty()).unwrap()).await;
        self.keep(&r.1, &r.2);
        r
    }

    async fn post(
        &mut self,
        path: &str,
        body: &str,
        htmx: bool,
    ) -> (StatusCode, header::HeaderMap, String) {
        let mut req = Request::post(path)
            .header(header::COOKIE, &self.cookie)
            .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header("sec-fetch-site", "same-origin")
            .header("x-csrf-token", &self.token);
        if htmx {
            req = req.header("hx-request", "true");
        }
        let r = send(&self.app, req.body(Body::from(body.to_owned())).unwrap()).await;
        self.keep(&r.1, &r.2);
        r
    }

    fn keep(&mut self, h: &header::HeaderMap, body: &str) {
        if let Some(c) = h.get(header::SET_COOKIE) {
            self.cookie = c.to_str().unwrap().split(';').next().unwrap().to_owned();
        }
        if let Some(t) = body
            .split("X-CSRF-Token\":\"")
            .nth(1)
            .and_then(|t| t.split('"').next())
        {
            self.token = t.to_owned();
        }
    }
}

#[tokio::test]
async fn sign_in_then_create_edit_delete() {
    let secret = __NAME_SNAKE__::secret(None).unwrap();
    let mut c = Client {
        app: __NAME_SNAKE__::router(&secret).unwrap(),
        cookie: String::new(),
        token: String::new(),
    };
    // Anonymous: notes redirect to the sign-in page with `next`.
    let (s, h, _) = c.get("/notes").await;
    assert_eq!(s, StatusCode::SEE_OTHER);
    assert_eq!(h[header::LOCATION], "/login?next=%2Fnotes");

    c.get("/login").await;
    let (s, _, html) = c.post("/login", "name=a&next=%2Fnotes", true).await;
    assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY);
    assert!(html.contains("aria-invalid=\"true\""), "{html}");
    let (s, h, _) = c.post("/login", "name=ada&next=%2Fnotes", false).await;
    assert_eq!(s, StatusCode::SEE_OTHER);
    assert_eq!(h[header::LOCATION], "/notes");

    let (s, _, html) = c.get("/notes").await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("No notes yet") && !html.contains("Note added"));

    // Create: a 422 keeps the values; a valid one returns the fresh form + the list OOB.
    let (s, _, html) = c.post("/notes", "title=&body=keep+me", true).await;
    assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY);
    assert!(html.contains("keep me"));
    let (s, h, html) = c.post("/notes", "title=First&body=hello", true).await;
    assert_eq!(s, StatusCode::OK);
    assert!(
        html.contains("hx-swap-oob") && html.contains("Edit First"),
        "{html}"
    );
    assert!(h.get("hx-trigger").is_some() || html.contains("Note added"));

    // Edit without JavaScript: post/redirect/get.
    let (s, _, html) = c.get("/notes/1/edit").await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("value=\"First\""));
    let (s, h, _) = c.post("/notes/1", "title=Renamed&body=", false).await;
    assert_eq!(
        (s, &h[header::LOCATION]),
        (StatusCode::SEE_OTHER, &"/notes".parse().unwrap())
    );
    let (_, _, html) = c.get("/notes").await;
    assert!(html.contains("Renamed") && html.contains("Note saved"));

    // Delete with htmx: the list block comes back without the note.
    let (s, _, html) = c.post("/notes/1/delete", "", true).await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("No notes yet") && !html.contains("<html"));
    assert_eq!(
        c.post("/notes/1/delete", "", true).await.0,
        StatusCode::NOT_FOUND
    );
}

/// Sign-in rotates the session (and its CSRF token): htmx gets a full reload, not a swap
/// that would keep the old token in `<body hx-headers>`.
#[tokio::test]
async fn htmx_sign_in_reloads_the_page() {
    let secret = __NAME_SNAKE__::secret(None).unwrap();
    let mut c = Client {
        app: __NAME_SNAKE__::router(&secret).unwrap(),
        cookie: String::new(),
        token: String::new(),
    };
    c.get("/login").await;
    let (s, h, _) = c.post("/login", "name=ada&next=%2Fnotes", true).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(h["hx-redirect"], "/notes");
    assert!(h.get("hx-location").is_none());
}

#[tokio::test]
async fn csrf_and_secret_are_enforced() {
    let app = __NAME_SNAKE__::router(&__NAME_SNAKE__::secret(None).unwrap()).unwrap();
    let req = Request::post("/notes").body(Body::from("title=x")).unwrap();
    assert_eq!(send(&app, req).await.0, StatusCode::FORBIDDEN);
    assert!(__NAME_SNAKE__::secret(Some("short".into())).is_err());
}
