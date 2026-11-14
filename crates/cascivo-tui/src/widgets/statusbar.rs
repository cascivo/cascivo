use crate::node::{Node, row, text};

/// A one-row bar on the raised surface: `left` truncates, `right` stays whole.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = statusbar("ready", "q quit");
/// assert_eq!(n.children().len(), 2);
/// ```
pub fn statusbar<M>(left: impl Into<String>, right: impl Into<String>) -> Node<M> {
    row(
        "h-1 bg-surface2 px-1 gap-1 justify-between",
        vec![
            text(left).class("truncate grow").into(),
            text(right).class("nowrap shrink-0").into(),
        ],
    )
}
