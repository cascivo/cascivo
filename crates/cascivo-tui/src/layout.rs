//! Lays a [`Node`] tree out with ratatui's [`Layout`] and draws it.
//!
//! Main-axis constraint of a child (first rule that applies):
//! 1. size class (`w-*` in a row, `h-*` in a col): `N` → `Length(N)`, `full` →
//!    `Percentage(100)`, `a/b` → `Ratio(a, b)`;
//! 2. `grow-N` → `Fill(N)`;
//! 3. `min-*` → `Min`, then `max-*` → `Max`;
//! 4. `shrink-0` or a leaf → `Length(intrinsic)`; a container → `Fill(1)`.
//!
//! Cross axis: `items-stretch` (default) fills; `items-start/center/end` use the size class or
//! the intrinsic size, then `min-*`/`max-*` clamp. `gap-N` is `Layout::spacing`, `justify-*`
//! is [`Flex`] (default `Start`). Border and padding shrink the inner rect; `hidden` nodes are
//! skipped; `narrow:` merges when the frame is narrower than [`NARROW_COLS`]. Children that do
//! not fit are clipped to the parent's inner rect (possibly to zero), never overlapped.

use std::borrow::Cow;

use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Flex, Layout, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::Line;
use ratatui::widgets::{Block, BorderType, Borders, Widget as _};

use crate::class::{ClassStyle, Items, Justify, Role, Size};
use crate::error::{ClassError, TuiError};
use crate::node::{Node, NodeKind};
use crate::theme::{StateFlags, Theme};

/// Frames narrower than this many columns apply `narrow:` classes.
pub const NARROW_COLS: u16 = 80;

/// What a [`Widget`](crate::node::Widget) sees while rendering.
#[derive(Debug, Clone, Copy)]
pub struct RenderCx<'a> {
    /// The active theme.
    pub theme: &'a Theme,
    /// This node's interaction state.
    pub state: StateFlags,
    /// This node's classes, `narrow:` already merged; state variants are resolved by
    /// [`RenderCx::style`].
    pub class: &'a ClassStyle,
    /// Width of the whole frame in columns.
    pub frame_width: u16,
}

impl RenderCx<'_> {
    /// The node's text style (fg, bg, modifiers) for its state.
    pub fn style(&self) -> Style {
        self.theme.style_for(self.class, self.state)
    }
}

/// By-products of a render pass.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct LayoutOut {
    /// Focusable ids with their outer rects, in tree order; `hidden` subtrees are skipped.
    /// A clipped node still appears, with a zero-size rect.
    pub focus: Vec<(String, Rect)>,
}

/// Lays out and draws `node` into `area` of `buf`. The frame width for `narrow:` is
/// `buf.area.width`. The node whose id equals `focused` renders with
/// [`StateFlags::focused`].
///
/// Every class in the tree (hidden subtrees included) is checked before anything is drawn;
/// the first bad one, in tree order, is returned as [`TuiError::Class`].
///
/// ```
/// use cascivo_tui::prelude::*;
/// use ratatui::{buffer::Buffer, layout::Rect};
///
/// let area = Rect::new(0, 0, 10, 3);
/// let mut buf = Buffer::empty(area);
/// let n: Node = col("border", [text("hi").into()]).id("box");
/// let out = render(&n, area, &mut buf, &Theme::default(), Some("box")).unwrap();
/// assert_eq!(out.focus, vec![("box".to_string(), area)]);
/// assert_eq!(buf[(1, 1)].symbol(), "h");
/// ```
pub fn render<M>(
    node: &Node<M>,
    area: Rect,
    buf: &mut Buffer,
    theme: &Theme,
    focused: Option<&str>,
) -> Result<LayoutOut, TuiError> {
    validate(node)?;
    let mut w = Walk {
        theme,
        focused,
        frame_width: buf.area.width,
        out: LayoutOut::default(),
    };
    if let Some(cs) = w.effective(node) {
        w.draw(node, &cs, area, buf);
    }
    Ok(w.out)
}

fn validate<M>(node: &Node<M>) -> Result<(), ClassError> {
    node.style().map_err(Clone::clone)?;
    node.children().iter().try_for_each(validate)
}

