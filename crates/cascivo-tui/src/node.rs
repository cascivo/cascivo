//! The view tree: containers ([`col`], [`row`]) and leaf widgets ([`text`], [`spacer`], …).
//!
//! # Message design
//!
//! [`Node<M>`] is generic over the app's message type, defaulting to `()`. A leaf holds a
//! `Box<dyn Widget<M>>`, so a focused widget turns a key straight into an `M`
//! ([`Widget::on_key`]) with no type erasure and no downcast that could fail at runtime.
//! Widgets that emit messages either clone a stored value (`on_press: M` with `M: Clone`) or
//! call a stored `Rc<dyn Fn(..) -> M>`; both are `'static`, which is why [`Node::leaf`] needs
//! `M: 'static`. The tree is single-threaded (`Node: !Send`). Builders are generic over `M`,
//! so `M` is inferred from where the tree goes (`App::view`'s return type, or a `&Node`
//! parameter that pins the default `()`); a tree used nowhere needs `let n: Node = …`.
//!
//! Class strings are parsed once, when the node is built, through a per-thread
//! [`ClassCache`]. A bad class is stored in the node and returned by
//! [`layout::render`](crate::layout::render) as [`TuiError::Class`](crate::TuiError::Class);
//! it is never ignored.

use std::cell::RefCell;
use std::fmt;
use std::rc::Rc;

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::KeyEvent;
use ratatui::layout::{Alignment, Direction, Rect};
use ratatui::text::{Line, Span, Text as RText};
use ratatui::widgets::{Paragraph, Widget as _, Wrap};

use crate::class::{ClassCache, ClassStyle, Flow, TextAlign};
use crate::error::ClassError;
use crate::layout::RenderCx;

thread_local! {
    static CACHE: RefCell<ClassCache> = RefCell::new(ClassCache::new());
}

fn parse_cached(s: &str) -> Result<Rc<ClassStyle>, ClassError> {
    CACHE.with(|c| c.borrow_mut().get(s))
}

/// A leaf of the view tree. Implement it to add a component.
///
/// The layout engine draws the node's border, background and padding first; `render` gets
/// the inner rect.
pub trait Widget<M> {
    /// Draws the widget into `area` (already inside border and padding; never empty).
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>);

    /// Natural size in cells along `axis`, excluding border and padding. Used for a leaf's
    /// main-axis `Length` when it has no size class, and for `shrink-0` / `items-*`.
    fn intrinsic(&self, axis: Direction) -> u16 {
        let _ = axis;
        0
    }

    /// Whether a node holding this widget joins the focus ring when it has an
    /// [`id`](Node::id).
    fn focusable(&self) -> bool {
        false
    }

    /// Whether a node holding this widget is a modal: while it is in the tree, focus and
    /// keys are confined to its subtree (see [`Node::active_modal`]).
    fn traps_focus(&self) -> bool {
        false
    }

    /// Handles a key while focused; `Some(msg)` consumes the key.
    fn on_key(&self, key: &KeyEvent) -> Option<M> {
        let _ = key;
        None
    }
}

/// What a [`Node`] is.
pub enum NodeKind<M> {
    /// A vertical stack.
    Col(Vec<Node<M>>),
    /// A horizontal stack.
    Row(Vec<Node<M>>),
    /// A widget.
    Leaf(Box<dyn Widget<M>>),
}

/// A view-tree node: a container or a leaf widget, its classes and an optional focus id.
pub struct Node<M = ()> {
    kind: NodeKind<M>,
    classes: String,
    style: Result<Rc<ClassStyle>, ClassError>,
    id: Option<String>,
    title: Option<String>,
}

impl<M> fmt::Debug for Node<M> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut d = f.debug_struct("Node");
        match &self.kind {
            NodeKind::Col(c) => d.field("col", c),
            NodeKind::Row(c) => d.field("row", c),
            NodeKind::Leaf(_) => d.field("leaf", &()),
        };
        d.field("classes", &self.classes)
            .field("id", &self.id)
            .finish()
    }
}

impl<M> Node<M> {
    fn new(kind: NodeKind<M>, classes: &str) -> Self {
        Self {
            kind,
            classes: classes.to_owned(),
            style: parse_cached(classes),
            id: None,
            title: None,
        }
    }

