//! Widgets: static ([`card`], [`heading`], [`statusbar`], [`progress`], [`sparkline`]) and
//! focusable ([`button`], [`input`], [`list`], [`tabs`], [`table`]); overlays ([`modal`],
//! [`toast`], [`toasts`]) and [`keyhints`].
//!
//! Focusable widgets hold a snapshot of the app's state (value, selection) and turn keys
//! into messages; they keep no state of their own. Give the returned node an `.id("..")`,
//! or it never joins the focus ring.

mod button;
mod card;
mod heading;
mod input;
mod keyhints;
mod list;
mod overlay;
mod progress;
mod sparkline;
mod statusbar;
mod support;
mod table;
mod tabs;

pub use button::button;
pub use card::card;
pub use heading::heading;
pub use input::{Cursor, Input, input};
pub use keyhints::keyhints;
pub use list::{List, list};
pub use overlay::{Kind, MAX_TOASTS, modal, toast, toasts};
pub use progress::progress;
pub use sparkline::sparkline;
pub use statusbar::statusbar;
pub use support::Scroll;
pub use table::{Col, Table, table};
pub use tabs::tabs;
