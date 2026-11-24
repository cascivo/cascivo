//! Cloudflare Workers adapter for [`cascivo_server`] (Phase 3, workstream F).
//!
//! [`serve`] runs an axum [`Router`](axum::Router) (usually `App::into_router()`) for one
//! Workers `fetch` event and puts the [`worker::Env`] in the request extensions, where the
//! [`Env`], [`D1`] and [`R2`] extractors find it. [`KvStore`] is a
//! [`SessionStore`](cascivo_server::SessionStore) on Workers KV.
//!
//! ```ignore
//! #[worker::event(fetch)]
//! async fn fetch(req: worker::HttpRequest, env: worker::Env, _: worker::Context)
//!     -> worker::Result<axum::http::Response<axum::body::Body>> {
//!     cascivo_worker::serve(req, env, app).await
//! }
//! ```
//!
//! Handlers that await a binding (D1, R2, KV) hold `!Send` JS futures; axum wants `Send`
//! handler futures, so mark them `#[worker::send]` (Workers is single-threaded).
//!
//! Features (all default): `kv` ([`KvStore`]), `d1` ([`D1`]), `r2` ([`R2`], [`Upload`]).

mod extract;
#[cfg(feature = "kv")]
mod kv;
#[cfg(feature = "r2")]
mod r2;
mod serve;

#[cfg(feature = "d1")]
pub use extract::D1;
#[cfg(feature = "r2")]
pub use extract::R2;
pub use extract::{Bindings, Env};
#[cfg(feature = "kv")]
pub use kv::{KvBackend, KvStore, MIN_TTL};
#[cfg(feature = "r2")]
pub use r2::{Stored, Upload, UploadError};
pub use serve::{serve, serve_router, serve_with};
pub use worker;
