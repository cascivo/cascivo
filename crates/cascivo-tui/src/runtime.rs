//! The MVU runtime: a pure, clock-injected [`Runtime`] plus the thin terminal loop [`run`].
//!
//! Time is a `Duration` since an arbitrary start the caller chooses (the loop uses
//! `Instant::elapsed`), so tick behaviour is deterministic in tests.

use std::time::{Duration, Instant};

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{self, Event, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::Rect;
use ratatui::style::{Color, Style};
use ratatui::widgets::{Paragraph, Widget as _, Wrap};

use crate::app::{App, Cmd};
use crate::error::TuiError;
use crate::focus::Focus;
use crate::keys::{Dispatch, dispatch};
use crate::layout::render;
use crate::theme::{ColorDepth, Theme};

/// Longest `Msg` -> `update` -> `Msg` chain before the runtime stops and shows an error.
pub const MAX_CHAIN: usize = 64;

/// What one event or tick did.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct StepOut {
    /// The screen may have changed.
    pub redraw: bool,
    /// The app asked to quit (or `ctrl+c`).
    pub quit: bool,
}

/// Options for [`run_with`].
#[derive(Debug, Clone, Default)]
pub struct RunOptions {
    /// Theme name; falls back to `CASCIVO_THEME`, then the default theme.
    pub theme: Option<String>,
    /// Redraw at least this often even with no event (default: only on events and ticks).
    pub tick_rate: Option<Duration>,
}

/// An [`App`] plus focus, theme and pending ticks; everything except the terminal.
///
/// Call [`start`](Self::start), then alternate [`draw`](Self::draw) and
/// [`step`](Self::step) / [`poll_ticks`](Self::poll_ticks). Focus moves over the ring of the
/// last [`draw`](Self::draw), so draw before the first key. If the view has a class error,
/// the keymap has a bad chord, or a message chain overran [`MAX_CHAIN`], `draw` paints a red
/// error panel and returns `Ok`; keys then go nowhere except `ctrl+c` and `q`, which quit.
pub struct Runtime<A: App> {
    app: A,
    focus: Focus,
    theme: Theme,
    size: (u16, u16),
    ring: Vec<String>,
    ticks: Vec<(Duration, A::Msg)>,
    fault: Option<String>,
    view_error: Option<TuiError>,
    quit: bool,
}

impl<A: App> Runtime<A> {
    /// A runtime for `app` at `cols` x `rows`.
    pub fn new(app: A, theme: Theme, cols: u16, rows: u16) -> Self {
        Self {
            app,
            focus: Focus::default(),
            theme,
            size: (cols, rows),
            ring: Vec::new(),
            ticks: Vec::new(),
            fault: None,
            view_error: None,
            quit: false,
        }
    }

    /// The app.
    pub fn app(&self) -> &A {
        &self.app
    }

    /// The app, mutably.
    pub fn app_mut(&mut self) -> &mut A {
        &mut self.app
    }

    /// The focused id.
    pub fn focused(&self) -> Option<&str> {
        self.focus.current()
    }

    /// The theme.
    pub fn theme(&self) -> &Theme {
        &self.theme
    }

    /// Switches theme (takes effect on the next draw).
    pub fn set_theme(&mut self, theme: Theme) {
        self.theme = theme;
    }

    /// The last known size `(cols, rows)`.
    pub fn size(&self) -> (u16, u16) {
        self.size
    }

    /// Whether quit was requested.
    pub fn quit_requested(&self) -> bool {
        self.quit
    }

    /// The runtime fault (e.g. chain too deep), if any.
    pub fn fault(&self) -> Option<&str> {
        self.fault.as_deref()
    }

    /// The class or keymap error behind the last [`draw`](Self::draw)'s error panel, if any.
    ///
    /// `draw` paints the panel and returns `Ok`; test helpers use this to fail instead.
    pub fn view_error(&self) -> Option<&TuiError> {
        self.view_error.as_ref()
    }

