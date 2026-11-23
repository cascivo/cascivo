//! axum layer for dynamic cascivo apps (Phase 3, workstream B1).
//!
//! Handlers return data as a [`View`]; the [`App`] layer renders it with a
//! [`cascivo_web::Engine`]: the whole page, or only the named block for a (non-boosted) htmx
//! request, plus out-of-band swaps, toasts and `HX-*` response headers. One template gives both
//! shapes, so a fragment is always the same markup as that part of the page
//! ([`check_fragment`]). Every response gets security headers and a strict CSP whose
//! per-request [`Nonce`] the engine's `theme_script()` and `islands_script()` carry.
//!
//! Sessions ([`App::sessions`]: [`CookieStore`], [`MemoryStore`], `SqliteStore`, or any
//! [`SessionStore`]) carry the CSRF token and flash messages and fill [`Facts`]; [`Csrf`]
//! checks every unsafe method; an [`Authenticator`] ([`App::auth`]) feeds [`User`] and
//! [`MaybeUser`].
//!
//! Untrusted input: `HX-*` request headers are facts ([`Hx`]); they never pick a template or a
//! block. Redirect targets are [`LocalPath`]s.
//!
//! Features: `native` (default; tokio, [`App::serve`]), `password` (default; Argon2id),
//! `sqlite` (`SqliteStore`, sqlx) and `workers` (wasm32 Workers without
//! tokio; [`MaybeSend`] has no `Send` bound when `native` is off).

mod app;
mod auth;
mod csrf;
mod error;
mod headers;
mod hx;
mod path;
mod session;
mod stores;
mod util;
mod view;

pub use app::{App, Facts};
pub use auth::{Authenticator, MaybeUser, OAuthCallback, OAuthStart, User};
#[cfg(feature = "password")]
pub use auth::{hash_password, verify_password};
pub use cascivo_web::{Engine, Flash, ReqCtx};
pub use csrf::Csrf;
pub use error::AppError;
pub use headers::{Headers, Nonce};
pub use hx::Hx;
pub use path::{LocalPath, LocalPathError, see_other};
pub use session::{Record, SameSite, Session, SessionConfig, SessionId, SessionStore, StoreError};
#[cfg(feature = "sqlite")]
pub use stores::SqliteStore;
pub use stores::{CookieStore, MemoryStore};
pub use view::{ToastKind, View, check_fragment};

/// `Send` on native targets, nothing on Workers (`workers` without `native`), whose
/// futures and bindings are `!Send`. Bound traits that must work on both with this.
#[cfg(any(feature = "native", not(feature = "workers")))]
pub trait MaybeSend: Send {}
#[cfg(any(feature = "native", not(feature = "workers")))]
impl<T: Send + ?Sized> MaybeSend for T {}

/// `Send` on native targets, nothing on Workers (`workers` without `native`), whose
/// futures and bindings are `!Send`. Bound traits that must work on both with this.
#[cfg(all(feature = "workers", not(feature = "native")))]
pub trait MaybeSend {}
#[cfg(all(feature = "workers", not(feature = "native")))]
impl<T: ?Sized> MaybeSend for T {}
