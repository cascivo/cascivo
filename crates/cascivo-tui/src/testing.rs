//! Headless test helpers: drive an [`App`] with key chords and a virtual clock, then assert on
//! plain text or on single cells.
//!
//! **Text rule** (used by [`TestApp::render`] and [`render_to_string`]): the screen is
//! `rows` lines joined by `'\n'`; trailing spaces are trimmed from every line, and trailing
//! *empty* lines are dropped (so a blank screen is `""`). Leading and interior blank lines
//! stay, so row positions in the string match screen rows.
//!
//! Snapshots are plain `assert_eq!` against inline strings; no snapshot crate is needed.

use std::time::Duration;

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{Event, KeyCode, KeyEvent, KeyModifiers};
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier};

use crate::app::App;
use crate::class::Role;
use crate::error::TuiError;
use crate::keys::Chord;
use crate::node::Node;
use crate::runtime::{MAX_CHAIN, Runtime};
use crate::theme::Theme;

/// One screen cell with its style and, when it matches the theme, role names.
///
/// `Display` reads like `"x fg=accent bg=surface +BOLD"`; a colour that is no theme role
/// prints as its colour value (e.g. `#ff0000`, `reset`).
///
/// A colour shared by several roles resolves to the first of them in [`Role::ALL`] order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CellView {
    /// The cell's glyph (a space for an empty cell).
    pub symbol: String,
    /// Foreground colour.
    pub fg: Color,
    /// Background colour.
    pub bg: Color,
    /// Text modifiers.
    pub modifiers: Modifier,
    /// The role whose colour equals `fg`, if any.
    pub fg_role: Option<Role>,
    /// The role whose colour equals `bg`, if any.
    pub bg_role: Option<Role>,
}

impl std::fmt::Display for CellView {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = |role: Option<Role>, c: Color| match role {
            Some(r) => r.name().to_owned(),
            None => c.to_string(),
        };
        write!(
            f,
            "{} fg={} bg={}",
            self.symbol,
            name(self.fg_role, self.fg),
            name(self.bg_role, self.bg)
        )?;
        for (m, _) in self.modifiers.iter_names() {
            write!(f, " +{m}")?;
        }
        Ok(())
    }
}

fn role_of(theme: &Theme, c: Color) -> Option<Role> {
    Role::ALL.into_iter().find(|r| theme.color(*r) == c)
}

/// The text of `buf` under the module's trimming rule.
pub(crate) fn buffer_text(buf: &Buffer) -> String {
    let mut lines: Vec<String> = (0..buf.area.height)
        .map(|y| {
            // A wide glyph's trailing cells hold blanks; skip them so the text is not
            // padded between characters.
            let mut s = String::new();
            let mut skip = 0;
            for x in 0..buf.area.width {
                if skip > 0 {
                    skip -= 1;
                    continue;
                }
                let sym = buf[(x, y)].symbol();
                skip = ratatui::text::Span::raw(sym).width().saturating_sub(1);
                s.push_str(sym);
            }
            s.trim_end().to_owned()
        })
        .collect();
    while lines.last().is_some_and(String::is_empty) {
        lines.pop();
    }
    lines.join("\n")
}

/// Renders a node once, statelessly, with the default theme and no focus.
///
/// Text follows the module's trimming rule.
///
/// ```
/// use cascivo_tui::{col, render_to_string, text, Node};
///
/// let n: Node<()> = col("", [text("hi").into()]);
/// assert_eq!(render_to_string(&n, 10, 3).unwrap(), "hi");
/// let bad: Node<()> = col("bg-primry", []);
/// assert!(render_to_string(&bad, 10, 3).is_err());
/// ```
///
/// # Errors
/// [`TuiError::Class`] when any class string is invalid.
pub fn render_to_string<M>(node: &Node<M>, cols: u16, rows: u16) -> Result<String, TuiError> {
    let area = Rect::new(0, 0, cols, rows);
    let mut buf = Buffer::empty(area);
    crate::layout::render(node, area, &mut buf, &Theme::default(), None)?;
    Ok(buffer_text(&buf))
}

/// A headless harness: an [`App`] in a [`Runtime`] on a fixed grid with a virtual clock.
///
/// Every action redraws. Time only moves with [`advance`](Self::advance), so
/// [`Cmd::tick`](crate::Cmd::tick) tests are deterministic.
///
/// ```
/// use cascivo_tui::prelude::*;
///
/// #[derive(Clone)]
/// enum Msg { Inc, Quit }
/// struct Counter(i32);
/// impl App for Counter {
///     type Msg = Msg;
///     fn update(&mut self, m: Msg) -> Cmd<Msg> {
///         match m {
///             Msg::Inc => { self.0 += 1; Cmd::none() }
///             Msg::Quit => Cmd::Quit,
///         }
///     }
///     fn view(&self) -> Node<Msg> {
///         col("", [text(format!("count: {}", self.0)).into()])
///     }
///     fn keys(&self) -> Keymap<Msg> {
///         Keymap::new().bind("+", "add", Msg::Inc).bind("q", "quit", Msg::Quit)
///     }
/// }
///
/// let mut t = TestApp::new(Counter(0), 20, 3);
/// t.press("+").press("+");
/// assert_eq!(t.render().unwrap(), "count: 2");
/// assert!(!t.is_quit());
/// t.press("q");
/// assert!(t.is_quit());
/// ```
pub struct TestApp<A: App> {
    rt: Runtime<A>,
    buf: Buffer,
    now: Duration,
}