    /// Earliest pending tick deadline.
    pub fn next_deadline(&self) -> Option<Duration> {
        self.ticks.iter().map(|(d, _)| *d).min()
    }

    /// Runs [`App::init`] at time `now`.
    pub fn start(&mut self, now: Duration) -> StepOut {
        let cmd = self.app.init();
        self.apply(cmd, now)
    }

    /// Feeds one terminal event at time `now`.
    ///
    /// Only key presses count (Release and Repeat are ignored); a resize records the size and
    /// redraws; everything else is ignored.
    pub fn step(&mut self, ev: Event, now: Duration) -> StepOut {
        match ev {
            Event::Resize(w, h) => {
                self.size = (w, h);
                StepOut {
                    redraw: true,
                    quit: self.quit,
                }
            }
            Event::Key(k) if k.kind == KeyEventKind::Press => self.key(&k, now),
            _ => StepOut {
                redraw: false,
                quit: self.quit,
            },
        }
    }

    /// Delivers every tick due at `now`, earliest first (ties in schedule order).
    pub fn poll_ticks(&mut self, now: Duration) -> StepOut {
        let mut due: Vec<(Duration, A::Msg)> = Vec::new();
        let mut i = 0;
        while i < self.ticks.len() {
            if self.ticks.get(i).is_some_and(|(d, _)| *d <= now) {
                due.push(self.ticks.remove(i));
            } else {
                i += 1;
            }
        }
        due.sort_by_key(|(d, _)| *d); // stable
        let cmds = due.into_iter().map(|(_, m)| Cmd::Msg(m)).collect();
        if self.quit {
            return StepOut {
                redraw: false,
                quit: true,
            };
        }
        self.apply(Cmd::Batch(cmds), now)
    }

    fn key(&mut self, k: &KeyEvent, now: Duration) -> StepOut {
        let ctrl_c = k.modifiers == KeyModifiers::CONTROL
            && matches!(k.code, event::KeyCode::Char('c' | 'C'));
        if ctrl_c {
            self.quit = true;
            return StepOut {
                redraw: false,
                quit: true,
            };
        }
        let view = self.app.view();
        let keymap = self.app.keys();
        if self.fault.is_some() || view.style().is_err() || keymap.error().is_some() {
            let q = k.modifiers.is_empty() && k.code == event::KeyCode::Char('q');
            self.quit |= q;
            return StepOut {
                redraw: false,
                quit: self.quit,
            };
        }
        let modal = view.active_modal();
        let focused = self.focus.current().and_then(|id| view.find(id));
        match dispatch(k, modal, focused, &keymap) {
            Dispatch::Msg(m) => self.apply(Cmd::Msg(m), now),
            Dispatch::FocusNext => {
                self.focus.next(&self.ring);
                StepOut {
                    redraw: true,
                    quit: self.quit,
                }
            }
            Dispatch::FocusPrev => {
                self.focus.prev(&self.ring);
                StepOut {
                    redraw: true,
                    quit: self.quit,
                }
            }
            Dispatch::Unhandled => StepOut {
                redraw: false,
                quit: self.quit,
            },
        }
    }