    /// A leaf node holding `widget`, styled by `class`.
    ///
    /// ```
    /// use cascivo_tui::node::{Node, Widget};
    /// use cascivo_tui::layout::RenderCx;
    /// use ratatui::{buffer::Buffer, layout::Rect};
    ///
    /// struct Dot;
    /// impl<M> Widget<M> for Dot {
    ///     fn render(&self, area: Rect, buf: &mut Buffer, _: &RenderCx<'_>) {
    ///         buf[(area.x, area.y)].set_symbol("•");
    ///     }
    /// }
    /// let n: Node = Node::leaf("w-1", Dot);
    /// assert_eq!(n.classes(), "w-1");
    /// ```
    pub fn leaf(class: &str, widget: impl Widget<M> + 'static) -> Self {
        Self::new(NodeKind::Leaf(Box::new(widget)), class)
    }

    /// Appends classes (the combined string is re-parsed; later tokens win).
    #[must_use]
    pub fn class(mut self, class: &str) -> Self {
        if !class.trim().is_empty() {
            if !self.classes.is_empty() {
                self.classes.push(' ');
            }
            self.classes.push_str(class);
            self.style = parse_cached(&self.classes);
        }
        self
    }

    /// Sets the focus id.
    #[must_use]
    pub fn id(mut self, id: &str) -> Self {
        self.id = Some(id.to_owned());
        self
    }

    /// Sets a title drawn on the top border (needs a `border` class to show).
    #[must_use]
    pub fn title(mut self, title: &str) -> Self {
        self.title = Some(title.to_owned());
        self
    }

    /// The border title, if any.
    pub fn border_title(&self) -> Option<&str> {
        self.title.as_deref()
    }

    /// The node's kind.
    pub fn kind(&self) -> &NodeKind<M> {
        &self.kind
    }

    /// The class string as written.
    pub fn classes(&self) -> &str {
        &self.classes
    }

    /// The parsed classes, or the parse error.
    pub fn style(&self) -> Result<&ClassStyle, &ClassError> {
        self.style.as_deref()
    }

    /// The focus id, if any.
    pub fn focus_id(&self) -> Option<&str> {
        self.id.as_deref()
    }

    /// Whether this node joins the focus ring: it has an id and is a container or a
    /// [`focusable`](Widget::focusable) widget.
    pub fn is_focusable(&self) -> bool {
        self.id.is_some()
            && match &self.kind {
                NodeKind::Leaf(w) => w.focusable(),
                _ => true,
            }
    }

    /// Children of a container; empty for a leaf.
    pub fn children(&self) -> &[Node<M>] {
        match &self.kind {
            NodeKind::Col(c) | NodeKind::Row(c) => c,
            NodeKind::Leaf(_) => &[],
        }
    }

    /// The first node in tree order whose id is `id`.
    pub fn find(&self, id: &str) -> Option<&Self> {
        if self.id.as_deref() == Some(id) {
            return Some(self);
        }
        self.children().iter().find_map(|c| c.find(id))
    }

    /// The active modal: the last node in tree (pre-order) order whose leaf widget
    /// [`traps_focus`](Widget::traps_focus). Descendants follow their ancestors, so a modal
    /// opened inside another wins; among siblings the later one wins. The modal widget's
    /// node is the subtree root (its own `id`, if any, joins the trapped ring).
    pub fn active_modal(&self) -> Option<&Self> {
        let inner = self.children().iter().rev().find_map(Self::active_modal);
        inner.or_else(|| match &self.kind {
            NodeKind::Leaf(w) if w.traps_focus() => Some(self),
            _ => None,
        })
    }

    /// Routes a key to this node's widget ([`Widget::on_key`]); `None` for containers.
    pub fn on_key(&self, key: &KeyEvent) -> Option<M> {
        match &self.kind {
            NodeKind::Leaf(w) => w.on_key(key),
            _ => None,
        }
    }
}

/// A vertical stack.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = col("gap-1 p-1 border", [text("a").into(), spacer()]);
/// assert_eq!(n.children().len(), 2);
/// ```
pub fn col<M>(class: &str, children: impl Into<Vec<Node<M>>>) -> Node<M> {
    Node::new(NodeKind::Col(children.into()), class)
}

/// A horizontal stack.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = row("justify-between", vec![text("left").into(), text("right").into()]);
/// assert!(n.style().is_ok());
/// ```
pub fn row<M>(class: &str, children: impl Into<Vec<Node<M>>>) -> Node<M> {
    Node::new(NodeKind::Row(children.into()), class)
}

struct Empty;

