//! Focus ring state.

/// Which focusable id has focus, plus the ring it was last seen in.
///
/// The ring is always passed in by the caller: take `LayoutOut::focus` ids from the latest
/// render (tree order, hidden nodes already skipped). For a modal trap the runtime passes
/// only the ids of the modal subtree (render the modal node on its own, or filter the list
/// to its descendants) while the modal is open, and the full list again after it closes.
/// Focus is not restored to the pre-modal id automatically; the runtime can [`set`](Self::set) it.
///
/// ```
/// use cascivo_tui::Focus;
///
/// let ring = vec!["a".to_string(), "b".to_string()];
/// let mut f = Focus::default();
/// f.sync(&ring);
/// assert_eq!(f.current(), Some("a"));
/// assert_eq!(f.next(&ring), Some("b"));
/// assert_eq!(f.next(&ring), Some("a")); // wraps
/// ```
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Focus {
    current: Option<String>,
    ring: Vec<String>,
}

impl Focus {
    /// The focused id, if any.
    pub fn current(&self) -> Option<&str> {
        self.current.as_deref()
    }

    /// Focuses `id` directly (not validated until the next [`sync`](Self::sync)).
    pub fn set(&mut self, id: &str) {
        self.current = Some(id.to_owned());
    }

    /// Moves to the next id in `ids`, wrapping; with no current (or one not in `ids`),
    /// goes to the first. Returns the new focus; `None` for an empty ring.
    pub fn next(&mut self, ids: &[String]) -> Option<&str> {
        self.step(ids, 1)
    }

    /// Like [`next`](Self::next) but backwards; from nothing goes to the last.
    pub fn prev(&mut self, ids: &[String]) -> Option<&str> {
        self.step(ids, ids.len().saturating_sub(1))
    }

    fn step(&mut self, ids: &[String], by: usize) -> Option<&str> {
        let pos = self
            .current
            .as_ref()
            .and_then(|c| ids.iter().position(|i| i == c));
        let at = match pos {
            Some(p) => Some((p + by) % ids.len()),
            None if ids.is_empty() => None,
            None if by == 1 => Some(0),
            None => Some(ids.len() - 1),
        };
        self.current = at.and_then(|i| ids.get(i).cloned());
        self.ring = ids.to_vec();
        self.current()
    }

    /// Reconciles focus with a fresh ring after a re-render: keeps the current id if it is
    /// still present; otherwise moves to the first later id of the previous ring that still
    /// exists, else the first id. An empty ring clears focus.
    pub fn sync(&mut self, ids: &[String]) {
        let keep = self.current.as_ref().is_some_and(|c| ids.contains(c));
        if !keep {
            let after = self
                .current
                .as_ref()
                .and_then(|c| self.ring.iter().position(|i| i == c))
                .and_then(|p| self.ring[p + 1..].iter().find(|i| ids.contains(i)));
            self.current = after.or_else(|| ids.first()).cloned();
        }
        self.ring = ids.to_vec();
    }
}
