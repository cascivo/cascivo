use std::sync::Arc;

use axum::Router;
use axum::extract::{Request, State};
use axum::middleware::{Next, from_fn_with_state};
use axum::response::{IntoResponse, Response};
use cascivo_web::{Engine, Flash};
use minijinja::Value;

use crate::headers::Compiled;
use crate::view::Req;
use crate::{AppError, Headers, Hx, Nonce, View};

/// Per-request template facts besides path and nonce. A layer outside the [`App`] router
/// (sessions, auth) puts them in the request extensions; a handler or inner layer may override
/// them for its response with `Extension(facts)`. `locale` empty = the default locale.
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

    /// # Panics
    /// When a [`Headers`] value is not a valid header value: failing at startup beats
    /// serving without a CSP.
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
        let router: Router = self.router.with_state(self.state);
        router
            .merge(self.stateless)
            .layer(from_fn_with_state(rt, layer))
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
