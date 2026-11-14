use ratatui::buffer::Buffer;
use ratatui::layout::{Direction, Rect};

use crate::class::Role;
use crate::layout::RenderCx;
use crate::node::{Node, Widget};

const BARS: [&str; 8] = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

struct Sparkline(Vec<u64>);

/// A one-row mini chart scaled to the largest value; shows the latest values when too wide.
/// Empty data draws nothing.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = sparkline(&[0, 4, 8]);
/// assert_eq!(render_to_string(&n, 5, 1).unwrap(), "▁▄█");
/// ```
pub fn sparkline<M: 'static>(data: &[u64]) -> Node<M> {
    Node::leaf("", Sparkline(data.to_vec()))
}

impl<M> Widget<M> for Sparkline {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let skip = self.0.len().saturating_sub(usize::from(area.width));
        let max = self.0.iter().copied().max().unwrap_or(0).max(1);
        let style = cx.style().fg(cx.theme.color(Role::Accent));
        for (i, v) in self.0.iter().skip(skip).enumerate() {
            // u128 avoids overflow when v is near u64::MAX.
            let level = usize::try_from(u128::from(*v) * 7 / u128::from(max)).unwrap_or(7);
            let x = area.x + u16::try_from(i).unwrap_or(0);
            buf[(x, area.y)]
                .set_symbol(BARS[level.min(7)])
                .set_style(style);
        }
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        match axis {
            Direction::Vertical => 1,
            Direction::Horizontal => u16::try_from(self.0.len()).unwrap_or(u16::MAX),
        }
    }
}
