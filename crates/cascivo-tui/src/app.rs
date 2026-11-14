//! The application contract: [`App`] and [`Cmd`].

use std::time::Duration;

use crate::keys::Keymap;
use crate::node::Node;

/// A side effect requested by [`App::init`] or [`App::update`].
///
/// ```
/// use cascivo_tui::Cmd;
///
/// let c = Cmd::batch([Cmd::Msg(1), Cmd::tick(500, 2), Cmd::Quit]);
/// assert!(matches!(c, Cmd::Batch(v) if v.len() == 3));
/// ```
#[derive(Debug, Clone, PartialEq)]
pub enum Cmd<M> {
    /// Nothing.
    None,
    /// Stop the runtime after the current event is fully processed.
    Quit,
    /// Feed `M` straight back into [`App::update`] (chains are depth-limited).
    Msg(M),
    /// Run each command in order.
    Batch(Vec<Cmd<M>>),
    /// Deliver `M` to `update` once, after the duration.
    Tick(Duration, M),
    /// Switch to the named theme on the next draw (keeps the terminal's colour depth). An
    /// unknown name is a runtime fault that paints the error panel, so typos are loud.
    SetTheme(String),
}

impl<M> Cmd<M> {
    /// [`Cmd::None`].
    pub fn none() -> Self {
        Self::None
    }

    /// [`Cmd::Tick`] with milliseconds.
    pub fn tick(ms: u64, msg: M) -> Self {
        Self::Tick(Duration::from_millis(ms), msg)
    }

    /// [`Cmd::Batch`] from any iterator.
    pub fn batch(cmds: impl IntoIterator<Item = Self>) -> Self {
        Self::Batch(cmds.into_iter().collect())
    }
}

/// An application: state, a pure `view`, and `update` for messages.
///
/// Focus is runtime state (widgets declare ids with [`Node::id`]). A key goes to the focused
/// widget, then [`keys`](Self::keys), then Tab/Shift-Tab focus movement; an open modal
/// ([`Widget::traps_focus`](crate::node::Widget::traps_focus)) confines focus and skips
/// `keys`. `ctrl+c` always quits, whatever the app binds.
///
/// ```no_run
/// use cascivo_tui::prelude::*;
///
/// #[derive(Clone)]
/// enum Msg { Inc, Quit }
///
/// struct Counter(i32);
///
/// impl App for Counter {
///     type Msg = Msg;
///     fn update(&mut self, msg: Msg) -> Cmd<Msg> {
///         match msg {
///             Msg::Inc => { self.0 += 1; Cmd::none() }
///             Msg::Quit => Cmd::Quit,
///         }
///     }
///     fn view(&self) -> Node<Msg> {
///         col("p-1", [text(format!("count: {}", self.0)).into()])
///     }
///     fn keys(&self) -> Keymap<Msg> {
///         Keymap::new().bind("+", "add", Msg::Inc).bind("q", "quit", Msg::Quit)
///     }
/// }
///
/// fn main() -> Result<(), TuiError> {
///     run(Counter(0))
/// }
/// ```
pub trait App {
    /// The message type; cloned out of keymaps and widgets.
    type Msg: Clone + 'static;

    /// Runs once before the first draw.
    fn init(&mut self) -> Cmd<Self::Msg> {
        Cmd::None
    }

    /// Applies a message.
    fn update(&mut self, msg: Self::Msg) -> Cmd<Self::Msg>;

    /// Builds the tree for the current state. Called per draw and per key; keep it pure.
    fn view(&self) -> Node<Self::Msg>;

    /// App-wide bindings, consulted after the focused widget. Ignored while a modal is open.
    fn keys(&self) -> Keymap<Self::Msg> {
        Keymap::new()
    }
}
