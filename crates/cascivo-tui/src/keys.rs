//! Key chords, app-level key bindings and the key dispatch order.

use crate::error::TuiError;
use crate::node::Node;
use ratatui::crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use std::fmt;

const MODS: KeyModifiers = KeyModifiers::CONTROL
    .union(KeyModifiers::ALT)
    .union(KeyModifiers::SHIFT);

/// One key plus modifiers, normalized so terminal quirks compare equal.
///
/// Normal form: only `ctrl`/`alt`/`shift` are kept; `BackTab` is `shift+tab`; a shifted
/// letter is the uppercase char without the shift flag (`"Q"` == `"shift+q"`); shift on any
/// other char is dropped, because terminals report the produced char (`?`, not `shift+/`).
/// So bind `"?"`, never `"shift+/"`.
///
/// ```
/// use cascivo_tui::Chord;
///
/// let c = Chord::parse("Ctrl+K").unwrap();
/// assert_eq!(c.to_string(), "ctrl+k");
/// assert_eq!(Chord::parse("shift+tab").unwrap(), Chord::parse("backtab").unwrap());
/// assert!(c.matches(&c.to_key_event()));
/// assert!(Chord::parse("ctrl+").is_err());
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Chord {
    code: KeyCode,
    mods: KeyModifiers,
}

const NAMES: &[(&str, KeyCode)] = &[
    ("enter", KeyCode::Enter),
    ("esc", KeyCode::Esc),
    ("escape", KeyCode::Esc),
    ("tab", KeyCode::Tab),
    ("space", KeyCode::Char(' ')),
    ("backspace", KeyCode::Backspace),
    ("delete", KeyCode::Delete),
    ("del", KeyCode::Delete),
    ("insert", KeyCode::Insert),
    ("home", KeyCode::Home),
    ("end", KeyCode::End),
    ("pageup", KeyCode::PageUp),
    ("pagedown", KeyCode::PageDown),
    ("up", KeyCode::Up),
    ("down", KeyCode::Down),
    ("left", KeyCode::Left),
    ("right", KeyCode::Right),
];

impl Chord {
    /// Parses `"ctrl+shift+k"`, `"tab"`, `"f5"`, `"q"`. Names and modifiers are
    /// case-insensitive; a bare single char keeps its case (`"Q"` is shift+q), after a modifier it does not (`"ctrl+K"` is ctrl+k). Names: `enter`,
    /// `esc`/`escape`, `tab`, `backtab`, `space`, `backspace`, `delete`/`del`, `insert`,
    /// `home`, `end`, `pageup`, `pagedown`, arrows, `f1`..`f12`. Modifiers: `ctrl`, `alt`,
    /// `shift`, joined by `+`. A bare `"+"` is the plus key; `"ctrl++"` is not supported.
    ///
    /// # Errors
    /// [`TuiError::Key`] naming the whole input.
    pub fn parse(s: &str) -> Result<Self, TuiError> {
        let bad = || TuiError::Key(s.to_owned());
        let (mod_parts, key) = if s == "+" {
            (Vec::new(), "+")
        } else {
            let mut parts: Vec<&str> = s.split('+').collect();
            let key = parts.pop().ok_or_else(bad)?;
            (parts, key)
        };
        let mut mods = KeyModifiers::NONE;
        for m in mod_parts {
            mods |= match m.to_ascii_lowercase().as_str() {
                "ctrl" | "control" => KeyModifiers::CONTROL,
                "alt" => KeyModifiers::ALT,
                "shift" => KeyModifiers::SHIFT,
                _ => return Err(bad()),
            };
        }
        let mut chars = key.chars();
        let code = match (chars.next(), chars.next()) {
            (None, _) => return Err(bad()),
            (Some(c), None) if !mods.is_empty() => {
                KeyCode::Char(c.to_lowercase().next().unwrap_or(c))
            }
            (Some(c), None) => KeyCode::Char(c),
            _ => {
                let lower = key.to_ascii_lowercase();
                if lower == "backtab" {
                    mods |= KeyModifiers::SHIFT;
                    KeyCode::Tab
                } else if let Some((_, c)) = NAMES.iter().find(|(n, _)| *n == lower) {
                    *c
                } else if let Some(n) = lower
                    .strip_prefix('f')
                    .and_then(|n| n.parse::<u8>().ok())
                    .filter(|n| (1..=12).contains(n) && lower.len() == 1 + n.to_string().len())
                {
                    KeyCode::F(n)
                } else {
                    return Err(bad());
                }
            }
        };
        Ok(Self::norm(code, mods))
    }

