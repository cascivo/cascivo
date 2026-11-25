//! Auth hooks: an [`Authenticator`] turns the session into a user; [`User`] and [`MaybeUser`]
//! extract it. Plus Argon2id password hashing (`password`) and OAuth state + PKCE helpers.
//! The crate stores no users and makes no HTTP calls: the app owns its user table and token
//! exchange.

use std::sync::Arc;

use axum::extract::{FromRequestParts, Request, State};
use axum::http::request::Parts;
use axum::http::{HeaderValue, StatusCode, header};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use minijinja::Value;
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::util::{Local, b64, ct_eq, encode_component, now, send, token};
use crate::{AppError, Facts, Hx, LocalPath, MaybeSend, Session};

/// Who is signed in, from the session (e.g. a `user_id` the login handler stored after
/// [`Session::rotate_id`]). Runs once per request; templates see the user as `user`.
pub trait Authenticator: Clone + MaybeSend + Sync + 'static {
    type User: Serialize + Clone + Send + Sync + 'static;
    /// Where [`User`] sends anonymous visitors, with `?next=<the request path>`.
    const LOGIN: &'static str = "/login";
    fn user(&self, s: &Session, p: &Parts) -> impl Future<Output = Option<Self::User>> + MaybeSend;
}

#[derive(Clone)]
struct CurrentUser<U>(Option<U>);

#[derive(Clone)]
struct LoginPath(LocalPath);

/// The signed-in user, or a redirect to [`Authenticator::LOGIN`]: `303` (`HX-Redirect` for
/// htmx) with the current path as `next`. A login handler must re-parse `next` with
/// [`LocalPath::parse`] (never redirect to it raw).
#[derive(Debug, Clone)]
pub struct User<U>(pub U);

/// The signed-in user, if any.
#[derive(Debug, Clone)]
pub struct MaybeUser<U>(pub Option<U>);

fn current<U: Clone + Send + Sync + 'static>(p: &Parts) -> Result<Option<U>, AppError> {
    p.extensions
        .get::<CurrentUser<U>>()
        .map(|c| c.0.clone())
        .ok_or_else(|| AppError::internal("User<U>/MaybeUser<U>: no App::auth with this user type"))
}

impl<S: Sync, U: Clone + Send + Sync + 'static> FromRequestParts<S> for User<U> {
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        match current::<U>(parts).map_err(IntoResponse::into_response)? {
            Some(u) => Ok(Self(u)),
            None => Err(to_login(parts)),
        }
    }
}

impl<S: Sync, U: Clone + Send + Sync + 'static> FromRequestParts<S> for MaybeUser<U> {
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        current::<U>(parts)
            .map(Self)
            .map_err(IntoResponse::into_response)
    }
}

fn to_login(p: &Parts) -> Response {
    let Some(LoginPath(login)) = p.extensions.get::<LoginPath>() else {
        return AppError::internal("no login path").into_response();
    };
    let mut to = login.as_str().to_owned();
    if let Some(next) = p
        .uri
        .path_and_query()
        .and_then(|pq| LocalPath::parse(pq.as_str()).ok())
    {
        to.push(if to.contains('?') { '&' } else { '?' });
        to.push_str("next=");
        to.push_str(&encode_component(next.as_str()));
    }
    // Visible ASCII: a LocalPath plus percent-encoding.
    let v = HeaderValue::from_str(&to).unwrap_or_else(|_| HeaderValue::from_static("/"));
    let mut r = if Hx::from_headers(&p.headers).request {
        let mut r = StatusCode::OK.into_response();
        r.headers_mut().insert("hx-redirect", v);
        r
    } else {
        let mut r = StatusCode::SEE_OTHER.into_response();
        r.headers_mut().insert(header::LOCATION, v);
        r
    };
    r.headers_mut()
        .append(header::VARY, HeaderValue::from_static("HX-Request"));
    r
}

pub(crate) struct AuthRt<A> {
    pub(crate) auth: A,
    pub(crate) login: LocalPath,
}

pub(crate) fn layer<A: Authenticator>(
    State(rt): State<Local<Arc<AuthRt<A>>>>,
    req: Request,
    next: Next,
) -> impl Future<Output = Response> + Send {
    send(async move {
        let Some(session) = req.extensions().get::<Session>().cloned() else {
            return AppError::internal("App::auth needs App::sessions").into_response();
        };
        let (mut parts, body) = req.into_parts();
        let user = rt.0.auth.user(&session, &parts).await;
        if let Some(u) = &user {
            let v = Value::from(minijinja::value::Serde(u));
            session.set_user(v.clone());
            if let Some(f) = parts.extensions.get_mut::<Facts>() {
                f.user = Some(v);
            }
        }
        parts.extensions.insert(CurrentUser(user));
        parts.extensions.insert(LoginPath(rt.0.login.clone()));
        next.run(Request::from_parts(parts, body)).await
    })
}

