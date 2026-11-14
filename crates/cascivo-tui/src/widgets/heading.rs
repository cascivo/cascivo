use crate::node::{Node, text};

/// Bold accent-coloured text.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = heading("Title");
/// assert_eq!(n.classes(), "bold text-accent");
/// ```
pub fn heading<M>(s: impl Into<String>) -> Node<M> {
    text(s).bold().class("text-accent").into()
}
