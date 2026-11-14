use cascivo_tui::prelude::*;

#[derive(Clone, Debug, PartialEq)]
enum Msg {
    Open,
    Close,
    Bg(u8),
    In(u8),
    Toast(String),
    Expire,
    Quit,
}

#[derive(Default)]
struct Demo {
    open: bool,
    bg: [u32; 2],
    inside: [u32; 2],
    quits: u32,
    toasts: Vec<(Kind, String)>,
    with_toasts: bool,
    seq: u32,
}

impl App for Demo {
    type Msg = Msg;
    fn update(&mut self, m: Msg) -> Cmd<Msg> {
        match m {
            Msg::Open => self.open = true,
            Msg::Close => self.open = false,
            Msg::Bg(i) => self.bg[usize::from(i)] += 1,
            Msg::In(i) => self.inside[usize::from(i)] += 1,
            Msg::Quit => self.quits += 1,
            Msg::Toast(s) => {
                self.seq += 1;
                self.toasts.push((Kind::Info, s));
                return Cmd::tick(1000, Msg::Expire);
            }
            Msg::Expire => {
                self.toasts.remove(0);
            }
        }
        Cmd::None
    }
    fn view(&self) -> Node<Msg> {
        let mut kids: Vec<Node<Msg>> = vec![
            text("base page").into(),
            button("Open", Msg::Open).id("open"),
            button("B1", Msg::Bg(0)).id("bg1"),
            button("B2", Msg::Bg(1)).id("bg2"),
        ];
        if self.open {
            let body = col(
                "",
                [
                    text("Sure?").into(),
                    button("Yes", Msg::In(0)).id("in1"),
                    button("No", Msg::In(1)).id("in2"),
                ],
            );
            kids.push(modal("Confirm", body, Msg::Close));
        }
        if self.with_toasts {
            kids.push(toasts(&self.toasts));
        }
        col("", kids)
    }
    fn keys(&self) -> Keymap<Msg> {
        Keymap::new()
            .bind("q", "quit", Msg::Quit)
            .bind("t", "toast", Msg::Toast(format!("n{}", self.seq)))
            .ambient("ctrl+x", Msg::Quit)
    }
}

#[test]
fn modal_traps_focus_keys_and_returns_to_base() {
    let mut t = TestApp::new(Demo::default(), 40, 12);
    // Base ring: open, bg1, bg2.
    assert_eq!(t.focused(), Some("open"));
    t.press("tab");
    assert_eq!(t.focused(), Some("bg1"));
    t.press("shift+tab");
    assert_eq!(t.focused(), Some("open"));
    t.press("enter");
    assert!(t.app().open);
    // Focus moved into the modal; Tab and Shift-Tab cycle only its two buttons.
    assert_eq!(t.focused(), Some("in1"));
    let mut seen = vec![];
    for _ in 0..5 {
        t.press("tab");
        seen.push(t.focused().unwrap().to_owned());
    }
    assert_eq!(seen, ["in2", "in1", "in2", "in1", "in2"]);
    t.press("shift+tab");
    assert_eq!(t.focused(), Some("in1"));
    t.press("shift+tab");
    assert_eq!(t.focused(), Some("in2"));
    // Background buttons never fire and the app keymap is skipped.
    t.press("q").press("t");
    assert_eq!(
        (t.app().bg, t.app().quits, t.app().toasts.len()),
        ([0, 0], 0, 0)
    );
    // Inside buttons fire.
    t.press("enter");
    assert_eq!(t.app().inside, [0, 1]);
    // Esc from the focused inner button closes it.
    t.press("esc");
    assert!(!t.app().open);
    assert_eq!(t.focused(), Some("open"));
    // Back on the base ring: tab walks background buttons again.
    t.press("tab");
    assert_eq!(t.focused(), Some("bg1"));
    t.press("enter");
    assert_eq!(t.app().bg, [1, 0]);
    t.press("q");
    assert_eq!(t.app().quits, 1);
}

#[test]
fn modal_snapshots_centered() {
    let mut t = TestApp::new(
        Demo {
            open: true,
            ..Demo::default()
        },
        40,
        12,
    );
    // 11x5 box in 40x12: x = (40-11)/2 = 14, y = (12-5)/2 = 3; it covers what is behind it.
    assert_eq!(
        t.render().unwrap(),
        "base page\n Open\n B1\n B2           ╭ Confirm ╮\n              │ Sure?   │\n              │  Yes    │\n              │  No     │\n              ╰─────────╯"
    );
}

#[test]
fn modal_shrinks_and_never_exceeds_screen() {
    for (cols, rows) in [(40u16, 12u16), (20, 6), (10, 3), (4, 2)] {
        let mut t = TestApp::new(
            Demo {
                open: true,
                ..Demo::default()
            },
            cols,
            rows,
        );
        let s = t.render().unwrap();
        assert!(s.lines().count() <= usize::from(rows), "{s}");
        for l in s.lines() {
            assert!(l.chars().count() <= usize::from(cols), "{cols}x{rows}\n{s}");
        }
    }
    let mut t = TestApp::new(
        Demo {
            open: true,
            ..Demo::default()
        },
        20,
        6,
    );
    let s = t.render().unwrap();
    assert!(
        s.contains("Confirm") && s.contains("╭") && s.contains("╯"),
        "{s}"
    );
}

#[test]
fn toasts_stack_three_bottom_right_and_expire() {
    let mut t = TestApp::new(
        Demo {
            with_toasts: true,
            ..Demo::default()
        },
        30,
        12,
    );
    assert!(!t.render().unwrap().contains('╭'));
    t.press("t");
    let s = t.render().unwrap();
    let lines: Vec<&str> = s.lines().collect();
    assert_eq!(lines.len(), 12, "{s}");
    assert!(
        lines[11].ends_with('╯') && lines[10].ends_with("n0 │"),
        "{s}"
    );
    assert_eq!(lines[10].chars().count(), 30, "flush right\n{s}");
    // Four toasts in state: only the newest three show.
    for _ in 0..3 {
        t.advance(10).press("t");
    }
    assert_eq!(t.app().toasts.len(), 4);
    let s = t.render().unwrap();
    assert_eq!(s.matches("│ i ").count(), 3, "{s}");
    assert!(!s.contains("i n0"), "oldest dropped\n{s}");
    assert!(s.contains("i n3"), "{s}");
    // Each expires 1000ms after its own press.
    t.advance(995); // now 1025ms: the first three (due 1000..1020) are gone
    assert_eq!(t.app().toasts.len(), 1);
    t.advance(1000);
    assert!(t.app().toasts.is_empty());
    assert!(!t.render().unwrap().contains('╭'));
}

#[test]
fn keyhints_skip_ambient_and_truncate() {
    let km = Demo::default().keys();
    let n: Node<Msg> = keyhints(&km);
    assert_eq!(
        render_to_string(&n, 60, 1).unwrap(),
        "q quit · t toast · tab focus"
    );
    assert_eq!(render_to_string(&n, 14, 1).unwrap(), "q quit · t to…");
    assert_eq!(render_to_string(&n, 3, 1).unwrap(), "q …");
}
