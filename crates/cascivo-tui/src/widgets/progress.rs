use ratatui::buffer::Buffer;
use ratatui::layout::{Direction, Rect};

use crate::class::Role;
use crate::layout::RenderCx;
use crate::node::{Node, Widget, str_width};

struct Progress {
    ratio: f64,
    label: String,
}

/// A one-row bar filled to `ratio` (clamped to 0..=1; NaN counts as 0) after `label` and a percentage.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = progress(0.5, "cpu");
/// assert_eq!(render_to_string(&n, 14, 1).unwrap(), "cpu 50% ███░░░");
/// ```
pub fn progress<M: 'static>(ratio: f64, label: &str) -> Node<M> {
    let ratio = if ratio.is_nan() {
        0.0
    } else {
        ratio.clamp(0.0, 1.0)
    };
    Node::leaf(
        "",
        Progress {
            ratio,
            label: label.to_owned(),
        },
    )
}

impl Progress {
    fn head(&self) -> String {
        // Truncation to whole percent is intended.
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let pct = (self.ratio * 100.0).round() as u32;
        if self.label.is_empty() {
            format!("{pct}%")
        } else {
            format!("{} {pct}%", self.label)
        }
    }
}

impl<M> Widget<M> for Progress {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let base = cx.style();
        let head = self.head();
        let (x, _) = buf.set_stringn(area.x, area.y, &head, usize::from(area.width), base);
        // One space separates the text from the bar.
        let bar_x = x.saturating_add(1);
        let end = area.x + area.width;
        if bar_x >= end {
            return;
        }
        let w = end - bar_x;
        // Truncation to whole cells is intended.
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let filled = (self.ratio * f64::from(w)).round() as u16;
        let on = base.fg(cx.theme.color(Role::Accent));
        let off = base.fg(cx.theme.color(Role::Muted));
        for i in 0..w {
            let (sym, st) = if i < filled {
                ("█", on)
            } else {
                ("░", off)
            };
            buf[(bar_x + i, area.y)].set_symbol(sym).set_style(st);
        }
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        match axis {
            Direction::Vertical => 1,
            Direction::Horizontal => u16::try_from(str_width(&self.head())).unwrap_or(u16::MAX),
        }
    }
}
