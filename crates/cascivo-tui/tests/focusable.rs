use cascivo_tui::prelude::*;
use ratatui::style::Modifier;

#[derive(Clone, Debug, PartialEq)]
enum Msg {
    Press,
    Text(String),
    Submit,
    Sel(usize),
    Act(usize),
    Tab(usize),
}

/// Which widget the test app shows; each test builds one.
#[derive(Clone, Copy)]
enum Kind {
    Button,
    Input,
    List,
    Table,
    Tabs,
}

struct Demo {
    kind: Kind,
    presses: u32,
    submits: u32,
    value: String,
    cursor: Cursor,
    scroll: Scroll,
    sel: usize,
    acted: Option<usize>,
    tab: usize,
    items: usize,
}

impl Demo {
    fn new(kind: Kind) -> Self {
        Self {
            kind,
            presses: 0,
            submits: 0,
            value: String::new(),
            cursor: Cursor::default(),
            scroll: Scroll::default(),
            sel: 0,
            acted: None,
            tab: 0,
            items: 10,
        }
    }
}

impl App for Demo {
    type Msg = Msg;
    fn update(&mut self, m: Msg) -> Cmd<Msg> {
        match m {
            Msg::Press => self.presses += 1,
            Msg::Text(s) => self.value = s,
            Msg::Submit => self.submits += 1,
            Msg::Sel(i) => self.sel = i,
            Msg::Act(i) => self.acted = Some(i),
            Msg::Tab(i) => self.tab = i,
        }
        Cmd::None
    }
    fn view(&self) -> Node<Msg> {
        let items: Vec<String> = (0..self.items).map(|i| format!("item{i}")).collect();
        let w: Node<Msg> = match self.kind {
            Kind::Button => button("Go", Msg::Press).id("w"),
            Kind::Input => input(&self.value, "type", Msg::Text)
                .cursor(&self.cursor)
                .on_submit(Msg::Submit)
                .id("w"),
            Kind::List => list(items, self.sel, Msg::Sel)
                .on_activate(Msg::Act)
                .scroll(&self.scroll)
                .class("grow")
                .id("w"),
            Kind::Table => table(
                &["Name", "Qty"],
                items.into_iter().map(|s| vec![s, "1".into()]).collect(),
                &[Col::Grow(1), Col::Fixed(4)],
                self.sel,
                Msg::Sel,
            )
            .on_activate(Msg::Act)
            .scroll(&self.scroll)
            .class("grow")
            .id("w"),
            Kind::Tabs => tabs(&["One", "Two", "Three"], self.tab, Msg::Tab).id("w"),
        };
        col("", [w])
    }
}

fn app(kind: Kind, cols: u16, rows: u16) -> TestApp<Demo> {
    TestApp::new(Demo::new(kind), cols, rows)
}

#[test]
fn button_focus_changes_style() {
    let mut t = app(Kind::Button, 10, 2);
    assert_eq!(t.focused(), Some("w"));
    let on = t.cell(1, 0);
    assert_eq!(on.bg_role, Some(Role::Accent), "{on}");
    assert!(on.modifiers.contains(Modifier::BOLD), "{on}");
    // Unfocused: a second focusable moves focus away.
    let two: Node<Msg> = col(
        "",
        [
            button("A", Msg::Press).id("a"),
            button("B", Msg::Press).id("b"),
        ],
    );
    let (mut buf, th) = (
        ratatui::buffer::Buffer::empty(ratatui::layout::Rect::new(0, 0, 6, 2)),
        Theme::default(),
    );
    render(&two, buf.area, &mut buf, &th, Some("b")).unwrap();
    assert_ne!(buf[(1, 0)].bg, th.color(Role::Accent));
    assert_eq!(buf[(1, 1)].bg, th.color(Role::Accent));
}

#[test]
fn button_fires_on_enter_and_space_only() {
    let mut t = app(Kind::Button, 10, 2);
    t.press("enter").press("space");
    assert_eq!(t.app().presses, 2);
    t.press("x").press("tab").press("j");
    assert_eq!(t.app().presses, 2);
}

#[test]
fn button_ignores_keys_when_not_focused() {
    let a: Node<Msg> = button("A", Msg::Press);
    let enter = ratatui::crossterm::event::KeyEvent::new(
        ratatui::crossterm::event::KeyCode::Enter,
        ratatui::crossterm::event::KeyModifiers::NONE,
    );
    // Not in the focus ring without an id, so the runtime never routes keys to it.
    assert!(!a.is_focusable());
    assert_eq!(a.on_key(&enter), Some(Msg::Press));
    struct Two(bool);
    impl App for Two {
        type Msg = Msg;
        fn update(&mut self, m: Msg) -> Cmd<Msg> {
            self.0 |= m == Msg::Press;
            Cmd::None
        }
        fn view(&self) -> Node<Msg> {
            col("", [text("x").into(), button("A", Msg::Press)])
        }
    }
    let mut t = TestApp::new(Two(false), 10, 3);
    t.press("enter").press("space");
    assert!(!t.app().0);
}

#[test]
fn input_types_and_edits() {
    let mut t = app(Kind::Input, 20, 2);
    assert_eq!(t.render().unwrap(), "type");
    t.type_text("abc");
    assert_eq!(t.app().value, "abc");
    assert_eq!(t.render().unwrap(), "abc");
    t.press("backspace");
    assert_eq!(t.app().value, "ab");
    t.press("left").press("left").type_text("X");
    assert_eq!(t.app().value, "Xab");
    t.press("end").type_text("Z");
    assert_eq!(t.app().value, "XabZ");
    t.press("home").press("delete");
    assert_eq!(t.app().value, "abZ");
    t.press("delete")
        .press("delete")
        .press("delete")
        .press("delete");
    assert_eq!(t.app().value, "");
    t.press("backspace");
    assert_eq!(t.app().value, "");
}