impl<A: App> TestApp<A> {
    /// Starts `app` on a `cols` x `rows` grid with the default theme (true colour).
    pub fn new(app: A, cols: u16, rows: u16) -> Self {
        let mut rt = Runtime::new(app, Theme::default(), cols, rows);
        rt.start(Duration::ZERO);
        let mut t = Self {
            rt,
            buf: Buffer::empty(Rect::new(0, 0, cols, rows)),
            now: Duration::ZERO,
        };
        t.redraw();
        t
    }

    /// Switches theme.
    ///
    /// # Panics
    /// On an unknown theme name (test-only API); the message lists the valid names.
    #[must_use]
    pub fn theme(mut self, name: &str) -> Self {
        if Theme::by_name(name).is_none() {
            panic!(
                "TestApp::theme: unknown theme \"{name}\"; available: {}",
                Theme::names().join(", ")
            );
        }
        // Through the command so the app's `theme_changed` hook fires as it does at runtime.
        self.rt
            .apply(crate::Cmd::SetTheme(name.to_owned()), self.now);
        self.redraw();
        self
    }

    /// Runs queued [`Cmd::Task`](crate::Cmd::Task) closures inline, feeding each result to
    /// `update`, until none are left (at most [`MAX_CHAIN`] rounds, so a task that always
    /// schedules another cannot hang a test).
    fn run_tasks(&mut self) {
        for _ in 0..MAX_CHAIN {
            let tasks = self.rt.take_tasks();
            if tasks.is_empty() || self.rt.quit_requested() {
                return;
            }
            for task in tasks {
                self.rt.apply(crate::Cmd::Msg(task()), self.now);
            }
        }
    }

    fn redraw(&mut self) {
        self.run_tasks();
        let (w, h) = self.rt.size();
        let area = Rect::new(0, 0, w, h);
        let mut buf = Buffer::empty(area);
        // Infallible: errors are painted as a panel and kept in `view_error`.
        let _ = self.rt.draw(area, &mut buf);
        self.buf = buf;
    }

    /// Presses a key chord such as `"ctrl+k"` or `"tab"`, then redraws.
    ///
    /// # Panics
    /// If `chord` does not parse; the message names it.
    pub fn press(&mut self, chord: &str) -> &mut Self {
        let c = Chord::parse(chord)
            .unwrap_or_else(|e| panic!("TestApp::press: invalid chord \"{chord}\": {e}"));
        self.rt.step(Event::Key(c.to_key_event()), self.now);
        self.redraw();
        self
    }

    /// Types `s` one character at a time (uppercase letters carry shift, as [`Chord`] does).
    pub fn type_text(&mut self, s: &str) -> &mut Self {
        for ch in s.chars() {
            let k = Chord::from_event(&KeyEvent::new(KeyCode::Char(ch), KeyModifiers::NONE));
            self.rt.step(Event::Key(k.to_key_event()), self.now);
            self.redraw();
        }
        self
    }

    /// Moves the virtual clock forward `ms` milliseconds, delivers due ticks, redraws.
    pub fn advance(&mut self, ms: u64) -> &mut Self {
        self.now += Duration::from_millis(ms);
        self.rt.poll_ticks(self.now);
        self.redraw();
        self
    }

    /// Resizes the grid and redraws.
    pub fn resize(&mut self, cols: u16, rows: u16) -> &mut Self {
        self.rt.step(Event::Resize(cols, rows), self.now);
        self.redraw();
        self
    }

    /// Draws afresh and returns the screen text (trailing spaces trimmed per row, trailing
    /// empty rows dropped; see the module docs).
    ///
    /// # Errors
    /// The view's class error or the keymap's bad chord, instead of the runtime's red panel.
    pub fn render(&mut self) -> Result<String, TuiError> {
        self.redraw();
        match self.rt.view_error() {
            Some(TuiError::Class(c)) => Err(TuiError::Class(c.clone())),
            Some(TuiError::Key(k)) => Err(TuiError::Key(k.clone())),
            _ => Ok(buffer_text(&self.buf)),
        }
    }

    /// The cell at column `x`, row `y` of a fresh draw.
    ///
    /// # Panics
    /// If `(x, y)` is outside the grid.
    pub fn cell(&mut self, x: u16, y: u16) -> CellView {
        self.redraw();
        let a = self.buf.area;
        assert!(
            x < a.width && y < a.height,
            "TestApp::cell({x}, {y}) is outside the {}x{} grid",
            a.width,
            a.height
        );
        let c = &self.buf[(x, y)];
        let theme = self.rt.theme();
        CellView {
            symbol: c.symbol().to_owned(),
            fg: c.fg,
            bg: c.bg,
            modifiers: c.modifier,
            fg_role: role_of(theme, c.fg),
            bg_role: role_of(theme, c.bg),
        }
    }

    /// The app, for asserting on state.
    pub fn app(&self) -> &A {
        self.rt.app()
    }

    /// The focused widget id.
    pub fn focused(&self) -> Option<&str> {
        self.rt.focused()
    }

    /// Whether the app quit (via `Cmd::Quit` or `ctrl+c`).
    pub fn is_quit(&self) -> bool {
        self.rt.quit_requested()
    }
}
