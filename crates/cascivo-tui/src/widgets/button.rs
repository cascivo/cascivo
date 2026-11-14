use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{KeyCode, KeyEvent};
use ratatui::layout::{Direction, Rect};
use ratatui::style::Modifier;

use super::support::{plain, pressed};
use crate::layout::RenderCx;
use crate::node::{Node, Widget, str_width};

struct Button<M> {
    label: String,
    on_press: M,
}

/// A push button: Enter or Space while focused emits a clone of `on_press`.
///
/// The node only joins the focus ring once it has an id. Focus shows as the `focus:` colours
/// plus bold, so it is not colour-only.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node<&str> = button("Save", "save").id("save");
/// assert!(n.is_focusable());
/// assert_eq!(render_to_string(&n, 10, 1).unwrap(), " Save");
/// ```
pub fn button<M: Clone + 'static>(label: &str, on_press: M) -> Node<M> {
    Node::leaf(
        "px-1 bg-surface2 focus:bg-accent focus:text-accent_fg",
        Button {
            label: label.to_owned(),
            on_press,
        },
    )
}

impl<M: Clone> Widget<M> for Button<M> {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let mut style = cx.style();
        if cx.state.focused {
            style = style.add_modifier(Modifier::BOLD);
        }
        buf.set_stringn(area.x, area.y, &self.label, usize::from(area.width), style);
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        match axis {
            Direction::Vertical => 1,
            Direction::Horizontal => u16::try_from(str_width(&self.label)).unwrap_or(u16::MAX),
        }
    }

    fn focusable(&self) -> bool {
        true
    }

    fn on_key(&self, key: &KeyEvent) -> Option<M> {
        (pressed(key) && plain(key) && matches!(key.code, KeyCode::Enter | KeyCode::Char(' ')))
            .then(|| self.on_press.clone())
    }
}
