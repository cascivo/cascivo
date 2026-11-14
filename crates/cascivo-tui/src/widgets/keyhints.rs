use crate::keys::Keymap;
use crate::node::{Node, text};

/// A one-line hint bar from the app keymap: `q quit · tab focus`.
///
/// Lists bindings made with [`Keymap::bind`] in bind order (ambient ones are skipped) and
/// always ends with `tab focus`. Too narrow for the line: it is cut with `…`.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let km = Keymap::new().bind("q", "quit", 1).ambient("ctrl+c", 2);
/// let n: Node<i32> = keyhints(&km);
/// assert_eq!(render_to_string(&n, 40, 1).unwrap(), "q quit · tab focus");
/// ```
pub fn keyhints<M>(keys: &Keymap<M>) -> Node<M> {
    let mut parts: Vec<String> = keys
        .hints()
        .into_iter()
        .map(|(c, h)| format!("{c} {h}"))
        .collect();
    parts.push("tab focus".to_owned());
    text(parts.join(" · ")).class("truncate text-muted").into()
}
