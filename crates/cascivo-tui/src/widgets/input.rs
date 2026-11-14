use std::cell::Cell;
use std::rc::Rc;

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{KeyCode, KeyEvent};
use ratatui::layout::{Direction, Rect};
use ratatui::style::Modifier;

use super::support::{plain, pressed};
use crate::class::Role;
use crate::layout::RenderCx;
use crate::node::{Node, Widget, str_width};

/// A text cursor the app can keep across frames, counted in `char`s.
///
/// Widgets are rebuilt on every `view`, so the cursor lives in the app: store one `Cursor`
/// and pass it to every build with [`Input::cursor`]. A fresh `Cursor` sits at the end of
/// the text. The widget moves it itself on Left/Right/Home/End and after edits; cloned
/// handles share one position.
///
/// ```
/// use cascivo_tui::widgets::Cursor;
///
/// let c = Cursor::default();
/// assert_eq!(c.get(), None); // at the end
/// c.set(2);
/// assert_eq!(c.get(), Some(2));
/// ```
#[derive(Debug, Clone, Default)]
pub struct Cursor(Rc<Cell<Option<usize>>>);

impl Cursor {
    /// The cursor position in chars, or `None` for the end of the text.
    pub fn get(&self) -> Option<usize> {
        self.0.get()
    }

    /// Puts the cursor before the `pos`-th char (clamped to the text when drawn or edited).
    pub fn set(&self, pos: usize) {
        self.0.set(Some(pos));
    }
}

/// A single-line text field under construction; converts into a [`Node`] with `.into()` or
/// [`Input::id`].
pub struct Input<M> {
    value: String,
    placeholder: String,
    on_change: Rc<dyn Fn(String) -> M>,
    on_submit: Option<M>,
    cursor: Cursor,
    class: String,
}

/// A single-line text field showing `value` (or the muted `placeholder` when empty).
///
/// Typing inserts at the cursor; Backspace/Delete remove the char before/at it; Left, Right,
/// Home and End move it. Every one of those keys emits `on_change(new_value)`; a pure cursor
/// move emits the unchanged value, so the app just stores whatever it receives. Editing is by
/// `char`, never splits a UTF-8 sequence, and skips keys held with Ctrl or Alt. A bracketed
/// paste arrives as an event, not key presses, and is ignored. Enter emits
/// [`on_submit`](Input::on_submit) if set; Tab and anything else pass through.
///
/// The node only joins the focus ring once it has an id. Focus shows the cursor cell
/// reversed, besides the `focus:` colours. Without [`Input::cursor`] the cursor is always at
/// the end, so Left/Right/Home/End do nothing visible.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node<String> = input("héllo", "name", |s| s).id("name");
/// assert_eq!(render_to_string(&n, 10, 1).unwrap(), " héllo");
/// ```
pub fn input<M>(
    value: &str,
    placeholder: &str,
    on_change: impl Fn(String) -> M + 'static,
) -> Input<M> {
    Input {
        value: value.to_owned(),
        placeholder: placeholder.to_owned(),
        on_change: Rc::new(on_change),
        on_submit: None,
        cursor: Cursor::default(),
        class: String::new(),
    }
}

impl<M> Input<M> {
    /// Emits a clone of `msg` on Enter.
    #[must_use]
    pub fn on_submit(mut self, msg: M) -> Self {
        self.on_submit = Some(msg);
        self
    }

    /// Keeps the cursor in `cursor` (see [`Cursor`]).
    #[must_use]
    pub fn cursor(mut self, cursor: &Cursor) -> Self {
        self.cursor = cursor.clone();
        self
    }

    /// Appends classes.
    #[must_use]
    pub fn class(mut self, class: &str) -> Self {
        self.class.push(' ');
        self.class.push_str(class);
        self
    }

    /// Builds the node with focus id `id`.
    pub fn id(self, id: &str) -> Node<M>
    where
        M: Clone + 'static,
    {
        Node::from(self).id(id)
    }
}

impl<M: Clone + 'static> From<Input<M>> for Node<M> {
    fn from(i: Input<M>) -> Self {
        let class = format!("h-1 px-1 bg-surface2 focus:bg-surface {}", i.class);
        Node::leaf(
            class.trim(),
            InputW {
                value: i.value,
                placeholder: i.placeholder,
                on_change: i.on_change,
                on_submit: i.on_submit,
                cursor: i.cursor,
            },
        )
    }
}

struct InputW<M> {
    value: String,
    placeholder: String,
    on_change: Rc<dyn Fn(String) -> M>,
    on_submit: Option<M>,
    cursor: Cursor,
}

