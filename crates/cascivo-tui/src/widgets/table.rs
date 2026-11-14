use std::rc::Rc;

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::KeyEvent;
use ratatui::layout::{Direction, Rect};
use ratatui::style::Modifier;

use super::support::{Nav, Scroll, nav};
use crate::class::Role;
use crate::layout::RenderCx;
use crate::node::{Node, Widget, truncate};

/// A table column width.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Col {
    /// Exactly this many cells (cut short only when the table is narrower).
    Fixed(u16),
    /// A share of the space left after fixed columns and gaps, proportional to the weight;
    /// spare cells from rounding go to the leftmost growing columns.
    Grow(u16),
}

/// A table under construction; converts into a [`Node`] with `.into()` or [`Table::id`].
pub struct Table<M> {
    header: Vec<String>,
    rows: Vec<Vec<String>>,
    widths: Vec<Col>,
    selected: usize,
    on_select: Rc<dyn Fn(usize) -> M>,
    on_activate: Option<Rc<dyn Fn(usize) -> M>>,
    scroll: Scroll,
    class: String,
}

/// A table with a sticky header row and one selected body row. Columns are separated by one
/// cell; a column without a matching [`Col`] is `Grow(1)`. `j`/`k`/`↓`/`↑` emit
/// `on_select(row)` and clamp at the ends (no wrap); only the body scrolls. `selected` is the
/// body row index, owned by the app. Enter emits [`on_activate`](Table::on_activate) if set.
///
/// The node only joins the focus ring once it has an id. The selected row is bold and
/// highlighted, and reversed while the table has focus.
///
/// ```
/// use cascivo_tui::prelude::*;
/// use cascivo_tui::widgets::Col;
///
/// let n: Node<usize> = table(
///     &["Name", "Qty"],
///     vec![vec!["apple".into(), "3".into()]],
///     &[Col::Grow(1), Col::Fixed(3)],
///     0,
///     |i| i,
/// )
/// .id("t");
/// assert_eq!(render_to_string(&n, 10, 2).unwrap(), "Name   Qty\napple  3");
/// ```
pub fn table<M: 'static>(
    header: &[&str],
    rows: Vec<Vec<String>>,
    widths: &[Col],
    selected: usize,
    on_select: impl Fn(usize) -> M + 'static,
) -> Table<M> {
    Table {
        header: header.iter().map(|h| (*h).to_owned()).collect(),
        rows,
        widths: widths.to_vec(),
        selected,
        on_select: Rc::new(on_select),
        on_activate: None,
        scroll: Scroll::default(),
        class: String::new(),
    }
}

impl<M> Table<M> {
    /// Emits `f(selected_row)` when Enter is pressed.
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

impl<M: 'static> From<Table<M>> for Node<M> {
    fn from(t: Table<M>) -> Self {
        let class = format!("scroll-y {}", t.class);
        Node::leaf(
            class.trim(),
            TableW {
                header: t.header,
                rows: t.rows,
                widths: t.widths,
                selected: t.selected,
                on_select: t.on_select,
                on_activate: t.on_activate,
                scroll: t.scroll,
            },
        )
    }
}

struct TableW<M> {
    header: Vec<String>,
    rows: Vec<Vec<String>>,
    widths: Vec<Col>,
    selected: usize,
    on_select: Rc<dyn Fn(usize) -> M>,
    on_activate: Option<Rc<dyn Fn(usize) -> M>>,
    scroll: Scroll,
}