    /// Runs `cmd` to completion at time `now`.
    ///
    /// Depth-first and in order: a `Batch` runs its items in sequence, and the commands a
    /// `Msg` returns run before the next sibling. A chain deeper than [`MAX_CHAIN`] stops
    /// processing and sets [`fault`](Self::fault). `Quit` stops after the commands already
    /// reached; later siblings are dropped.
    pub fn apply(&mut self, cmd: Cmd<A::Msg>, now: Duration) -> StepOut {
        let mut stack = vec![(cmd, 0usize)];
        let mut redraw = false;
        while let Some((c, depth)) = stack.pop() {
            match c {
                Cmd::None => {}
                Cmd::Quit => {
                    self.quit = true;
                    break;
                }
                Cmd::Tick(d, m) => self.ticks.push((now + d, m)),
                Cmd::SetTheme(name) => match Theme::by_name(&name) {
                    Some(t) => {
                        self.theme = t.quantize(self.theme.depth());
                        redraw = true;
                    }
                    None => {
                        self.fault = Some(format!(
                            "unknown theme \"{name}\"; available: {}",
                            Theme::names().join(", ")
                        ));
                        break;
                    }
                },
                Cmd::Batch(v) => stack.extend(v.into_iter().rev().map(|c| (c, depth))),
                Cmd::Msg(m) => {
                    redraw = true;
                    if depth >= MAX_CHAIN {
                        self.fault = Some(format!(
                            "message chain deeper than {MAX_CHAIN}: update keeps returning Cmd::Msg"
                        ));
                        break;
                    }
                    let next = self.app.update(m);
                    stack.push((next, depth + 1));
                }
            }
        }
        StepOut {
            redraw,
            quit: self.quit,
        }
    }

    /// Renders the view into `buf` over `area`, then reconciles focus with the new ring.
    ///
    /// When focus moved during reconciliation the frame is rendered again so the focus
    /// style shows. Errors (class, keymap, fault) become a full-area error panel and `Ok`.
    pub fn draw(&mut self, area: Rect, buf: &mut Buffer) -> Result<(), TuiError> {
        self.size = (area.width, area.height);
        self.view_error = None;
        let msg = self.fault.clone().or_else(|| self.try_draw(area, buf));
        if let Some(m) = msg {
            self.ring.clear();
            error_panel(&m, area, buf);
        }
        Ok(())
    }

    fn try_draw(&mut self, area: Rect, buf: &mut Buffer) -> Option<String> {
        let view = self.app.view();
        if let Some(e) = self.app.keys().error() {
            if let TuiError::Key(k) = e {
                self.view_error = Some(TuiError::Key(k.clone()));
            }
            return Some(e.to_string());
        }
        let out = match render(&view, area, buf, &self.theme, self.focus.current()) {
            Ok(o) => o,
            Err(e) => return Some(self.keep(e)),
        };
        let modal = view.active_modal();
        self.ring = out
            .focus
            .into_iter()
            .map(|(id, _)| id)
            .filter(|id| modal.is_none_or(|m| m.find(id).is_some()))
            .collect();
        let before = self.focus.current().map(str::to_owned);
        self.focus.sync(&self.ring);
        if self.focus.current() != before.as_deref() {
            buf.reset();
            if let Err(e) = render(&view, area, buf, &self.theme, self.focus.current()) {
                return Some(self.keep(e));
            }
        }
        None
    }

    fn keep(&mut self, e: TuiError) -> String {
        let msg = e.to_string();
        if let TuiError::Class(c) = e {
            self.view_error = Some(TuiError::Class(c));
        }
        msg
    }
}

fn error_panel(msg: &str, area: Rect, buf: &mut Buffer) {
    let st = Style::new().fg(Color::White).bg(Color::Red);
    buf.set_style(area, st);
    let body = format!("cascivo-tui error\n\n{msg}\n\nPress q or ctrl+c to quit.");
    Paragraph::new(body)
        .style(st)
        .wrap(Wrap { trim: false })
        .render(area, buf);
}

/// Runs `app` full-screen with default options.
///
/// # Errors
/// Terminal I/O failures. The terminal is restored on every exit path.
pub fn run<A: App>(app: A) -> Result<(), TuiError> {
    run_with(app, RunOptions::default())
}

