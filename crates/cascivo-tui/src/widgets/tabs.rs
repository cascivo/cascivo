use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{KeyCode, KeyEvent};
use ratatui::layout::{Direction, Rect};
use ratatui::style::Modifier;
use std::rc::Rc;

use super::support::{plain, pressed};
use crate::class::Role;
use crate::layout::RenderCx;
use crate::node::{Node, Widget, str_width};

struct Tabs<M> {
    titles: Vec<String>,
    active: usize,
    on_change: Rc<dyn Fn(usize) -> M>,
}

/// A row of tabs. `←`/`→` move the active tab and clamp at the ends (no wrap); `1`-`9` jump
/// to that tab when it exists. Each emits `on_change(index)`.
///
/// The node only joins the focus ring once it has an id. The active tab is bold and
/// underlined, and reversed while the tabs have focus.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node<usize> = tabs(&["One", "Two"], 1, |i| i).id("tabs");
/// assert_eq!(render_to_string(&n, 12, 1).unwrap(), " One   Two");
/// ```
pub fn tabs<M: 'static>(
    titles: &[&str],
    active: usize,
    on_change: impl Fn(usize) -> M + 'static,
) -> Node<M> {
    Node::leaf(
        "h-1",
        Tabs {
            titles: titles.iter().map(|t| (*t).to_owned()).collect(),
            active,
            on_change: Rc::new(on_change),
        },
    )
}

impl<M> Widget<M> for Tabs<M> {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let base = cx.style();
        let mut x = area.x;
        let end = area.x + area.width;
        for (i, title) in self.titles.iter().enumerate() {
            if x >= end {
                break;
            }
            let style = if i == self.active {
                let s = base
                    .bg(cx.theme.color(Role::Surface2))
                    .add_modifier(Modifier::BOLD | Modifier::UNDERLINED);
                if cx.state.focused {
                    s.add_modifier(Modifier::REVERSED)
                } else {
                    s
                }
            } else {
                base.fg(cx.theme.color(Role::Muted))
            };
            let (nx, _) =
                buf.set_stringn(x, area.y, format!(" {title} "), usize::from(end - x), style);
            x = nx.saturating_add(1);
        }
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        match axis {
            Direction::Vertical => 1,
            Direction::Horizontal => {
                let n: usize = self.titles.iter().map(|t| str_width(t) + 3).sum();
                u16::try_from(n.saturating_sub(1)).unwrap_or(u16::MAX)
            }
        }
    }

    fn focusable(&self) -> bool {
        true
    }

    fn on_key(&self, key: &KeyEvent) -> Option<M> {
        let len = self.titles.len();
        if len == 0 || !pressed(key) || !plain(key) {
            return None;
        }
        let cur = self.active.min(len - 1);
        let to = match key.code {
            KeyCode::Left => cur.saturating_sub(1),
            KeyCode::Right => (cur + 1).min(len - 1),
            KeyCode::Char(c @ '1'..='9') => {
                let i = usize::from(u8::try_from(c).ok()? - b'1');
                if i >= len {
                    return None;
                }
                i
            }
            _ => return None,
        };
        Some((self.on_change)(to))
    }
}
