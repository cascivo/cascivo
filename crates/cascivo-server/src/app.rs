use std::sync::Arc;

use axum::Router;
use axum::extract::{Request, State};
use axum::middleware::{Next, from_fn_with_state};
use axum::response::{IntoResponse, Response};
use cascivo_web::{Engine, Flash};
use minijinja::Value;

use crate::auth::AuthRt;
use crate::csrf::CsrfRt;
use crate::headers::Compiled;
use crate::session::SessionRt;
use crate::util::Local;
use crate::view::Req;
use crate::{
    AppError, Authenticator, Csrf, Headers, Hx, LocalPath, Nonce, SessionConfig, SessionStore, View,
};

type Wrap = Box<dyn FnOnce(Router) -> Router>;

/// Per-request template facts besides path and nonce. The session layer ([`App::sessions`])
/// puts them in the request extensions (`Extension<Facts>`; `user` from [`App::auth`]) and,
/// for a [`View`] response, the current ones (CSRF token after a rotation, flash taken from
/// the session) in the response extensions. A handler may set its own with
/// `Extension(facts)`; the session fills the fields it leaves empty. `locale` empty = the
/// default locale (the session's `locale` key sets it).
#[derive(Debug, Clone, Default)]
pub struct Facts {
    pub locale: String,
    pub csrf: Option<String>,
    pub user: Option<Value>,
    pub flash: Vec<Flash>,
}

/// The app builder: routes plus the layer that renders [`View`]s and adds security headers.
#[must_use]
pub struct App<S = ()> {
    engine: Engine,
    router: Router<S>,
    state: S,
    stateless: Router,
    headers: Headers,
    toaster: Option<(&'static str, &'static str)>,
    sessions: Option<Wrap>,
    auth: Option<Wrap>,
    csrf: Csrf,
}

impl App<()> {
    pub fn new(engine: Engine) -> Self {
        Self {
            engine,
            router: Router::new(),
            state: (),
            stateless: Router::new(),
            headers: Headers::default(),
            toaster: None,
            sessions: None,
            auth: None,
            csrf: Csrf::default(),
        }
    }
}

impl<S: Clone + Send + Sync + 'static> App<S> {
    /// Routes added from here on get `State<T>`; earlier ones keep their state.
    pub fn with_state<T: Clone + Send + Sync + 'static>(self, s: T) -> App<T> {
        App {
            engine: self.engine,
            router: Router::new(),
            state: s,
            stateless: self.stateless.merge(self.router.with_state(self.state)),
            headers: self.headers,
            toaster: self.toaster,
            sessions: self.sessions,
            auth: self.auth,
            csrf: self.csrf,
        }
    }

    pub fn routes(mut self, r: Router<S>) -> Self {
        self.router = self.router.merge(r);
        self
    }

    /// Replaces the default (strict) security headers.
    pub fn security_headers(mut self, cfg: Headers) -> Self {
        self.headers = cfg;
        self
    }

    /// The block that renders toasts (it sees them as `flash`); a partial htmx response
    /// appends it to `#cv-toaster` out of band.
    pub fn toaster(mut self, tpl: &'static str, block: &'static str) -> Self {
        self.toaster = Some((tpl, block));
        self
    }

    /// Sessions in `store`: the [`Session`](crate::Session) extractor, CSRF tokens, flash
    /// messages and [`Facts`]. Turns on the CSRF token check ([`csrf`](Self::csrf)).
    pub fn sessions<St: SessionStore>(mut self, store: St, cfg: SessionConfig) -> Self {
        let rt = Local(Arc::new(SessionRt {
            store,
            name: cfg.cookie_name(),
            cfg,
        }));
        self.sessions = Some(Box::new(move |r: Router| {
            r.layer(from_fn_with_state(rt, crate::session::layer::<St>))
        }));
        self
    }

    /// The user behind each request ([`User`](crate::User), [`MaybeUser`](crate::MaybeUser),
    /// `user` in templates). Needs [`sessions`](Self::sessions).
    ///
    /// # Panics
    /// When `A::LOGIN` is not a [`LocalPath`].
    pub fn auth<A: Authenticator>(mut self, auth: A) -> Self {
        let login = LocalPath::parse(A::LOGIN)
            .unwrap_or_else(|_| panic!("cascivo-server: LOGIN {:?} is not a local path", A::LOGIN));
        let rt = Local(Arc::new(AuthRt { auth, login }));
        self.auth = Some(Box::new(move |r: Router| {
            r.layer(from_fn_with_state(rt, crate::auth::layer::<A>))
        }));
        self
    }

    /// Replaces the default CSRF settings (on for every unsafe method; opt routes out with
    /// [`Csrf::exempt`]).
    pub fn csrf(mut self, cfg: Csrf) -> Self {
        self.csrf = cfg;
        self
    }

    /// # Panics
    /// When a [`Headers`] value is not a valid header value: failing at startup beats
    /// serving without a CSP. When [`auth`](Self::auth) is set without
    /// [`sessions`](Self::sessions).
    pub fn into_router(self) -> Router {
        let headers = self
            .headers
            .compile()
            .unwrap_or_else(|e| panic!("cascivo-server: {e}"));
        let rt = Arc::new(Runtime {
            engine: self.engine,
            headers,
            toaster: self.toaster,
        });
        assert!(
            self.auth.is_none() || self.sessions.is_some(),
            "cascivo-server: App::auth needs App::sessions"
        );
        let csrf = Arc::new(CsrfRt {
            cfg: self.csrf,
            tokens: self.sessions.is_some(),
        });
        let router: Router = self.router.with_state(self.state);
        // Outermost first: render (nonce, headers) → session → auth → CSRF → routes.
        let mut r = router
            .merge(self.stateless)
            .layer(from_fn_with_state(csrf, crate::csrf::layer));
        if let Some(auth) = self.auth {
            r = auth(r);
        }
        if let Some(sessions) = self.sessions {
            r = sessions(r);
        }
        r.layer(from_fn_with_state(rt, layer))
    }

    /// Binds `addr` and serves until the process ends.
    #[cfg(feature = "native")]
    pub async fn serve(self, addr: impl tokio::net::ToSocketAddrs) -> std::io::Result<()> {
        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, self.into_router()).await
    }
}

struct Runtime {
    engine: Engine,
    headers: Compiled,
    toaster: Option<(&'static str, &'static str)>,
}

async fn layer(State(rt): State<Arc<Runtime>>, mut req: Request, next: Next) -> Response {
    let nonce = match Nonce::generate() {
        Ok(n) => n,
        Err(e) => {
            return AppError::internal(format!("no randomness for the CSP nonce: {e}"))
                .into_response();
        }
    };
    req.extensions_mut().insert(nonce.clone());
    let hx = Hx::from_headers(req.headers());
    let path = req.uri().path().to_owned();
    let facts = req.extensions().get::<Facts>().cloned();
    let mut res = next.run(req).await;
    if let Some(view) = res.extensions_mut().remove::<View>() {
        let facts = res
            .extensions_mut()
            .remove::<Facts>()
            .or(facts)
            .unwrap_or_default();
        let (mut parts, _) = res.into_parts();
        let r = Req {
            hx: &hx,
            path: &path,
            nonce: nonce.as_str(),
            facts,
        };
        res = match view.render(&rt.engine, rt.toaster, r, &mut parts) {
            Ok(html) => Response::from_parts(parts, html.into()),
            Err(e) => e.into_response(),
        };
    }
    rt.headers.apply(res.headers_mut(), &nonce);
    res
}
