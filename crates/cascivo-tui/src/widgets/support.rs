//! Shared helpers for the focusable widgets (key filtering, scroll memory).

use std::cell::Cell;
use std::rc::Rc;

use ratatui::crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyModifiers};

/// A scroll position the app can keep across frames.
///
/// Widgets are rebuilt on every `view`, so a bare widget scrolls just enough to keep the
/// selection visible *starting from the top*. Pass the same `Scroll` (cloned handle) on every
/// build with `.scroll(&scroll)` and the window moves minimally instead: it stays put while
/// the selection moves inside it.
///
/// ```
/// use cascivo_tui::widgets::Scroll;
///
/// let s = Scroll::default();
/// assert_eq!(s.offset(), 0);
/// ```
#[derive(Debug, Clone, Default)]
pub struct Scroll(Rc<Cell<usize>>);

impl Scroll {
    /// The first visible row as of the last render.
    pub fn offset(&self) -> usize {
        self.0.get()
    }

    /// Moves the window the least needed so `selected` is inside `rows` rows of `len` items;
    /// returns the new offset.
    pub(super) fn follow(&self, selected: usize, len: usize, rows: usize) -> usize {
        let rows = rows.max(1);
        let mut off = self.0.get();
        if selected < off {
            off = selected;
        } else if selected >= off + rows {
            off = selected + 1 - rows;
        }
        off = off.min(len.saturating_sub(rows));
        self.0.set(off);
        off
    }
}

/// Key presses and repeats only; a release never acts.
pub(super) fn pressed(key: &KeyEvent) -> bool {
    key.kind != KeyEventKind::Release
}

/// No Ctrl/Alt held (Shift is fine: it makes uppercase letters).
pub(super) fn plain(key: &KeyEvent) -> bool {
    !key.modifiers
        .intersects(KeyModifiers::CONTROL | KeyModifiers::ALT)
}

/// What a navigation key asks of a list-like widget.
pub(super) enum Nav {
    /// Select this (already clamped) index.
    Move(usize),
    /// Activate the selected row.
    Activate,
}

/// `j`/`k`/`↓`/`↑` move by one and clamp (no wrap); Enter activates. Empty collections
/// consume nothing.
pub(super) fn nav(key: &KeyEvent, len: usize, selected: usize) -> Option<Nav> {
    if len == 0 || !pressed(key) || !plain(key) {
        return None;
    }
    let sel = selected.min(len - 1);
    match key.code {
        KeyCode::Char('j') | KeyCode::Down => Some(Nav::Move((sel + 1).min(len - 1))),
        KeyCode::Char('k') | KeyCode::Up => Some(Nav::Move(sel.saturating_sub(1))),
        KeyCode::Enter => Some(Nav::Activate),
        _ => None,
    }
}
