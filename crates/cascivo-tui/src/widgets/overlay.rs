use ratatui::crossterm::event::KeyCode;

use super::support::{plain, pressed};
use crate::node::{Node, Placement, col, row, text};

/// How many toasts [`toasts`] shows at once; older ones are dropped from the view.
pub const MAX_TOASTS: usize = 3;

/// A toast's severity: picks its border and text colour and a leading glyph (so it is not
/// colour-only).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    /// Neutral information.
    Info,
    /// Something worked.
    Success,
    /// Something needs attention.
    Warning,
    /// Something failed.
    Danger,
}

impl Kind {
    fn role(self) -> &'static str {
        match self {
            Self::Info => "info",
            Self::Success => "success",
            Self::Warning => "warning",
            Self::Danger => "danger",
        }
    }

    fn glyph(self) -> &'static str {
        match self {
            Self::Info => "i",
            Self::Success => "✓",
            Self::Warning => "!",
            Self::Danger => "✗",
        }
    }
}

/// A modal dialog drawn over the rest of the view, centered, sized to `body` and shrunk to
/// fit the screen (never larger than it).
///
/// While it is in the tree focus and keys are trapped inside it: Tab cycles only the
/// focusable nodes (those with an `.id`) of `body`, the app keymap is skipped, and Esc emits
/// `on_close`. The app owns visibility: stop including the node (state flag in `view`) to
/// close it. Put it as the last child of the root container, after the base content, so
/// it paints over it; give the root a size (default: fills the screen).
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let body: Node<&str> = col("", [text("Delete?").into(), button("Yes", "yes").id("yes")]);
/// let ui: Node<&str> = col("", [text("page").into(), modal("Confirm", body, "close")]);
/// let s = render_to_string(&ui, 20, 8).unwrap();
/// assert!(s.contains("Confirm") && s.contains("Delete?"));
/// assert_eq!(ui.active_modal().unwrap().find("yes").is_some(), true);
/// ```
pub fn modal<M: Clone + 'static>(title: &str, body: Node<M>, on_close: M) -> Node<M> {
    col("border rounded bg-surface2 px-1", [body])
        .title(title)
        .overlay(Placement::Center)
        .trap(move |k| (pressed(k) && plain(k) && k.code == KeyCode::Esc).then(|| on_close.clone()))
}

/// One toast: a bordered one-line message. Compose several with [`toasts`].
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = toast(Kind::Success, "Saved");
/// assert!(render_to_string(&n, 12, 3).unwrap().contains("✓ Saved"));
/// ```
pub fn toast<M>(kind: Kind, msg: &str) -> Node<M> {
    row(
        &format!(
            "border rounded px-1 bg-surface2 border-{r} text-{r}",
            r = kind.role()
        ),
        vec![
            text(format!("{} {msg}", kind.glyph()))
                .class("truncate")
                .into(),
        ],
    )
}

/// A bottom-right stack of the newest [`MAX_TOASTS`] of `items` (oldest first, newest at the
/// bottom), drawn over the rest of the view.
///
/// The app owns lifetimes: keep the list in state, push on an event and schedule its removal
/// with `Cmd::tick(ms, Msg::Expire(id))`. Place it last among the root's children.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let items = [(Kind::Info, "one".to_string()), (Kind::Danger, "two".to_string())];
/// let ui: Node = col("", [text("page").into(), toasts(&items)]);
/// let s = render_to_string(&ui, 20, 8).unwrap();
/// assert!(s.contains("i one") && s.contains("✗ two"));
/// ```
pub fn toasts<M>(items: &[(Kind, String)]) -> Node<M> {
    let shown = items.len().saturating_sub(MAX_TOASTS);
    let kids: Vec<Node<M>> = items
        .iter()
        .skip(shown)
        .map(|(k, m)| toast(*k, m))
        .collect();
    col("", kids).overlay(Placement::BottomRight)
}