fn byte_at(s: &str, chars: usize) -> usize {
    s.char_indices().nth(chars).map_or(s.len(), |(b, _)| b)
}

/// Applies an editing/moving key to `value` with the cursor at `at` (in chars, already
/// clamped). Returns the new value and cursor, or `None` when the key is not ours.
fn edit(value: &str, at: usize, key: &KeyEvent) -> Option<(String, usize)> {
    if !pressed(key) {
        return None;
    }
    let n = value.chars().count();
    let mut v = value.to_owned();
    let to = match key.code {
        KeyCode::Char(c) if plain(key) => {
            v.insert(byte_at(value, at), c);
            at + 1
        }
        KeyCode::Backspace if at > 0 => {
            v.remove(byte_at(value, at - 1));
            at - 1
        }
        KeyCode::Delete if at < n => {
            v.remove(byte_at(value, at));
            at
        }
        KeyCode::Backspace | KeyCode::Delete => at,
        KeyCode::Left => at.saturating_sub(1),
        KeyCode::Right => (at + 1).min(n),
        KeyCode::Home => 0,
        KeyCode::End => n,
        _ => return None,
    };
    Some((v, to))
}

impl<M: Clone> Widget<M> for InputW<M> {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let base = cx.style();
        let chars: Vec<char> = self.value.chars().collect();
        let at = self
            .cursor
            .get()
            .map_or(chars.len(), |c| c.min(chars.len()));
        let w = |c: &char| {
            let mut b = [0u8; 4];
            str_width(c.encode_utf8(&mut b))
        };
        let room = usize::from(area.width);
        // Scroll horizontally so the cursor cell (at least one column) stays visible.
        let mut start = 0;
        while start < at && chars[start..at].iter().map(w).sum::<usize>() + 1 > room {
            start += 1;
        }
        if chars.is_empty() {
            let muted = base.fg(cx.theme.color(Role::Muted));
            buf.set_stringn(area.x, area.y, &self.placeholder, room, muted);
        } else {
            let shown: String = chars[start..].iter().collect();
            buf.set_stringn(area.x, area.y, &shown, room, base);
        }
        if cx.state.focused {
            let col: usize = chars[start..at].iter().map(w).sum();
            let cw = chars.get(at).map_or(1, w).max(1);
            if let Ok(dx) = u16::try_from(col)
                && dx < area.width
            {
                let cw = u16::try_from(cw).unwrap_or(1).min(area.width - dx);
                buf.set_style(
                    Rect::new(area.x + dx, area.y, cw, 1),
                    base.add_modifier(Modifier::REVERSED),
                );
            }
        }
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        match axis {
            Direction::Vertical => 1,
            Direction::Horizontal => {
                u16::try_from(str_width(&self.value).max(str_width(&self.placeholder)) + 1)
                    .unwrap_or(u16::MAX)
            }
        }
    }

    fn focusable(&self) -> bool {
        true
    }

    fn on_key(&self, key: &KeyEvent) -> Option<M> {
        if pressed(key) && key.code == KeyCode::Enter {
            return self.on_submit.clone();
        }
        let n = self.value.chars().count();
        let at = self.cursor.get().map_or(n, |c| c.min(n));
        // A cursor handle that was never set keeps meaning "end", so only record moves.
        let (v, to) = edit(&self.value, at, key)?;
        if self.cursor.get().is_some() || to != n {
            self.cursor.set(to);
        }
        Some((self.on_change)(v))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::crossterm::event::KeyModifiers;

    fn k(code: KeyCode) -> KeyEvent {
        KeyEvent::new(code, KeyModifiers::NONE)
    }

    #[test]
    fn edit_is_char_safe() {
        assert_eq!(
            edit("héy", 2, &k(KeyCode::Backspace)),
            Some(("hy".into(), 1))
        );
        assert_eq!(
            edit("日本", 1, &k(KeyCode::Char('x'))),
            Some(("日x本".into(), 2))
        );
        assert_eq!(edit("a🙂", 1, &k(KeyCode::Delete)), Some(("a".into(), 1)));
        assert_eq!(
            edit("ab", 0, &k(KeyCode::Backspace)),
            Some(("ab".into(), 0))
        );
        assert_eq!(edit("ab", 2, &k(KeyCode::Right)), Some(("ab".into(), 2)));
        assert_eq!(edit("ab", 1, &k(KeyCode::Tab)), None);
        let ctrl = KeyEvent::new(KeyCode::Char('a'), KeyModifiers::CONTROL);
        assert_eq!(edit("ab", 1, &ctrl), None);
    }
}
