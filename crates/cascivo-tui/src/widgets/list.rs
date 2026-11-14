use std::rc::Rc;

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::KeyEvent;
use ratatui::layout::{Direction, Rect};
use ratatui::style::Modifier;

use super::support::{Nav, Scroll, nav};
use crate::class::Role;
use crate::layout::RenderCx;
use crate::node::{Node, Widget, str_width, truncate};

/// A selectable list under construction; converts into a [`Node`] with `.into()` or
/// [`List::id`].
pub struct List<M> {
    items: Vec<String>,
    selected: usize,
    on_select: Rc<dyn Fn(usize) -> M>,
    on_activate: Option<Rc<dyn Fn(usize) -> M>>,
    scroll: Scroll,
    class: String,
}

/// A vertical list with one selected row. `j`/`k`/`↓`/`↑` emit `on_select(index)` for the
/// neighbouring row and clamp at the ends (no wrap); the viewport scrolls to keep the
/// selection visible when there are more items than rows. Enter emits
/// [`on_activate`](List::on_activate) if set.
///
/// The node only joins the focus ring once it has an id. The selected row is marked `›`,
/// bold and highlighted, and reversed while the list has focus.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node<usize> = list(vec!["a".into(), "b".into(), "c".into()], 1, |i| i).id("files");
/// assert_eq!(render_to_string(&n, 6, 2).unwrap(), "  a\n› b");
/// ```
pub fn list<M: 'static>(
    items: Vec<String>,
    selected: usize,
    on_select: impl Fn(usize) -> M + 'static,
) -> List<M> {
    List {
        items,
        selected,
        on_select: Rc::new(on_select),
        on_activate: None,
        scroll: Scroll::default(),
        class: String::new(),
    }
}

impl<M> List<M> {
    /// Emits `f(selected)` when Enter is pressed.
    #[must_use]
    pub fn on_activate(mut self, f: impl Fn(usize) -> M + 'static) -> Self {
        self.on_activate = Some(Rc::new(f));
        self
    }

    /// Keeps the scroll window in `scroll` (see [`Scroll`]).
    #[must_use]
    pub fn scroll(mut self, scroll: &Scroll) -> Self {
        self.scroll = scroll.clone();
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
        M: 'static,
    {
        Node::from(self).id(id)
    }
}

impl<M: 'static> From<List<M>> for Node<M> {
    fn from(l: List<M>) -> Self {
        let class = l.class.trim().to_owned();
        Node::leaf(
            &class,
            ListW {
                items: l.items,
                selected: l.selected,
                on_select: l.on_select,
                on_activate: l.on_activate,
                scroll: l.scroll,
            },
        )
    }
}

struct ListW<M> {
    items: Vec<String>,
    selected: usize,
    on_select: Rc<dyn Fn(usize) -> M>,
    on_activate: Option<Rc<dyn Fn(usize) -> M>>,
    scroll: Scroll,
}

impl<M> Widget<M> for ListW<M> {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let len = self.items.len();
        if len == 0 {
            return;
        }
        let sel = self.selected.min(len - 1);
        let rows = usize::from(area.height);
        let off = self.scroll.follow(sel, len, rows);
        let base = cx.style();
        for (row, (i, item)) in self
            .items
            .iter()
            .enumerate()
            .skip(off)
            .take(rows)
            .enumerate()
        {
            let y = area.y + u16::try_from(row).unwrap_or(0);
            let mut style = base;
            let prefix = if i == sel {
                style = style
                    .bg(cx.theme.color(Role::Selection))
                    .add_modifier(Modifier::BOLD);
                if cx.state.focused {
                    style = style.add_modifier(Modifier::REVERSED);
                }
                "› "
            } else {
                "  "
            };
            buf.set_style(Rect::new(area.x, y, area.width, 1), style);
            let line = truncate(&format!("{prefix}{item}"), usize::from(area.width));
            buf.set_stringn(area.x, y, &line, usize::from(area.width), style);
        }
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        let n = match axis {
            Direction::Vertical => self.items.len(),
            Direction::Horizontal => self
                .items
                .iter()
                .map(|s| str_width(s) + 2)
                .max()
                .unwrap_or(0),
        };
        u16::try_from(n).unwrap_or(u16::MAX)
    }

    fn focusable(&self) -> bool {
        true
    }

    fn on_key(&self, key: &KeyEvent) -> Option<M> {
        match nav(key, self.items.len(), self.selected)? {
            Nav::Move(i) => Some((self.on_select)(i)),
            Nav::Activate => {
                let sel = self.selected.min(self.items.len() - 1);
                self.on_activate.as_ref().map(|f| f(sel))
            }
        }
    }
}