    fn norm(code: KeyCode, mods: KeyModifiers) -> Self {
        let mut mods = mods & MODS;
        let code = match code {
            KeyCode::BackTab => {
                mods |= KeyModifiers::SHIFT;
                KeyCode::Tab
            }
            KeyCode::Char(c) if mods.contains(KeyModifiers::SHIFT) => {
                mods -= KeyModifiers::SHIFT;
                if c.is_alphabetic() {
                    KeyCode::Char(c.to_uppercase().next().unwrap_or(c))
                } else {
                    KeyCode::Char(c)
                }
            }
            c => c,
        };
        Self { code, mods }
    }

    /// Whether `key` is this chord (event kind is ignored; the runtime filters to presses).
    pub fn matches(&self, key: &KeyEvent) -> bool {
        *self == Self::from_event(key)
    }

    /// The normalized chord of a terminal event.
    pub fn from_event(key: &KeyEvent) -> Self {
        Self::norm(key.code, key.modifiers)
    }

    /// A synthetic key event for this chord (tests, `TestApp::press`).
    pub fn to_key_event(&self) -> KeyEvent {
        let mut mods = self.mods;
        if matches!(self.code, KeyCode::Char(c) if c.is_uppercase()) {
            mods |= KeyModifiers::SHIFT;
        }
        KeyEvent::new(self.code, mods)
    }
}

impl fmt::Display for Chord {
    /// Canonical lowercase form, e.g. `ctrl+k`, `shift+tab`, `shift+q`, `f5`, `space`.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.mods.contains(KeyModifiers::CONTROL) {
            f.write_str("ctrl+")?;
        }
        if self.mods.contains(KeyModifiers::ALT) {
            f.write_str("alt+")?;
        }
        if self.mods.contains(KeyModifiers::SHIFT)
            || matches!(self.code, KeyCode::Char(c) if c.is_uppercase())
        {
            f.write_str("shift+")?;
        }
        match self.code {
            KeyCode::Char(' ') => f.write_str("space"),
            KeyCode::Char(c) => write!(f, "{}", c.to_lowercase()),
            KeyCode::F(n) => write!(f, "f{n}"),
            KeyCode::Enter => f.write_str("enter"),
            KeyCode::Esc => f.write_str("esc"),
            KeyCode::Tab => f.write_str("tab"),
            KeyCode::Backspace => f.write_str("backspace"),
            KeyCode::Delete => f.write_str("delete"),
            KeyCode::Insert => f.write_str("insert"),
            KeyCode::Home => f.write_str("home"),
            KeyCode::End => f.write_str("end"),
            KeyCode::PageUp => f.write_str("pageup"),
            KeyCode::PageDown => f.write_str("pagedown"),
            KeyCode::Up => f.write_str("up"),
            KeyCode::Down => f.write_str("down"),
            KeyCode::Left => f.write_str("left"),
            KeyCode::Right => f.write_str("right"),
            other => write!(f, "{other:?}"),
        }
    }
}

struct Binding<M> {
    chord: Chord,
    hint: Option<String>,
    msg: M,
}

/// App-level bindings: chord to message. First match wins.
///
/// The builder methods return `Self`, so a bad chord string cannot return an error there:
/// the binding is skipped and the first error is kept in [`error`](Keymap::error). The
/// runtime surfaces it like a class error (error panel); it never panics.
///
/// ```
/// use cascivo_tui::{Keymap, Chord};
///
/// let km = Keymap::new().bind("q", "quit", 1).ambient("ctrl+c", 2);
/// assert_eq!(km.lookup(&Chord::parse("q").unwrap().to_key_event()), Some(&1));
/// assert_eq!(km.hints(), vec![("q".to_string(), "quit".to_string())]);
/// assert!(Keymap::new().bind("nope", "x", 0).error().is_some());
/// ```
pub struct Keymap<M> {
    bindings: Vec<Binding<M>>,
    error: Option<TuiError>,
}

