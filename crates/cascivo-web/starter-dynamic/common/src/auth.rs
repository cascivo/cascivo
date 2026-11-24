//! Sign-in. The demo accepts any name: replace `login` with your identity provider.
//! `Session::oauth_begin(provider, next)` returns the authorize URL parameters (state + PKCE);
//! the callback route calls `Session::oauth_callback(provider, state)`, exchanges the code,
//! then does what `login` does below: `rotate_id`, then store the user. Behind Cloudflare
//! Access, read the `Cf-Access-Authenticated-User-Email` header in `DemoAuth::user` instead.

use axum::Router;
use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::http::request::Parts;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use cascivo_server::{
    Authenticator, Form, FormErrors, FormState, Hx, LocalPath, Rule, Session, Submission,
    ToastKind, Validate, View, see_other,
};
use minijinja::context;
use serde::{Deserialize, Serialize};

/// What templates see as `user`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub name: String,
}

#[derive(Clone)]
pub struct DemoAuth;

impl Authenticator for DemoAuth {
    type User = Account;

    async fn user(&self, s: &Session, _: &Parts) -> Option<Account> {
        s.get("user")
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Login {
    name: String,
    /// Re-parsed by `LocalPath` on deserialize: never an open redirect.
    next: Option<LocalPath>,
}

impl Validate for Login {
    const RULES: &'static [(&'static str, Rule)] =
        &[("name", Rule::text().required().min_len(3).max_len(40))];

    fn validate(&self, _: &mut FormErrors) {}
}

#[derive(Deserialize)]
struct Next {
    next: Option<String>,
}

pub fn login_view(form: FormState, next: &str) -> View {
    View::page("login.html")
        .fragment("login")
        .ctx(context! { form, next })
}

async fn login_page(q: axum::extract::Query<Next>) -> View {
    let next = LocalPath::parse_or_root(q.next.as_deref());
    login_view(FormState::new::<Login>(), next.as_str())
}

async fn login(hx: Hx, session: Session, Form(f): Form<Login>) -> Response {
    match f {
        Submission::Valid(l) => {
            // A new id at every privilege change: a planted session id is useless.
            session.rotate_id();
            if let Err(e) = session.insert("user", Account { name: l.name }) {
                return e.into_response();
            }
            session.flash(ToastKind::Success, "auth.in");
            let to = l
                .next
                .unwrap_or_else(|| LocalPath::parse_or_root(Some("/notes")));
            // The new session has a new CSRF token, and only a fresh page puts it in
            // `<body hx-headers>`: a full reload, not `see_other`'s in-page `HX-Location`.
            if hx.request
                && let Ok(v) = HeaderValue::from_str(to.as_str())
            {
                return ([(HeaderName::from_static("hx-redirect"), v)], StatusCode::OK)
                    .into_response();
            }
            see_other(&hx, &to)
        }
        Submission::Invalid(form) => login_view(form, "/notes")
            .status(StatusCode::UNPROCESSABLE_ENTITY)
            .into_response(),
    }
}

async fn logout(hx: Hx, session: Session) -> Response {
    session.destroy();
    see_other(&hx, &LocalPath::parse_or_root(None))
}

pub fn routes<S: Clone + Send + Sync + 'static>() -> Router<S> {
    Router::new()
        .route("/login", get(login_page).post(login))
        .route("/logout", post(logout))
}