fn sides(b: Borders, axis: Direction) -> u16 {
    let (a, z) = match axis {
        Direction::Horizontal => (Borders::LEFT, Borders::RIGHT),
        Direction::Vertical => (Borders::TOP, Borders::BOTTOM),
    };
    u16::from(b.contains(a)) + u16::from(b.contains(z))
}

fn cells(s: Size, avail: u16) -> u16 {
    match s {
        Size::Cells(n) => n,
        Size::Full => avail,
        Size::Ratio(a, b) => {
            let v = u32::from(avail) * a / b.max(1);
            u16::try_from(v).unwrap_or(avail)
        }
    }
}

struct Walk<'a> {
    theme: &'a Theme,
    focused: Option<&'a str>,
    frame_width: u16,
    out: LayoutOut,
}

impl Walk<'_> {
    /// Classes with `narrow:` applied; `None` for an invalid class (excluded by `validate`).
    fn effective<'n, M>(&self, node: &'n Node<M>) -> Option<Cow<'n, ClassStyle>> {
        let cs = node.style().ok()?;
        Some(match (&cs.narrow, self.frame_width < NARROW_COLS) {
            (Some(n), true) => Cow::Owned(cs.merge(n)),
            _ => Cow::Borrowed(cs),
        })
    }

    fn intrinsic<M>(&self, node: &Node<M>, cs: &ClassStyle, axis: Direction) -> u16 {
        let size = match axis {
            Direction::Horizontal => cs.width,
            Direction::Vertical => cs.height,
        };
        if let Some(Size::Cells(n)) = size {
            return n;
        }
        let pad = match axis {
            Direction::Horizontal => cs.padding.left.unwrap_or(0) + cs.padding.right.unwrap_or(0),
            Direction::Vertical => cs.padding.top.unwrap_or(0) + cs.padding.bottom.unwrap_or(0),
        };
        let chrome = pad.saturating_add(sides(cs.borders.unwrap_or(Borders::NONE), axis));
        let content = match node.kind() {
            NodeKind::Leaf(w) => w.intrinsic(axis),
            NodeKind::Col(ch) | NodeKind::Row(ch) => {
                let main = if matches!(node.kind(), NodeKind::Row(_)) {
                    Direction::Horizontal
                } else {
                    Direction::Vertical
                };
                let sizes = ch.iter().filter_map(|c| {
                    let ccs = self.effective(c)?;
                    (!ccs.hidden).then(|| self.intrinsic(c, &ccs, axis))
                });
                if main == axis {
                    let (n, sum) = sizes.fold((0u16, 0u16), |(n, s), v| {
                        (n.saturating_add(1), s.saturating_add(v))
                    });
                    sum.saturating_add(cs.gap.unwrap_or(0).saturating_mul(n.saturating_sub(1)))
                } else {
                    sizes.max().unwrap_or(0)
                }
            }
        };
        content.saturating_add(chrome)
    }

    fn draw<M>(&mut self, node: &Node<M>, cs: &ClassStyle, area: Rect, buf: &mut Buffer) {
        if cs.hidden {
            return;
        }
        let id = node.focus_id();
        let state = StateFlags {
            focused: id.is_some() && id == self.focused,
            ..StateFlags::default()
        };
        if let (Some(id), true) = (id, node.is_focusable()) {
            self.out.focus.push((id.to_owned(), area));
        }
        let inner = if area.is_empty() {
            area
        } else {
            let borders = cs.borders.unwrap_or(Borders::NONE);
            let mut block = Block::default()
                .borders(borders)
                .style(self.theme.style_for(cs, state));
            if !borders.is_empty() {
                block = block
                    .border_type(cs.border_type.unwrap_or(BorderType::Plain))
                    .border_style(self.theme.border_style(cs, state));
                if let (Some(t), true) = (node.border_title(), borders.contains(Borders::TOP)) {
                    // Two corner cells and one space each side of the title.
                    let max = usize::from(area.width.saturating_sub(4));
                    let t = crate::node::truncate(t, max);
                    block = block.title(Line::styled(
                        format!(" {t} "),
                        Style::new()
                            .fg(self.theme.color(Role::Accent))
                            .add_modifier(Modifier::BOLD),
                    ));
                }
            }
            (&block).render(area, buf);
            let b = block.inner(area);
            let p = cs.padding;
            let (l, r) = (p.left.unwrap_or(0), p.right.unwrap_or(0));
            let (t, bo) = (p.top.unwrap_or(0), p.bottom.unwrap_or(0));
            Rect::new(
                b.x.saturating_add(l),
                b.y.saturating_add(t),
                b.width.saturating_sub(l.saturating_add(r)),
                b.height.saturating_sub(t.saturating_add(bo)),
            )
            .intersection(b)
        };
        match node.kind() {
            NodeKind::Leaf(w) => {
                if !inner.is_empty() {
                    let cx = RenderCx {
                        theme: self.theme,
                        state,
                        class: cs,
                        frame_width: self.frame_width,
                    };
                    w.render(inner, buf, &cx);
                }
            }
            NodeKind::Col(ch) => self.stack(ch, Direction::Vertical, cs, inner, buf),
            NodeKind::Row(ch) => self.stack(ch, Direction::Horizontal, cs, inner, buf),
        }
    }

    fn stack<M>(
        &mut self,
        children: &[Node<M>],
        dir: Direction,
        cs: &ClassStyle,
        inner: Rect,
        buf: &mut Buffer,
    ) {
        let visible: Vec<(&Node<M>, Cow<'_, ClassStyle>)> = children
            .iter()
            .filter_map(|c| self.effective(c).map(|s| (c, s)))
            .filter(|(_, s)| !s.hidden)
            .collect();
        if visible.is_empty() {
            return;
        }
        if inner.is_empty() {
            let zero = Rect::new(inner.x, inner.y, 0, 0);
            for (c, s) in &visible {
                self.draw(*c, s, zero, buf);
            }
            return;
        }
        let row = dir == Direction::Horizontal;
        let constraints: Vec<Constraint> = visible
            .iter()
            .map(|(c, s)| self.main_constraint(c, s, dir))
            .collect();
        let flex = match cs.justify {
            None | Some(Justify::Start) => Flex::Start,
            Some(Justify::Center) => Flex::Center,
            Some(Justify::End) => Flex::End,
            Some(Justify::Between) => Flex::SpaceBetween,
            Some(Justify::Around) => Flex::SpaceAround,
            Some(Justify::Evenly) => Flex::SpaceEvenly,
        };
        let rects = Layout::new(dir, constraints)
            .spacing(cs.gap.unwrap_or(0))
            .flex(flex)
            .split(inner);
        let cross = if row {
            Direction::Vertical
        } else {
            Direction::Horizontal
        };
        for ((c, s), r) in visible.iter().zip(rects.iter()) {
            let (size, min, max) = if row {
                (s.height, s.min_h, s.max_h)
            } else {
                (s.width, s.min_w, s.max_w)
            };
            let avail = if row { inner.height } else { inner.width };
            let items = s.items.or(cs.items).unwrap_or(Items::Stretch);
            let mut want = match (size, items) {
                (Some(sz), _) => cells(sz, avail),
                (None, Items::Stretch) => avail,
                (None, _) => self.intrinsic(c, s, cross),
            };
            if let Some(m) = min {
                want = want.max(cells(m, avail));
            }
            if let Some(m) = max {
                want = want.min(cells(m, avail));
            }
            let want = want.min(avail);
            let off = match items {
                Items::Center => (avail - want) / 2,
                Items::End => avail - want,
                Items::Start | Items::Stretch => 0,
            };
            let placed = if row {
                Rect::new(r.x, inner.y + off, r.width, want)
            } else {
                Rect::new(inner.x + off, r.y, want, r.height)
            };
            self.draw(*c, s, placed.intersection(inner), buf);
        }
    }

    fn main_constraint<M>(&self, node: &Node<M>, cs: &ClassStyle, dir: Direction) -> Constraint {
        let (size, min, max) = match dir {
            Direction::Horizontal => (cs.width, cs.min_w, cs.max_w),
            Direction::Vertical => (cs.height, cs.min_h, cs.max_h),
        };
        match (size, cs.grow, min, max) {
            (Some(Size::Cells(n)), ..) => Constraint::Length(n),
            (Some(Size::Full), ..) => Constraint::Percentage(100),
            (Some(Size::Ratio(a, b)), ..) => Constraint::Ratio(a, b),
            (None, Some(g), ..) => Constraint::Fill(g),
            (None, None, Some(m), _) => Constraint::Min(cells(m, 0)),
            (None, None, None, Some(m)) => Constraint::Max(cells(m, u16::MAX)),
            (None, None, None, None) => {
                if cs.shrink0 || matches!(node.kind(), NodeKind::Leaf(_)) {
                    Constraint::Length(self.intrinsic(node, cs, dir))
                } else {
                    Constraint::Fill(1)
                }
            }
        }
    }
}