/// Cell widths for `n` columns in `total` cells, one-cell gaps between columns.
pub(super) fn column_widths(widths: &[Col], n: usize, total: u16) -> Vec<u16> {
    let gaps = u16::try_from(n.saturating_sub(1)).unwrap_or(u16::MAX);
    let mut left = total.saturating_sub(gaps);
    let col = |i: usize| widths.get(i).copied().unwrap_or(Col::Grow(1));
    let mut out = vec![0u16; n];
    for (i, w) in out.iter_mut().enumerate() {
        if let Col::Fixed(f) = col(i) {
            *w = f.min(left);
            left -= *w;
        }
    }
    let weights: Vec<u32> = (0..n)
        .map(|i| match col(i) {
            Col::Grow(g) => u32::from(g),
            Col::Fixed(_) => 0,
        })
        .collect();
    let sum: u32 = weights.iter().sum();
    if sum > 0 {
        let mut given = 0u32;
        for (w, g) in out.iter_mut().zip(&weights) {
            if *g == 0 {
                continue;
            }
            let share = (u32::from(left) * g).checked_div(sum).unwrap_or(0);
            *w = u16::try_from(share).unwrap_or(u16::MAX);
            given += share;
        }
        let mut spare = u32::from(left) - given;
        for (w, g) in out.iter_mut().zip(&weights) {
            if spare == 0 {
                break;
            }
            if *g > 0 {
                *w += 1;
                spare -= 1;
            }
        }
    }
    out
}

impl<M> Widget<M> for TableW<M> {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let n = self.header.len();
        if n == 0 {
            return;
        }
        let widths = column_widths(&self.widths, n, area.width);
        let base = cx.style();
        let draw = |buf: &mut Buffer, y: u16, cells: &[String], style| {
            buf.set_style(Rect::new(area.x, y, area.width, 1), style);
            let mut x = area.x;
            for (cell, w) in cells.iter().zip(&widths) {
                if *w > 0 {
                    let s = truncate(cell, usize::from(*w));
                    buf.set_stringn(x, y, &s, usize::from(*w), style);
                }
                x = x.saturating_add(*w).saturating_add(1);
            }
        };
        // The header is drawn outside the scrolled range, so it stays put.
        let head = base
            .bg(cx.theme.color(Role::Surface2))
            .add_modifier(Modifier::BOLD);
        draw(buf, area.y, &self.header, head);

        let len = self.rows.len();
        let body = usize::from(area.height.saturating_sub(1));
        if len == 0 || body == 0 {
            return;
        }
        let sel = self.selected.min(len - 1);
        let off = self.scroll.follow(sel, len, body);
        for (row, (i, cells)) in self
            .rows
            .iter()
            .enumerate()
            .skip(off)
            .take(body)
            .enumerate()
        {
            let y = area.y + 1 + u16::try_from(row).unwrap_or(0);
            let mut style = base;
            if i == sel {
                style = style
                    .bg(cx.theme.color(Role::Selection))
                    .add_modifier(Modifier::BOLD);
                if cx.state.focused {
                    style = style.add_modifier(Modifier::REVERSED);
                }
            }
            draw(buf, y, cells, style);
        }
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        let n = match axis {
            Direction::Vertical => self.rows.len() + 1,
            Direction::Horizontal => 0,
        };
        u16::try_from(n).unwrap_or(u16::MAX)
    }

    fn focusable(&self) -> bool {
        true
    }

    fn on_key(&self, key: &KeyEvent) -> Option<M> {
        match nav(key, self.rows.len(), self.selected)? {
            Nav::Move(i) => Some((self.on_select)(i)),
            Nav::Activate => {
                let sel = self.selected.min(self.rows.len() - 1);
                self.on_activate.as_ref().map(|f| f(sel))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn widths_distribute() {
        // 20 total, 2 gaps -> 18; fixed 4 -> 14 left; 1:2 -> 4 + 9 = 13, spare 1 to first.
        let w = column_widths(&[Col::Grow(1), Col::Fixed(4), Col::Grow(2)], 3, 20);
        assert_eq!(w, vec![5, 4, 9]);
        assert_eq!(w.iter().sum::<u16>() + 2, 20);
        assert_eq!(
            column_widths(&[Col::Fixed(9), Col::Fixed(9)], 2, 10),
            vec![9, 0]
        );
        assert_eq!(column_widths(&[], 2, 11), vec![5, 5]);
        assert_eq!(column_widths(&[Col::Grow(0)], 1, 5), vec![0]);
    }
}
