//! `Cmd` effects driven through `TestApp`: focus, tasks, theme cycling.

use cascivo_tui::prelude::*;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;

#[derive(Clone, Debug)]
enum Msg {
    Open,
    Load,
    Loaded(u32),
}

#[derive(Default)]
struct Form {
    open: bool,
    loaded: Vec<u32>,
}

struct Field;
impl Widget<Msg> for Field {
    fn render(&self, _: Rect, _: &mut Buffer, _: &RenderCx<'_>) {}
    fn focusable(&self) -> bool {
        true
    }
}

impl App for Form {
    type Msg = Msg;
    fn update(&mut self, m: Msg) -> Cmd<Msg> {
        match m {
            Msg::Open => {
                self.open = true;
                Cmd::focus("name")
            }
            Msg::Load => Cmd::task(|| Msg::Loaded(42)),
            Msg::Loaded(n) => {
                self.loaded.push(n);
                if n == 42 {
                    // A task result may start another task; TestApp runs it too.
                    return Cmd::batch([Cmd::task(|| Msg::Loaded(1)), Cmd::focus("name")]);
                }
                Cmd::None
            }
        }
    }
    fn view(&self) -> Node<Msg> {
        let mut kids = vec![Node::leaf("h-1", Field).id("first")];
        if self.open {
            kids.push(Node::leaf("h-1", Field).id("name"));
        }
        col("", kids)
    }
    fn keys(&self) -> Keymap<Msg> {
        Keymap::new()
            .bind("o", "open", Msg::Open)
            .bind("l", "load", Msg::Load)
    }
}

#[test]
fn focus_cmd_reaches_id_added_by_update() {
    let mut t = TestApp::new(Form::default(), 20, 3);
    assert_eq!(t.focused(), Some("first"));
    t.press("o");
    assert_eq!(t.focused(), Some("name"));
}

#[test]
fn task_result_reaches_update_inline() {
    let mut t = TestApp::new(Form::default(), 20, 3);
    t.press("l");
    assert_eq!(t.app().loaded, vec![42, 1]);
}