#[test]
fn input_unicode_boundaries() {
    let mut t = app(Kind::Input, 20, 2);
    t.type_text("a日🙂é");
    assert_eq!(t.app().value, "a日🙂é");
    t.press("left").press("backspace");
    assert_eq!(t.app().value, "a日é");
    t.press("home").press("right").press("delete");
    assert_eq!(t.app().value, "aé");
    t.press("end").press("left").type_text("ü");
    assert_eq!(t.app().value, "aüé");
    assert_eq!(t.render().unwrap(), "aüé");
}

#[test]
fn input_cursor_cell_is_reversed_when_focused() {
    let mut t = app(Kind::Input, 20, 2);
    t.type_text("ab").press("left");
    assert!(t.cell(1, 0).modifiers.contains(Modifier::REVERSED)); // cursor at index 1
    assert!(!t.cell(0, 0).modifiers.contains(Modifier::REVERSED));
}

#[test]
fn input_ignores_paste_like_and_modified_keys_and_submits() {
    let mut t = app(Kind::Input, 20, 2);
    t.press("ctrl+x").press("alt+y");
    assert_eq!(t.app().value, "");
    t.type_text("hi").press("enter");
    assert_eq!(t.app().submits, 1);
    assert_eq!(t.app().value, "hi");
}

#[test]
fn input_scrolls_to_cursor_when_narrow() {
    let mut t = app(Kind::Input, 8, 1);
    t.type_text("abcdefghij");
    let s = t.render().unwrap();
    assert!(s.ends_with('j'), "{s:?}");
    assert!(!s.contains('a'), "{s:?}");
}

#[test]
fn list_clamps_and_scrolls() {
    let mut t = app(Kind::List, 12, 4);
    assert_eq!(t.render().unwrap(), "› item0\n  item1\n  item2\n  item3");
    t.press("k");
    assert_eq!(t.app().sel, 0);
    for _ in 0..5 {
        t.press("j");
    }
    assert_eq!(t.app().sel, 5);
    assert_eq!(t.render().unwrap(), "  item2\n  item3\n  item4\n› item5");
    // The kept Scroll window stays put while the selection moves inside it.
    t.press("up").press("up");
    assert_eq!(t.app().sel, 3);
    assert_eq!(t.render().unwrap(), "  item2\n› item3\n  item4\n  item5");
    for _ in 0..20 {
        t.press("down");
    }
    assert_eq!(t.app().sel, 9, "clamps, does not wrap");
    assert_eq!(t.render().unwrap(), "  item6\n  item7\n  item8\n› item9");
    t.press("enter");
    assert_eq!(t.app().acted, Some(9));
}

#[test]
fn list_selected_row_has_non_colour_cue() {
    let mut t = app(Kind::List, 12, 3);
    let c = t.cell(0, 0);
    assert!(
        c.modifiers.contains(Modifier::REVERSED | Modifier::BOLD),
        "{c}"
    );
    assert!(!t.cell(0, 1).modifiers.contains(Modifier::BOLD));
}

#[test]
fn table_header_sticky_and_selection() {
    let mut t = app(Kind::Table, 14, 4);
    assert_eq!(
        t.render().unwrap(),
        "Name      Qty\nitem0     1\nitem1     1\nitem2     1"
    );
    for _ in 0..6 {
        t.press("j");
    }
    assert_eq!(t.app().sel, 6);
    let s = t.render().unwrap();
    assert_eq!(s.lines().next(), Some("Name      Qty"), "{s}");
    assert_eq!(s.lines().last(), Some("item6     1"), "{s}");
    assert!(t.cell(0, 3).modifiers.contains(Modifier::BOLD));
    t.press("k").press("up");
    assert_eq!(t.app().sel, 4);
    t.press("enter");
    assert_eq!(t.app().acted, Some(4));
    for _ in 0..20 {
        t.press("down");
    }
    assert_eq!(t.app().sel, 9);
}

#[test]
fn table_grow_distribution() {
    use cascivo_tui::widgets::Col;
    let n: Node = table(
        &["A", "B", "C"],
        vec![vec!["1".into(), "2".into(), "3".into()]],
        &[Col::Grow(1), Col::Fixed(3), Col::Grow(2)],
        0,
        |_| (),
    )
    .into();
    // 20 - 2 gaps - 3 fixed = 15 -> 5 / 10.
    assert_eq!(
        render_to_string(&n, 20, 2).unwrap(),
        "A     B   C\n1     2   3"
    );
}

#[test]
fn tabs_clamp_and_digits() {
    let mut t = app(Kind::Tabs, 30, 2);
    assert_eq!(t.render().unwrap(), " One   Two   Three");
    t.press("left");
    assert_eq!(t.app().tab, 0);
    t.press("right")
        .press("right")
        .press("right")
        .press("right");
    assert_eq!(t.app().tab, 2);
    t.press("1");
    assert_eq!(t.app().tab, 0);
    t.press("3");
    assert_eq!(t.app().tab, 2);
    t.press("9").press("0").press("4");
    assert_eq!(t.app().tab, 2, "out-of-range digits do nothing");
    let c = t.cell(15, 0);
    assert!(
        c.modifiers
            .contains(Modifier::UNDERLINED | Modifier::REVERSED),
        "{c}"
    );
}
