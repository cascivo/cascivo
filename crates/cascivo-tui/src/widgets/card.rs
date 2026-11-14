use crate::node::{Node, col};

/// A rounded, bordered surface with `title` on the top border (cut with `…` when too long).
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = card("Stats", "", [text("ok").into()]);
/// assert_eq!(n.border_title(), Some("Stats"));
/// ```
pub fn card<M>(title: &str, class: &str, children: impl Into<Vec<Node<M>>>) -> Node<M> {
    col("border rounded bg-surface px-1", children)
        .title(title)
        .class(class)
}