/// An Argon2id (OWASP parameters: 19 MiB, 2 passes) PHC string for storage. Slow by design;
/// on Workers it takes a large share of the CPU and memory budget.
#[cfg(feature = "password")]
pub fn hash_password(password: &str) -> Result<String, AppError> {
    use argon2::password_hash::PasswordHasher as _;
    let salt = crate::util::random::<16>().map_err(AppError::internal)?;
    argon2::Argon2::default()
        .hash_password_with_salt(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(AppError::internal)
}

/// Checks `password` against a stored PHC string. Pass `None` for an unknown user: it still
/// hashes, so response time does not reveal which accounts exist.
#[cfg(feature = "password")]
pub fn verify_password(password: &str, phc: Option<&str>) -> bool {
    use argon2::password_hash::PasswordVerifier as _;
    static DUMMY: std::sync::OnceLock<String> = std::sync::OnceLock::new();
    let a = argon2::Argon2::default();
    match phc {
        Some(h) => a.verify_password(password.as_bytes(), h).is_ok(),
        None => {
            let d = DUMMY.get_or_init(|| hash_password("cascivo").unwrap_or_default());
            let _ = a.verify_password(password.as_bytes(), d.as_str());
            false
        }
    }
}

/// The start of an OAuth 2 authorization-code flow with PKCE (S256).
#[derive(Debug, Clone)]
pub struct OAuthStart {
    pub state: String,
    pub code_challenge: String,
}

/// A verified callback: send `code_verifier` with the token request, then redirect to `next`.
#[derive(Debug, Clone)]
pub struct OAuthCallback {
    pub code_verifier: String,
    pub next: Option<LocalPath>,
}

/// How long a started OAuth flow stays valid.
const OAUTH_TTL: u64 = 600;

impl OAuthStart {
    /// The provider's authorization URL with every parameter percent-encoded.
    pub fn authorize_url(
        &self,
        endpoint: &str,
        client_id: &str,
        redirect_uri: &str,
        scope: &str,
    ) -> String {
        let sep = if endpoint.contains('?') { '&' } else { '?' };
        format!(
            "{endpoint}{sep}response_type=code&client_id={}&redirect_uri={}&scope={}&state={}&code_challenge={}&code_challenge_method=S256",
            encode_component(client_id),
            encode_component(redirect_uri),
            encode_component(scope),
            self.state,
            self.code_challenge,
        )
    }
}

impl Session {
    /// Stores a fresh `state` and PKCE verifier for `provider` and returns what the
    /// authorization URL needs.
    pub fn oauth_begin(
        &self,
        provider: &str,
        next: Option<LocalPath>,
    ) -> Result<OAuthStart, AppError> {
        let state = token().map_err(AppError::internal)?;
        let verifier = token().map_err(AppError::internal)?;
        let code_challenge = b64(&Sha256::digest(verifier.as_bytes()));
        self.insert(
            &format!("_oauth.{provider}"),
            serde_json::json!({
                "state": state, "verifier": verifier, "at": now(),
                "next": next.as_ref().map(LocalPath::as_str),
            }),
        )?;
        Ok(OAuthStart {
            state,
            code_challenge,
        })
    }

    /// Checks the callback's `state` (constant time, within 10 minutes). One attempt per
    /// [`oauth_begin`](Self::oauth_begin): the stored state is removed whatever the outcome.
    pub fn oauth_callback(&self, provider: &str, state: &str) -> Option<OAuthCallback> {
        let v = self.remove(&format!("_oauth.{provider}"))?;
        let saved = v.get("state")?.as_str()?;
        let at = v.get("at")?.as_u64()?;
        if !ct_eq(saved.as_bytes(), state.as_bytes()) || now().saturating_sub(at) > OAUTH_TTL {
            return None;
        }
        Some(OAuthCallback {
            code_verifier: v.get("verifier")?.as_str()?.to_owned(),
            next: v
                .get("next")
                .and_then(|n| n.as_str())
                .and_then(|n| LocalPath::parse(n).ok()),
        })
    }
}
