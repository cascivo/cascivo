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
    /// Focus the widget with this id after the next view, so an id that view adds can be
    /// focused. An id not in the new focus ring is ignored.
    Focus(String),
    /// Move focus to the next id of the ring after the next view (like Tab).
    FocusNext,
    /// Move focus to the previous id of the ring after the next view (like Shift-Tab).
    FocusPrev,
    /// Run the closure off the UI thread and deliver its result to `update`. [`run`](crate::run)
    /// uses a worker thread; [`TestApp`](crate::TestApp) runs it inline, so tests stay
    /// deterministic.
    Task(Task<M>),
}

/// The closure inside [`Cmd::Task`].
pub type Task<M> = Box<dyn FnOnce() -> M + Send>;

// Hand-written because a `Task` closure has no Debug or PartialEq (and `Cmd` is not Clone).
impl<M: std::fmt::Debug> std::fmt::Debug for Cmd<M> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::None => f.write_str("None"),
            Self::Quit => f.write_str("Quit"),
            Self::Msg(m) => f.debug_tuple("Msg").field(m).finish(),
            Self::Batch(v) => f.debug_tuple("Batch").field(v).finish(),
            Self::Tick(d, m) => f.debug_tuple("Tick").field(d).field(m).finish(),
            Self::SetTheme(n) => f.debug_tuple("SetTheme").field(n).finish(),
            Self::Focus(id) => f.debug_tuple("Focus").field(id).finish(),
            Self::FocusNext => f.write_str("FocusNext"),
            Self::FocusPrev => f.write_str("FocusPrev"),
            Self::Task(_) => f.write_str("Task(..)"),
        }
    }
}

/// Structural equality; a [`Cmd::Task`] equals nothing, not even itself.
impl<M: PartialEq> PartialEq for Cmd<M> {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::None, Self::None)
            | (Self::Quit, Self::Quit)
            | (Self::FocusNext, Self::FocusNext)
            | (Self::FocusPrev, Self::FocusPrev) => true,
            (Self::Msg(a), Self::Msg(b)) => a == b,
            (Self::Batch(a), Self::Batch(b)) => a == b,
            (Self::Tick(d, a), Self::Tick(e, b)) => d == e && a == b,
            (Self::SetTheme(a), Self::SetTheme(b)) | (Self::Focus(a), Self::Focus(b)) => a == b,
            _ => false,
        }
    }
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

    /// [`Cmd::Focus`] from anything string-like.
    pub fn focus(id: impl Into<String>) -> Self {
        Self::Focus(id.into())
    }

    /// [`Cmd::Task`] from a closure.
    ///
    /// ```
    /// use cascivo_tui::Cmd;
    ///
    /// let c: Cmd<u32> = Cmd::task(|| 6 * 7);
    /// assert!(matches!(c, Cmd::Task(_)));
    /// ```
    pub fn task(f: impl FnOnce() -> M + Send + 'static) -> Self {
        Self::Task(Box::new(f))
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
