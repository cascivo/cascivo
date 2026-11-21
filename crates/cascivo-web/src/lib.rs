//! cascivo-web (spike): static sites from Markdown, content collections and minijinja layouts,
//! with components rendered by [`cascivo_html`].
//!
//! A site is a folder:
//!
//! ```text
//! site.toml                 title, base_url, lang, theme
//! content/<name>/_schema.toml + *.md   collections (TOML front matter between `+++`)
//! layouts/*.html            minijinja templates
//! pages/**.md | **.html     routes; `pages/blog/[posts].html` renders once per `posts` entry
//! public/**                 copied as-is
//! ```
//!
//! [`Site::load`] reads everything into memory; [`Site::render`] returns an [`Output`] file map
//! that `build` writes to `dist/`, `dev` serves with live reload, and (feature `axum`)
//! [`router`] serves from an `axum::Router`.

pub mod assets;
#[cfg(feature = "axum")]
mod axum;
pub mod config;
pub mod content;
pub mod data;
pub mod deploy;
pub mod dev;
pub mod error;
pub mod head;
pub mod highlight;
pub mod i18n;
pub mod images;
pub mod islands;
pub mod markdown;
pub mod out;
pub mod routes;
pub mod rss;
pub mod site;
pub mod starter;
pub mod theme;
pub mod vite;
pub mod web;

#[cfg(feature = "axum")]
pub use crate::axum::router;
pub use config::Config;
pub use error::{Error, Errors, Result};
pub use out::Output;
pub use site::Site;