impl<M> Default for Keymap<M> {
    fn default() -> Self {
        Self::new()
    }
}

impl<M> Keymap<M> {
    /// An empty keymap.
    pub fn new() -> Self {
        Self {
            bindings: Vec::new(),
            error: None,
        }
    }

    fn add(mut self, chord: &str, hint: Option<&str>, msg: M) -> Self {
        match Chord::parse(chord) {
            Ok(chord) => self.bindings.push(Binding {
                chord,
                hint: hint.map(str::to_owned),
                msg,
            }),
            Err(e) => {
                self.error.get_or_insert(e);
            }
        }
        self
    }

    /// Binds `chord` and shows it in [`hints`](Self::hints) with the label `hint`.
    #[must_use]
    pub fn bind(self, chord: &str, hint: &str, msg: M) -> Self {
        self.add(chord, Some(hint), msg)
    }

    /// Binds `chord` without listing it in hints (global shortcuts like `ctrl+c`).
    #[must_use]
    pub fn ambient(self, chord: &str, msg: M) -> Self {
        self.add(chord, None, msg)
    }

    /// The message bound to `key`, if any.
    pub fn lookup(&self, key: &KeyEvent) -> Option<&M> {
        let c = Chord::from_event(key);
        self.bindings.iter().find(|b| b.chord == c).map(|b| &b.msg)
    }

    /// `(chord, hint)` for shown bindings, in bind order; ambient ones excluded.
    pub fn hints(&self) -> Vec<(String, String)> {
        self.bindings
            .iter()
            .filter_map(|b| Some((b.chord.to_string(), b.hint.clone()?)))
            .collect()
    }

    /// The first bad chord passed to `bind`/`ambient`, if any.
    pub fn error(&self) -> Option<&TuiError> {
        self.error.as_ref()
    }
}

/// What a key press resolved to.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Dispatch<M> {
    /// A layer consumed the key and produced this message.
    Msg(M),
    /// Nobody consumed Tab: move focus forward.
    FocusNext,
    /// Nobody consumed Shift-Tab: move focus back.
    FocusPrev,
    /// Nobody wanted the key.
    Unhandled,
}