impl<M> Widget<M> for Empty {
    fn render(&self, _: Rect, _: &mut Buffer, _: &RenderCx<'_>) {}
}

/// An empty leaf that grows (`grow`) to push siblings apart.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = spacer();
/// assert_eq!(n.style().unwrap().grow, Some(1));
/// ```
pub fn spacer<M>() -> Node<M> {
    Node::leaf("grow", Empty)
}

/// A text leaf under construction; converts into a [`Node`] with `.into()`.
#[derive(Debug, Clone)]
pub struct Text {
    content: String,
    classes: String,
}

/// A text leaf. Default flow is `wrap`; `truncate` cuts with `…`, `nowrap` cuts without.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// let n: Node = text("hi").bold().muted().into();
/// assert_eq!(n.classes(), "bold text-muted");
/// ```
pub fn text(s: impl Into<String>) -> Text {
    Text {
        content: s.into(),
        classes: String::new(),
    }
}

impl Text {
    /// Appends classes.
    #[must_use]
    pub fn class(mut self, class: &str) -> Self {
        if !class.trim().is_empty() {
            if !self.classes.is_empty() {
                self.classes.push(' ');
            }
            self.classes.push_str(class);
        }
        self
    }

    /// Adds `bold`.
    #[must_use]
    pub fn bold(self) -> Self {
        self.class("bold")
    }

    /// Adds `text-muted`.
    #[must_use]
    pub fn muted(self) -> Self {
        self.class("text-muted")
    }
}

impl<M> From<Text> for Node<M> {
    fn from(t: Text) -> Self {
        Node::leaf(&t.classes, TextWidget(t.content))
    }
}

struct TextWidget(String);

pub(crate) fn str_width(s: &str) -> usize {
    Span::raw(s).width()
}

/// Cuts `line` to `max` columns, ending in `…` when anything was cut.
pub(crate) fn truncate(line: &str, max: usize) -> String {
    if str_width(line) <= max {
        return line.to_owned();
    }
    let mut out = String::new();
    let mut w = 0;
    let mut buf = [0u8; 4];
    for ch in line.chars() {
        let cw = str_width(ch.encode_utf8(&mut buf));
        if w + cw + 1 > max {
            break;
        }
        out.push(ch);
        w += cw;
    }
    if max > 0 {
        out.push('…');
    }
    out
}

impl<M> Widget<M> for TextWidget {
    fn render(&self, area: Rect, buf: &mut Buffer, cx: &RenderCx<'_>) {
        let align = match cx.class.align {
            Some(TextAlign::Center) => Alignment::Center,
            Some(TextAlign::Right) => Alignment::Right,
            _ => Alignment::Left,
        };
        let flow = cx.class.flow.unwrap_or(Flow::Wrap);
        let p = if flow == Flow::Truncate {
            let lines: Vec<Line<'_>> = self
                .0
                .lines()
                .map(|l| Line::raw(truncate(l, usize::from(area.width))))
                .collect();
            Paragraph::new(RText::from(lines))
        } else {
            Paragraph::new(self.0.as_str())
        };
        let p = if flow == Flow::Wrap {
            p.wrap(Wrap { trim: true })
        } else {
            p
        };
        p.style(cx.style()).alignment(align).render(area, buf);
    }

    fn intrinsic(&self, axis: Direction) -> u16 {
        let n = match axis {
            Direction::Horizontal => self.0.lines().map(str_width).max().unwrap_or(0),
            Direction::Vertical => self.0.lines().count().max(1),
        };
        u16::try_from(n).unwrap_or(u16::MAX)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn class_appends_and_reparses() {
        let n: Node = col("p-1", []).class("bold").class("");
        assert_eq!(n.classes(), "p-1 bold");
        assert!(
            n.style()
                .unwrap()
                .modifiers
                .contains(ratatui::style::Modifier::BOLD)
        );
    }

    #[test]
    fn bad_class_is_kept() {
        let n: Node = row("bg-primary", []);
        assert_eq!(n.style().unwrap_err().token, "bg-primary");
        let n: Node = row("", []).class("nope");
        assert!(n.style().is_err());
    }

    #[test]
    fn find_and_focusable() {
        let n: Node = col("", [text("a").into(), row("", []).id("r")]).id("c");
        assert!(n.is_focusable());
        assert!(n.find("r").is_some_and(Node::is_focusable));
        let t: Node = Node::from(text("x")).id("t");
        assert!(!t.is_focusable());
        assert!(n.find("zz").is_none());
    }

    #[test]
    fn truncate_ellipsis() {
        assert_eq!(truncate("hello", 5), "hello");
        assert_eq!(truncate("hello world", 6), "hello…");
        assert_eq!(truncate("hello", 1), "…");
        assert_eq!(truncate("hello", 0), "");
    }

    #[test]
    fn text_intrinsic() {
        let w = TextWidget("ab\nlonger".into());
        assert_eq!(Widget::<()>::intrinsic(&w, Direction::Horizontal), 6);
        assert_eq!(Widget::<()>::intrinsic(&w, Direction::Vertical), 2);
    }
}