/// Runs `app` full-screen. Theme: `opts.theme`, else `CASCIVO_THEME`, else the default;
/// quantized to [`ColorDepth::from_env`].
///
/// # Errors
/// Terminal I/O failures, or an unknown theme name (as an I/O error).
pub fn run_with<A: App>(app: A, opts: RunOptions) -> Result<(), TuiError> {
    let name = opts
        .theme
        .clone()
        .or_else(|| std::env::var("CASCIVO_THEME").ok());
    let theme = match name {
        Some(n) => Theme::by_name(&n).cloned().ok_or_else(|| {
            std::io::Error::other(format!(
                "unknown theme \"{n}\"; available: {}",
                Theme::names().join(", ")
            ))
        })?,
        None => Theme::default(),
    }
    .quantize(ColorDepth::from_env());
    let mut term = ratatui::try_init()?;
    let res = event_loop(&mut term, app, theme, opts.tick_rate);
    let restored = ratatui::try_restore();
    res.and(restored.map_err(Into::into))
}

fn event_loop<A: App>(
    term: &mut ratatui::DefaultTerminal,
    app: A,
    theme: Theme,
    tick_rate: Option<Duration>,
) -> Result<(), TuiError> {
    let clock = Instant::now();
    let sz = term.size()?;
    let mut rt = Runtime::new(app, theme, sz.width, sz.height);
    let mut out = rt.start(clock.elapsed());
    let mut redraw = true;
    while !out.quit {
        if redraw {
            term.draw(|f| {
                let area = f.area();
                // Infallible: errors are painted as a panel.
                let _ = rt.draw(area, f.buffer_mut());
            })?;
        }
        let now = clock.elapsed();
        let wait = [rt.next_deadline().map(|d| d.saturating_sub(now)), tick_rate]
            .into_iter()
            .flatten()
            .min()
            .unwrap_or(Duration::from_secs(3600));
        out = if event::poll(wait)? {
            rt.step(event::read()?, clock.elapsed())
        } else {
            let o = rt.poll_ticks(clock.elapsed());
            StepOut {
                redraw: o.redraw || tick_rate.is_some(),
                ..o
            }
        };
        redraw = out.redraw;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::keys::Keymap;
    use crate::layout::RenderCx;
    use crate::node::Node;
    use crate::node::{Widget, col, text};
    use ratatui::crossterm::event::{KeyCode, KeyEventState};

    const T0: Duration = Duration::ZERO;

    #[derive(Clone, Debug, PartialEq)]
    enum M {
        Log(u32),
        Quit,
        Burst,
        Loop,
        Later(u32),
        Schedule,
    }

    #[derive(Default)]
    struct Rec {
        seen: Vec<u32>,
        bad_class: bool,
        btns: bool,
    }

    struct Btn(&'static str);
    impl Widget<M> for Btn {
        fn render(&self, a: Rect, b: &mut Buffer, _: &RenderCx<'_>) {
            b.set_string(a.x, a.y, self.0, Style::new());
        }
        fn focusable(&self) -> bool {
            true
        }
    }

    impl App for Rec {
        type Msg = M;
        fn update(&mut self, m: M) -> Cmd<M> {
            match m {
                M::Log(n) | M::Later(n) => {
                    self.seen.push(n);
                    Cmd::None
                }
                M::Quit => Cmd::Quit,
                M::Burst => Cmd::batch([
                    Cmd::Msg(M::Log(1)),
                    Cmd::batch([Cmd::Msg(M::Log(2)), Cmd::Msg(M::Log(3))]),
                    Cmd::Msg(M::Log(4)),
                ]),
                M::Loop => Cmd::Msg(M::Loop),
                M::Schedule => {
                    Cmd::batch([Cmd::tick(100, M::Later(1)), Cmd::tick(50, M::Later(2))])
                }
            }
        }
        fn view(&self) -> Node<M> {
            if self.bad_class {
                return col("bg-primry", []);
            }
            if self.btns {
                return col(
                    "",
                    [
                        Node::leaf("h-1", Btn("one")).id("a"),
                        Node::leaf("h-1", Btn("two")).id("b"),
                    ],
                );
            }
            col("", [text("hi").into()])
        }
        fn keys(&self) -> Keymap<M> {
            Keymap::new()
                .bind("a", "log", M::Log(7))
                .bind("q", "quit", M::Quit)
                .bind("b", "burst", M::Burst)
                .bind("l", "loop", M::Loop)
                .bind("s", "sched", M::Schedule)
        }
    }

    fn rt(app: Rec) -> Runtime<Rec> {
        Runtime::new(app, Theme::default(), 20, 5)
    }

    fn key(c: char, kind: KeyEventKind) -> Event {
        Event::Key(KeyEvent {
            code: KeyCode::Char(c),
            modifiers: KeyModifiers::NONE,
            kind,
            state: KeyEventState::NONE,
        })
    }

    fn press(c: char) -> Event {
        key(c, KeyEventKind::Press)
    }

    fn special(code: KeyCode, mods: KeyModifiers) -> Event {
        Event::Key(KeyEvent::new(code, mods))
    }

    fn drawn(r: &mut Runtime<Rec>) -> Buffer {
        let area = Rect::new(0, 0, 40, 6);
        let mut buf = Buffer::empty(area);
        r.draw(area, &mut buf).unwrap();
        buf
    }

    fn text_of(b: &Buffer) -> String {
        b.content().iter().map(|c| c.symbol()).collect()
    }

    #[test]
    fn press_is_handled_release_and_repeat_ignored() {
        let mut r = rt(Rec::default());
        let o = r.step(press('a'), T0);
        assert_eq!(r.app().seen, vec![7]);
        assert_eq!(
            o,
            StepOut {
                redraw: true,
                quit: false
            }
        );
        for kind in [KeyEventKind::Release, KeyEventKind::Repeat] {
            let o = r.step(key('a', kind), T0);
            assert_eq!(o, StepOut::default());
        }
        assert_eq!(r.app().seen, vec![7]);
    }

    #[test]
    fn set_theme_cmd_switches_or_faults() {
        let mut r = rt(Rec::default());
        let o = r.apply(Cmd::SetTheme("light".into()), T0);
        assert!(o.redraw && r.fault().is_none());
        assert_eq!(r.theme().name(), "light");
        r.apply(Cmd::SetTheme("nope".into()), T0);
        assert!(
            r.fault()
                .is_some_and(|f| f.contains("unknown theme \"nope\""))
        );
    }

    #[test]
    fn resize_redraws_and_records_size() {
        let mut r = rt(Rec::default());
        let o = r.step(Event::Resize(30, 9), T0);
        assert!(o.redraw && !o.quit);
        assert_eq!(r.size(), (30, 9));
        assert_eq!(r.step(Event::FocusGained, T0), StepOut::default());
    }

    #[test]
    fn quit_cmd_ends() {
        let mut r = rt(Rec::default());
        let o = r.step(press('q'), T0);
        assert!(o.quit && r.quit_requested());
    }

    #[test]
    fn ctrl_c_always_quits() {
        let mut r = rt(Rec::default());
        let o = r.step(special(KeyCode::Char('c'), KeyModifiers::CONTROL), T0);
        assert!(o.quit);
    }

    #[test]
    fn batch_order_preserved() {
        let mut r = rt(Rec::default());
        r.step(press('b'), T0);
        assert_eq!(r.app().seen, vec![1, 2, 3, 4]);
    }

    #[test]
    fn quit_drops_later_siblings() {
        let mut r = rt(Rec::default());
        let o = r.apply(
            Cmd::batch([Cmd::Msg(M::Log(1)), Cmd::Quit, Cmd::Msg(M::Log(2))]),
            T0,
        );
        assert!(o.quit);
        assert_eq!(r.app().seen, vec![1]);
    }

    #[test]
    fn msg_chain_terminates_with_fault_and_panel() {
        let mut r = rt(Rec::default());
        let o = r.step(press('l'), T0);
        assert!(o.redraw && !o.quit);
        assert!(r.fault().unwrap().contains("64"));
        let t = text_of(&drawn(&mut r));
        assert!(t.contains("message chain deeper"), "{t}");
        // Keys are dead except q.
        r.step(press('a'), T0);
        assert!(r.app().seen.is_empty());
        assert!(r.step(press('q'), T0).quit);
    }

    #[test]
    fn tab_moves_focus_across_ring() {
        let mut r = rt(Rec {
            btns: true,
            ..Rec::default()
        });
        drawn(&mut r);
        assert_eq!(r.focused(), Some("a"));
        let o = r.step(special(KeyCode::Tab, KeyModifiers::NONE), T0);
        assert!(o.redraw);
        assert_eq!(r.focused(), Some("b"));
        r.step(special(KeyCode::Tab, KeyModifiers::NONE), T0);
        assert_eq!(r.focused(), Some("a"));
        r.step(special(KeyCode::BackTab, KeyModifiers::SHIFT), T0);
        assert_eq!(r.focused(), Some("b"));
    }

    #[test]
    fn tick_fires_after_deadline_only_in_order() {
        let ms = Duration::from_millis;
        let mut r = rt(Rec::default());
        r.step(press('s'), ms(1000));
        assert_eq!(r.next_deadline(), Some(ms(1050)));
        assert_eq!(r.poll_ticks(ms(1049)), StepOut::default());
        assert!(r.app().seen.is_empty());
        assert!(r.poll_ticks(ms(1050)).redraw);
        assert_eq!(r.app().seen, vec![2]);
        r.poll_ticks(ms(2000));
        assert_eq!(r.app().seen, vec![2, 1]);
        assert_eq!(r.next_deadline(), None);
    }

    #[test]
    fn class_error_paints_panel() {
        let mut r = rt(Rec {
            bad_class: true,
            ..Rec::default()
        });
        let t = text_of(&drawn(&mut r));
        assert!(t.contains("bg-primry"), "{t}");
        r.step(press('a'), T0);
        assert!(r.app().seen.is_empty());
        assert!(r.step(press('q'), T0).quit);
    }

    #[test]
    fn keymap_error_paints_panel() {
        struct Bad;
        impl App for Bad {
            type Msg = ();
            fn update(&mut self, (): ()) -> Cmd<()> {
                Cmd::None
            }
            fn view(&self) -> Node<()> {
                col("", [])
            }
            fn keys(&self) -> Keymap<()> {
                Keymap::new().bind("nope", "x", ())
            }
        }
        let mut r = Runtime::new(Bad, Theme::default(), 40, 6);
        let area = Rect::new(0, 0, 40, 6);
        let mut buf = Buffer::empty(area);
        r.draw(area, &mut buf).unwrap();
        assert!(text_of(&buf).contains("nope"));
    }

    #[test]
    fn modal_traps_focus_ring() {
        struct Modal;
        impl Widget<()> for Modal {
            fn render(&self, _: Rect, _: &mut Buffer, _: &RenderCx<'_>) {}
            fn traps_focus(&self) -> bool {
                true
            }
        }
        struct Ap;
        impl App for Ap {
            type Msg = ();
            fn update(&mut self, (): ()) -> Cmd<()> {
                Cmd::None
            }
            fn view(&self) -> Node<()> {
                col(
                    "",
                    [
                        Node::leaf("h-1", Btn2).id("bg"),
                        Node::leaf("h-1", Modal).id("m"),
                    ],
                )
            }
        }
        struct Btn2;
        impl Widget<()> for Btn2 {
            fn render(&self, _: Rect, _: &mut Buffer, _: &RenderCx<'_>) {}
            fn focusable(&self) -> bool {
                true
            }
        }
        let v = Ap.view();
        assert_eq!(v.active_modal().and_then(Node::focus_id), Some("m"));
        let mut r = Runtime::new(Ap, Theme::default(), 10, 4);
        let area = Rect::new(0, 0, 10, 4);
        r.draw(area, &mut Buffer::empty(area)).unwrap();
        // Modal is a leaf that is not focusable, so the trapped ring is empty: bg not reachable.
        assert_eq!(r.focused(), None);
    }
}
