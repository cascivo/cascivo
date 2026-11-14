use cascivo_tui::prelude::*;
use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{KeyCode, KeyEvent};
use ratatui::layout::Rect;

#[derive(Clone, Debug)]
enum Msg {
    Inc,
    Quit,
    Typed(char),
    Later,
    Arm,
}

#[derive(Default)]
struct Demo {
    n: i32,
    typed: String,
    fired: u32,
    bad: bool,
    field: bool,
}

struct Field;
impl Widget<Msg> for Field {
    fn render(&self, _: Rect, _: &mut Buffer, _: &RenderCx<'_>) {}
    fn focusable(&self) -> bool {
        true
    }
    fn on_key(&self, k: &KeyEvent) -> Option<Msg> {
        match k.code {
            KeyCode::Char(c) => Some(Msg::Typed(c)),
            _ => None,
        }
    }
}

impl App for Demo {
    type Msg = Msg;
    fn update(&mut self, m: Msg) -> Cmd<Msg> {
        match m {
            Msg::Inc => self.n += 1,
            Msg::Quit => return Cmd::Quit,
            Msg::Typed(c) => self.typed.push(c),
            Msg::Arm => return Cmd::tick(500, Msg::Later),
            Msg::Later => self.fired += 1,
        }
        Cmd::None
    }
    fn view(&self) -> Node<Msg> {
        if self.bad {
            return col("bg-primry", []);
        }
        let mut kids: Vec<Node<Msg>> = vec![
            text(format!(
                "n={} typed={} fired={}",
                self.n, self.typed, self.fired
            ))
            .into(),
        ];
        if self.field {
            kids.push(Node::leaf("h-1 focus:bg-accent", Field).id("btn"));
        }
        col("", kids)
    }
    fn keys(&self) -> Keymap<Msg> {
        Keymap::new()
            .bind("q", "quit", Msg::Quit)
            .bind("+", "inc", Msg::Inc)
            .bind("ctrl+a", "arm", Msg::Arm)
    }
}

#[test]
fn press_q_quits() {
    let mut t = TestApp::new(Demo::default(), 30, 3);
    assert!(!t.is_quit());
    t.press("+").press("+");
    assert_eq!(t.app().n, 2);
    t.press("q");
    assert!(t.is_quit());
}

fn with_field() -> Demo {
    Demo {
        field: true,
        ..Demo::default()
    }
}

#[test]
fn type_text_reaches_focused_widget() {
    let mut t = TestApp::new(with_field(), 40, 3);
    t.type_text("Hi q");
    assert_eq!(t.app().typed, "Hi q");
    assert_eq!(t.render().unwrap(), "n=0 typed=Hi q fired=0");
    assert!(!t.is_quit());
}

#[test]
fn quit_via_ctrl_c() {
    let mut t = TestApp::new(Demo::default(), 30, 3);
    t.press("ctrl+c");
    assert!(t.is_quit());
}

#[test]
fn cell_reports_focus_bg_role() {
    let mut t = TestApp::new(with_field(), 30, 3);
    assert_eq!(t.focused(), Some("btn"));
    let c = t.cell(0, 1);
    assert_eq!(c.bg_role, Some(Role::Accent), "{c}");
    assert!(c.to_string().contains("bg=accent"), "{c}");
    assert_ne!(t.cell(0, 0).bg_role, Some(Role::Accent));
}

#[test]
fn render_is_deterministic() {
    let first = TestApp::new(Demo::default(), 30, 4).render().unwrap();
    for _ in 0..100 {
        assert_eq!(
            TestApp::new(Demo::default(), 30, 4).render().unwrap(),
            first
        );
    }
}

#[test]
fn trailing_rows_dropped_and_rows_trimmed() {
    let mut t = TestApp::new(Demo::default(), 60, 6);
    assert_eq!(t.render().unwrap(), "n=0 typed= fired=0");
}

#[test]
#[should_panic(expected = "invalid chord \"ctrl+nope\"")]
fn bad_chord_panics() {
    TestApp::new(Demo::default(), 10, 2).press("ctrl+nope");
}

#[test]
#[should_panic(expected = "unknown theme \"nope\"")]
fn bad_theme_panics() {
    let _ = TestApp::new(Demo::default(), 10, 2).theme("nope");
}

#[test]
fn advance_fires_tick_only_after_deadline() {
    let mut t = TestApp::new(Demo::default(), 40, 3);
    t.press("ctrl+a");
    t.advance(499);
    assert_eq!(t.app().fired, 0);
    t.advance(1);
    assert_eq!(t.app().fired, 1);
    assert!(t.render().unwrap().contains("fired=1"));
}

#[test]
fn bad_class_is_err_not_panel() {
    let mut t = TestApp::new(
        Demo {
            bad: true,
            ..Demo::default()
        },
        30,
        3,
    );
    let e = t.render().unwrap_err();
    assert!(matches!(e, TuiError::Class(_)), "{e}");
    assert!(e.to_string().contains("bg-primry"));
}

#[test]
fn resize_and_theme() {
    let mut t = TestApp::new(Demo::default(), 30, 3).theme("dark");
    t.resize(10, 2);
    assert_eq!(t.render().unwrap(), "n=0 typed=\nfired=0");
}

#[test]
fn render_to_string_stateless() {
    let n: Node<()> = col("", [text("a").into(), text("").into(), text("b").into()]);
    assert_eq!(render_to_string(&n, 5, 6).unwrap(), "a\n\nb");
}

#[test]
fn snapshot_matches_and_survives_trailing_newline() {
    // The committed file holds the initial screen.
    TestApp::new(Demo::default(), 40, 3).assert_snapshot("demo_initial");
}

#[test]
#[should_panic(expected = "-n=0 typed= fired=0\n+n=1 typed= fired=0")]
fn snapshot_mismatch_panics_with_diff() {
    TestApp::new(Demo::default(), 40, 3)
        .press("+")
        .assert_snapshot("demo_initial");
}

#[test]
fn snapshot_written_when_missing_then_compared() {
    let name = format!("tmp_missing_{}", std::process::id());
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests/snapshots")
        .join(format!("{name}.txt"));
    let mut t = TestApp::new(Demo::default(), 40, 3);
    t.assert_snapshot(&name);
    assert_eq!(std::fs::read_to_string(&path).unwrap(), t.render().unwrap());
    t.assert_snapshot(&name);
    std::fs::remove_file(path).unwrap();
}

#[test]
#[should_panic(expected = "invalid name")]
fn snapshot_rejects_path_names() {
    TestApp::new(Demo::default(), 10, 2).assert_snapshot("../x");
}

#[test]
fn theme_is_exported_at_the_root() {
    assert!(cascivo_tui::Theme::by_name("dark").is_some());
}
