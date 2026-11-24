//! A dynamic cascivo app: notes CRUD behind sign-in, a Solid island, a server island, SSE.
//! `app` is the router every target shares; `main.rs` serves it with tokio.

pub mod app;
pub mod auth;
pub mod demo;
pub mod notes;
mod platform;

pub use app::{engine, router, secret};