/// Routes a key through the layers, first hit wins: focused widget (its
/// [`on_key`](Node::on_key)), then the app keymap, then Tab/Shift-Tab focus movement.
///
/// With a `modal` subtree active the modal is a trap: `focused` must be inside it (the
/// runtime restricts the focus ring to the modal's ids), the modal root's own `on_key` is
/// tried after the focused widget, and the app keymap is **not** consulted. Tab still moves
/// focus, within the modal ring.
pub fn dispatch<M: Clone>(
    key: &KeyEvent,
    modal: Option<&Node<M>>,
    focused: Option<&Node<M>>,
    app: &Keymap<M>,
) -> Dispatch<M> {
    if let Some(m) = focused.and_then(|n| n.on_key(key)) {
        return Dispatch::Msg(m);
    }
    match modal {
        Some(root) => {
            if let Some(m) = root.on_key(key) {
                return Dispatch::Msg(m);
            }
        }
        None => {
            if let Some(m) = app.lookup(key) {
                return Dispatch::Msg(m.clone());
            }
        }
    }
    let c = Chord::from_event(key);
    if c.code == KeyCode::Tab && c.mods.is_empty() {
        Dispatch::FocusNext
    } else if c.code == KeyCode::Tab && c.mods == KeyModifiers::SHIFT {
        Dispatch::FocusPrev
    } else {
        Dispatch::Unhandled
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::focus::Focus;
    use crate::layout::render;
    use crate::node::{Widget, col};
    use crate::theme::Theme;
    use ratatui::{buffer::Buffer, layout::Rect};

    fn ch(s: &str) -> Chord {
        Chord::parse(s).unwrap()
    }

    #[test]
    fn parse_table() {
        let ok = [
            ("q", "q"),
            ("Q", "shift+q"),
            ("shift+q", "shift+q"),
            ("ctrl+shift+k", "ctrl+shift+k"),
            ("CTRL+K", "ctrl+k"),
            ("F5", "f5"),
            ("f12", "f12"),
            ("Tab", "tab"),
            ("shift+tab", "shift+tab"),
            ("backtab", "shift+tab"),
            ("Esc", "esc"),
            ("escape", "esc"),
            ("del", "delete"),
            ("PageDown", "pagedown"),
            ("alt+enter", "alt+enter"),
            ("space", "space"),
            ("+", "+"),
            ("?", "?"),
        ];
        for (inp, canon) in ok {
            assert_eq!(ch(inp).to_string(), canon, "{inp}");
        }
        for bad in [
            "",
            "ctrl+",
            "foo",
            "ctrl+foo+k",
            "f13",
            "f0",
            "f01",
            "ctrl++",
            "+k",
        ] {
            match Chord::parse(bad) {
                Err(TuiError::Key(s)) => assert_eq!(s, bad),
                other => panic!("{bad}: {other:?}"),
            }
        }
    }

    #[test]
    fn normalization() {
        assert_eq!(ch("shift+tab"), ch("backtab"));
        assert_eq!(ch("Q"), ch("shift+q"));
        assert_ne!(ch("Q"), ch("q"));
        let ev = KeyEvent::new(KeyCode::BackTab, KeyModifiers::SHIFT);
        assert!(ch("shift+tab").matches(&ev));
        let ev = KeyEvent::new(KeyCode::Char('q'), KeyModifiers::SHIFT);
        assert!(ch("Q").matches(&ev));
        let ev = KeyEvent::new(KeyCode::Char('?'), KeyModifiers::SHIFT);
        assert!(ch("?").matches(&ev));
        for s in ["ctrl+k", "Q", "f5", "shift+tab", "alt+left", "space"] {
            assert!(ch(s).matches(&ch(s).to_key_event()), "{s}");
        }
    }

    #[test]
    fn keymap_hints_exclude_ambient_and_bad_chord_is_recorded() {
        let km = Keymap::new()
            .bind("q", "quit", 1)
            .ambient("ctrl+c", 2)
            .bind("bogus", "x", 3)
            .bind("?", "help", 4);
        assert_eq!(
            km.hints(),
            vec![("q".into(), "quit".into()), ("?".into(), "help".into())]
        );
        assert_eq!(km.lookup(&ch("ctrl+c").to_key_event()), Some(&2));
        assert!(matches!(km.error(), Some(TuiError::Key(s)) if s == "bogus"));
        assert!(Keymap::<u8>::new().error().is_none());
    }

    struct Btn(Option<(&'static str, u8)>);
    impl Widget<u8> for Btn {
        fn render(&self, _: Rect, _: &mut Buffer, _: &crate::layout::RenderCx<'_>) {}
        fn focusable(&self) -> bool {
            true
        }
        fn on_key(&self, key: &KeyEvent) -> Option<u8> {
            let (c, m) = self.0?;
            ch(c).matches(key).then_some(m)
        }
    }
    fn btn(id: &str, on: Option<(&'static str, u8)>) -> Node<u8> {
        Node::leaf("h-1", Btn(on)).id(id)
    }
    fn key(s: &str) -> KeyEvent {
        ch(s).to_key_event()
    }

    #[test]
    fn layering() {
        let app = Keymap::new().bind("enter", "go", 10).bind("q", "quit", 11);
        let b = btn("a", Some(("enter", 1)));
        // focused widget consumes before the app keymap
        assert_eq!(
            dispatch(&key("enter"), None, Some(&b), &app),
            Dispatch::Msg(1)
        );
        // not consumed: app keymap
        assert_eq!(dispatch(&key("q"), None, Some(&b), &app), Dispatch::Msg(11));
        // nobody: Tab / Shift-Tab / unhandled
        assert_eq!(
            dispatch(&key("tab"), None, Some(&b), &app),
            Dispatch::FocusNext
        );
        assert_eq!(
            dispatch(&key("shift+tab"), None, None, &app),
            Dispatch::FocusPrev
        );
        assert_eq!(dispatch(&key("x"), None, None, &app), Dispatch::Unhandled);
        // an app binding on tab consumes it
        let app = Keymap::new().bind("tab", "t", 5);
        assert_eq!(dispatch(&key("tab"), None, None, &app), Dispatch::Msg(5));
    }

    #[test]
    fn modal_is_a_trap() {
        let app = Keymap::new().bind("q", "quit", 11);
        let modal: Node<u8> = col("", [btn("ok", Some(("esc", 7)))]).id("m");
        let inner = modal.find("ok").unwrap();
        assert_eq!(
            dispatch(&key("esc"), Some(&modal), Some(inner), &app),
            Dispatch::Msg(7)
        );
        // app binding is not reachable under a modal
        assert_eq!(
            dispatch(&key("q"), Some(&modal), Some(inner), &app),
            Dispatch::Unhandled
        );
        assert_eq!(
            dispatch(&key("tab"), Some(&modal), Some(inner), &app),
            Dispatch::FocusNext
        );
    }

    fn ring(n: &Node<u8>, w: u16) -> Vec<String> {
        let area = Rect::new(0, 0, w, 10);
        let mut buf = Buffer::empty(area);
        let out = render(n, area, &mut buf, &Theme::default(), None).unwrap();
        out.focus.into_iter().map(|(id, _)| id).collect()
    }

    fn modal_node() -> Node<u8> {
        col("", [btn("m1", None), btn("m2", None)]).id("modal")
    }

    #[test]
    fn tab_ring_wraps_skips_hidden_and_traps() {
        let tree: Node<u8> = col(
            "",
            [
                btn("a", None),
                btn("hid", None).class("hidden"),
                btn("wide", None).class("narrow:hidden"),
                modal_node(),
            ],
        );
        let strs = |v: &[&str]| v.iter().map(|s| (*s).to_owned()).collect::<Vec<_>>();
        let ids = ring(&tree, 79);
        assert_eq!(ids, strs(&["a", "modal", "m1", "m2"]));
        assert_eq!(ring(&tree, 80), strs(&["a", "wide", "modal", "m1", "m2"]));
        let mut f = Focus::default();
        f.sync(&ids);
        assert_eq!(f.current(), Some("a"));
        assert_eq!(f.next(&ids), Some("modal"));
        f.next(&ids);
        f.next(&ids);
        assert_eq!(f.next(&ids), Some("a"), "wraps");
        assert_eq!(f.prev(&ids), Some("m2"), "reverse wraps");

        // modal open: the runtime passes only the modal subtree's ids
        let mring = ring(&modal_node(), 80)[1..].to_vec();
        assert_eq!(mring, strs(&["m1", "m2"]));
        f.set("a");
        f.sync(&mring);
        assert_eq!(f.current(), Some("m1"), "focus pulled into the trap");
        assert_eq!(f.prev(&mring), Some("m2"));
        assert_eq!(f.next(&mring), Some("m1"));
    }

    #[test]
    fn focus_survives_and_falls_forward() {
        let mut f = Focus::default();
        let abc: Vec<String> = ["a", "b", "c"].map(String::from).to_vec();
        f.set("b");
        f.sync(&abc);
        assert_eq!(f.current(), Some("b"));
        f.sync(&abc);
        assert_eq!(f.current(), Some("b"), "kept across re-render");
        let ac: Vec<String> = ["a", "c"].map(String::from).to_vec();
        f.sync(&ac);
        assert_eq!(f.current(), Some("c"), "falls to the id that followed it");
        let a: Vec<String> = vec!["a".into()];
        f.sync(&a);
        assert_eq!(f.current(), Some("a"));
        f.sync(&[]);
        assert_eq!(f.current(), None);
    }
}