/// Renders `node` on a `cols`×`rows` [`TestBackend`](ratatui::backend::TestBackend) and returns
/// the rows with trailing spaces trimmed and trailing empty rows dropped, plus the buffer.
#[cfg(test)]
pub(crate) fn render_test<M>(
    node: &Node<M>,
    cols: u16,
    rows: u16,
    focused: Option<&str>,
) -> Result<(String, Buffer, LayoutOut), TuiError> {
    use ratatui::{Terminal, backend::TestBackend};
    let mut term = match Terminal::new(TestBackend::new(cols, rows)) {
        Ok(t) => t,
        Err(e) => match e {},
    };
    let theme = Theme::default();
    let mut res = Ok(LayoutOut::default());
    let drawn = term.draw(|f| {
        let area = f.area();
        res = render(node, area, f.buffer_mut(), &theme, focused);
    });
    if let Err(e) = drawn {
        match e {}
    }
    let out = res?;
    let buf = term.backend().buffer().clone();
    let text = crate::testing::buffer_text(&buf);
    Ok((text, buf, out))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::node::{col, row, spacer, text};

    fn snap(n: &Node, cols: u16, rows: u16) -> String {
        render_test(n, cols, rows, None).unwrap().0
    }

    fn boxed(c: &str, label: &str) -> Node {
        col(&format!("border {c}"), [text(label).into()])
    }

    #[test]
    fn vertical_grow_ratio() {
        let n = col("", [boxed("grow", "a"), boxed("grow-2", "b")]);
        let expected = "\
┌──────────────────────────────────────┐
│a                                     │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│b                                     │
│                                      │
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘";
        assert_eq!(snap(&n, 40, 10), expected);
    }

    #[test]
    fn horizontal_grow_ratio_80x24() {
        let n = row("", [boxed("grow", "a"), boxed("grow-3", "b")]);
        let s = snap(&n, 80, 24);
        let first = s.lines().next().unwrap();
        // 80 cols split 1:3 → 20 + 60.
        assert_eq!(first, format!("┌{}┐┌{}┐", "─".repeat(18), "─".repeat(58)));
        assert_eq!(s.lines().count(), 24);
    }

    #[test]
    fn gap_and_justify_between() {
        let n = col("gap-1", [text("one").into(), text("two").into()]);
        assert_eq!(snap(&n, 40, 10), "one\n\ntwo");
        let n = row(
            "justify-between",
            [text("L").into(), text("M").into(), text("R").into()],
        );
        assert_eq!(
            snap(&n, 40, 10),
            format!("L{}M{}R", " ".repeat(19), " ".repeat(18))
        );
    }

    #[test]
    fn half_width() {
        let n = row("", [boxed("w-1/2", "x"), spacer()]);
        let s = snap(&n, 40, 10);
        assert_eq!(s.lines().next().unwrap(), format!("┌{}┐", "─".repeat(18)));
        assert_eq!(s.lines().nth(1).unwrap(), format!("│x{}│", " ".repeat(17)));
    }

    #[test]
    fn rounded_corners_and_top_only() {
        let n: Node = col("", [col("border rounded h-3 w-6", [])]);
        assert_eq!(snap(&n, 40, 10), "╭────╮\n│    │\n╰────╯");
        let n: Node = col("", [col("border-t h-2", [text("body").into()])]);
        assert_eq!(snap(&n, 10, 4), format!("{}\nbody", "─".repeat(10)));
    }

    #[test]
    fn padding_inset() {
        let n: Node = col("", [col("border p-1 h-5", [text("in").into()])]);
        let expected = "\
┌────────┐
│        │
│ in     │
│        │
└────────┘";
        assert_eq!(snap(&n, 10, 6), expected);
    }

    #[test]
    fn min_w_on_tiny_terminal_clips_without_overlap() {
        let n: Node = row("", [boxed("min-w-30", "a"), boxed("w-30", "b")]);
        let (s, _, _) = render_test(&n, 12, 3, None).unwrap();
        for l in s.lines() {
            assert!(l.chars().count() <= 12);
        }
        let n: Node = row(
            "",
            [
                col("w-30", []).id("a"),
                col("w-30", []).id("b"),
                col("w-30", []).id("c"),
            ],
        );
        let (_, _, out) = render_test(&n, 40, 10, None).unwrap();
        let rects: Vec<Rect> = out.focus.iter().map(|(_, r)| *r).collect();
        for (i, a) in rects.iter().enumerate() {
            assert!(a.right() <= 40);
            for b in &rects[i + 1..] {
                assert!(!a.intersects(*b), "{a:?} overlaps {b:?}");
            }
        }
    }

    #[test]
    fn narrow_hidden_flips_at_80() {
        let n: Node = col(
            "",
            [text("wide").class("narrow:hidden").into(), text("x").into()],
        );
        assert_eq!(snap(&n, 79, 3), "x");
        assert_eq!(snap(&n, 80, 3), "wide\nx");
    }

    #[test]
    fn bad_class_errors_with_token() {
        let n: Node = col("", [row("hidden", [text("t").class("bg-primary").into()])]);
        let e = render_test(&n, 40, 10, None).unwrap_err();
        assert!(e.to_string().contains("bg-primary"), "{e}");
        assert!(matches!(e, TuiError::Class(_)));
    }

    #[test]
    fn tiny_terminals_do_not_panic() {
        let n: Node = col(
            "border p-2 gap-3 justify-center items-center",
            [
                row(
                    "border min-w-10",
                    [text("hello world").class("truncate").into()],
                ),
                spacer(),
                boxed("grow-2 w-1/3", "z").id("z"),
            ],
        )
        .id("root");
        for (w, h) in [(0, 0), (1, 1), (0, 5), (5, 0), (2, 2)] {
            let (_, _, out) = render_test(&n, w, h, None).unwrap();
            assert_eq!(out.focus.len(), 2);
        }
    }

    #[test]
    fn focused_id_gets_focus_style() {
        let n: Node = col(
            "",
            [
                col("h-3 border focus:border-accent", []).id("a"),
                col("h-3 border focus:border-accent", []).id("b"),
            ],
        );
        let (_, buf, _) = render_test(&n, 40, 10, Some("b")).unwrap();
        let accent = Theme::default().color(crate::class::Role::Accent);
        assert_eq!(buf[(0, 3)].fg, accent);
        assert_ne!(buf[(0, 0)].fg, accent);
    }

    #[test]
    fn focus_list_tree_order_skips_hidden() {
        let n: Node = col(
            "",
            [
                row(
                    "",
                    [col("", []).id("a"), col("hidden", [col("", []).id("x")])],
                ),
                col("", []).id("b"),
                text("t").into(),
                col("narrow:hidden", []).id("wide-only"),
            ],
        )
        .id("root");
        let ids = |w| {
            render_test(&n, w, 10, None)
                .unwrap()
                .2
                .focus
                .into_iter()
                .map(|(i, _)| i)
                .collect::<Vec<_>>()
        };
        assert_eq!(ids(40), ["root", "a", "b"]);
        assert_eq!(ids(80), ["root", "a", "b", "wide-only"]);
    }

    #[test]
    fn items_center_and_truncate() {
        let n: Node = col("items-center", [text("mid").into()]);
        assert_eq!(snap(&n, 9, 1), "   mid");
        let n: Node = col("", [text("hello world").class("truncate").into()]);
        assert_eq!(snap(&n, 6, 1), "hello…");
        let n: Node = col("", [text("abc").class("text-right").into()]);
        assert_eq!(snap(&n, 6, 1), "   abc");
    }
}
