//! Headless: send synthetic events through the document, read the DOM back. No window, no GPU.

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use cascivo_blitz::{
    App, Behaviors, Event, InteractiveDocument, Key, NamedKey, Options, Signal, computed,
};

fn cv(src: &str) -> InteractiveDocument {
    App::from_cv(src, Options::default()).build().unwrap()
}

fn html(body: &str) -> InteractiveDocument {
    App::from_html(
        &format!("<html><head></head><body>{body}</body></html>"),
        Options::default(),
    )
    .build()
    .unwrap()
}

fn attr(doc: &mut InteractiveDocument, sel: &str, name: &str) -> Option<String> {
    let dom = doc.dom();
    dom.query(sel).and_then(|n| dom.attr(n, name))
}

fn has(doc: &mut InteractiveDocument, sel: &str) -> bool {
    doc.dom().query(sel).is_some()
}

fn texts(doc: &mut InteractiveDocument, sel: &str) -> Vec<String> {
    let dom = doc.dom();
    dom.query_all(sel)
        .into_iter()
        .map(|n| dom.text(n).trim().to_owned())
        .collect()
}

fn display(doc: &mut InteractiveDocument, sel: &str) -> String {
    doc.resolve(0.0);
    let n = doc.query_selector(sel).unwrap().unwrap();
    doc.resolved_style_value(n, "display")
}

fn named(k: NamedKey) -> Key {
    Key::Named(k)
}

// --- handlers and signals ---

#[test]
fn click_handler_updates_signal_binding() {
    let count = Signal::new(0);
    let (c1, c2) = (count.clone(), count.clone());
    let double = computed(move || c2.get() * 2);
    let mut doc = App::from_cv("text \"x\"\ntext \"y\"\nbutton \"+\"\n", Options::default())
        .on("button", Event::Click, move |_| c1.update(|n| *n += 1))
        .bind_text("p:nth-of-type(1)", move || count.get().to_string())
        .bind_text("p:nth-of-type(2)", move || double.get().to_string())
        .build()
        .unwrap();
    assert_eq!(texts(&mut doc, "p:nth-of-type(1)"), ["0"]);
    doc.click("button");
    doc.click("button");
    assert_eq!(texts(&mut doc, "p:nth-of-type(1)"), ["2"]);
    assert_eq!(texts(&mut doc, "p:nth-of-type(2)"), ["4"]);
}

#[test]
fn bind_class_and_attr_follow_signal() {
    let on = Signal::new(false);
    let (o1, o2, o3) = (on.clone(), on.clone(), on.clone());
    let mut doc = App::from_html(
        "<html><head></head><body><button id=t>t</button><p id=p>p</p></body></html>",
        Options::default(),
    )
    .on("#t", Event::Click, move |_| o1.update(|v| *v = !*v))
    .bind_class("#p", "lit", move || o2.get())
    .bind_attr("#p", "data-on", move || o3.get().then(|| "yes".to_owned()))
    .build()
    .unwrap();
    assert!(!has(&mut doc, "#p.lit"));
    doc.click("#t");
    assert!(has(&mut doc, "#p.lit"));
    assert_eq!(attr(&mut doc, "#p", "data-on").as_deref(), Some("yes"));
    doc.click("#t");
    assert!(!has(&mut doc, "#p.lit"));
    assert_eq!(attr(&mut doc, "#p", "data-on"), None);
}

#[test]
fn ctx_mutates_dom_and_selectors_match_data_attrs() {
    let mut doc = App::from_html(
        "<html><head></head><body><button id=a>a</button><p id=t>t</p></body></html>",
        Options::default(),
    )
    .on("#a", Event::Click, |ctx| {
        ctx.set_text("#t", "done");
        ctx.set_attr("#t", "data-state", "ok");
        let on = ctx.toggle_class("#t", "hot");
        assert!(on);
    })
    .build()
    .unwrap();
    let a = doc.dom().query("#a").unwrap();
    doc.dom().set_attr(a, "data-action", "go");
    doc.click("[data-action=go]");
    assert_eq!(texts(&mut doc, "#t"), ["done"]);
    assert_eq!(attr(&mut doc, "#t", "data-state").as_deref(), Some("ok"));
    assert!(has(&mut doc, "#t.hot"));
}

#[test]
fn events_bubble_and_stop_propagation() {
    let log = Rc::new(RefCell::new(Vec::new()));
    let (l1, l2) = (log.clone(), log.clone());
    let mut doc = App::from_html(
        "<html><head></head><body><div id=outer><button id=inner>x</button></div></body></html>",
        Options::default(),
    )
    .on("#inner", Event::Click, move |ctx| {
        l1.borrow_mut().push("inner");
        ctx.stop_propagation();
    })
    .on("#outer", Event::Click, move |_| {
        l2.borrow_mut().push("outer")
    })
    .build()
    .unwrap();
    doc.click("#inner");
    assert_eq!(*log.borrow(), ["inner"]);
}

#[test]
fn input_and_key_events_reach_handlers() {
    let got = Rc::new(RefCell::new(String::new()));
    let keys = Rc::new(Cell::new(0));
    let (g, k) = (got.clone(), keys.clone());
    let mut doc = App::from_html(
        "<html><head></head><body><input id=name><button id=b>b</button></body></html>",
        Options::default(),
    )
    .on("#name", Event::Input, move |ctx| {
        *g.borrow_mut() = ctx.input_value().unwrap().to_owned()
    })
    .on("#b", Event::KeyDown, move |ctx| {
        assert_eq!(ctx.key(), Some(&Key::Character("x".into())));
        k.set(k.get() + 1);
    })
    .build()
    .unwrap();
    doc.input("#name", "hello");
    assert_eq!(*got.borrow(), "hello");
    doc.focus("#b");
    doc.press(Key::Character("x".into()));
    assert_eq!(keys.get(), 1);
}

#[test]
fn prevent_default_blocks_enter_activation() {
    let clicks = Rc::new(Cell::new(0));
    let c = clicks.clone();
    let mut doc = App::from_html(
        "<html><head></head><body><button id=b>b</button></body></html>",
        Options::default(),
    )
    .on("#b", Event::KeyDown, |ctx| ctx.prevent_default())
    .on("#b", Event::Click, move |_| c.set(c.get() + 1))
    .build()
    .unwrap();
    doc.focus("#b");
    doc.press(named(NamedKey::Enter));
    assert_eq!(clicks.get(), 0);
}

#[test]
fn enter_and_space_activate_focused_button() {
    let clicks = Rc::new(Cell::new(0));
    let c = clicks.clone();
    let mut doc = App::from_html(
        "<html><head></head><body><button id=b>b</button></body></html>",
        Options::default(),
    )
    .on("#b", Event::Click, move |_| c.set(c.get() + 1))
    .build()
    .unwrap();
    doc.focus("#b");
    doc.press(named(NamedKey::Enter));
    doc.press(Key::Character(" ".into()));
    assert_eq!(clicks.get(), 2);
}

// --- table sort ---

const TABLE: &str = "table sort Name,Qty | Pear,12 | Apple,3 | Fig,30\n";

#[test]
fn table_sort_orders_rows_and_sets_aria() {
    let mut doc = cv(TABLE);
    assert!(doc.warnings().is_empty(), "{:?}", doc.warnings());
    let col0 = "tbody tr td:first-child";
    let col1 = "tbody tr td:last-child";
    doc.click("th:first-child button");
    assert_eq!(texts(&mut doc, col0), ["Apple", "Fig", "Pear"]);
    assert_eq!(
        attr(&mut doc, "th:first-child", "aria-sort").as_deref(),
        Some("ascending")
    );
    assert_eq!(
        attr(&mut doc, "th:first-child button", "data-state").as_deref(),
        Some("ascending")
    );
    doc.click("th:first-child button");
    assert_eq!(texts(&mut doc, col0), ["Pear", "Fig", "Apple"]);
    assert_eq!(
        attr(&mut doc, "th:first-child", "aria-sort").as_deref(),
        Some("descending")
    );

    // Numeric column: 3 < 12 < 30, not "12" < "3" < "30".
    doc.click("th:last-child button");
    assert_eq!(texts(&mut doc, col1), ["3", "12", "30"]);
    assert_eq!(
        attr(&mut doc, "th:first-child", "aria-sort").as_deref(),
        Some("none")
    );
    assert_eq!(
        attr(&mut doc, "th:last-child", "aria-sort").as_deref(),
        Some("ascending")
    );

    let parity: Vec<_> = doc
        .dom()
        .query_all("tbody tr")
        .into_iter()
        .map(|r| doc.dom().attr(r, "data-parity").unwrap())
        .collect();
    assert_eq!(parity, ["even", "odd", "even"]);
}

#[test]
fn table_sort_by_pointer_and_keyboard() {
    let mut doc = cv(TABLE);
    assert!(doc.pointer_click("th:first-child button"));
    assert_eq!(
        texts(&mut doc, "tbody tr td:first-child"),
        ["Apple", "Fig", "Pear"]
    );
    doc.focus("th:last-child button");
    doc.press(named(NamedKey::Enter));
    assert_eq!(texts(&mut doc, "tbody tr td:last-child"), ["3", "12", "30"]);
    doc.press(Key::Character(" ".into()));
    assert_eq!(texts(&mut doc, "tbody tr td:last-child"), ["30", "12", "3"]);
}

#[test]
fn table_sort_can_be_turned_off() {
    let mut doc = App::from_cv(TABLE, Options::default())
        .behaviors(Behaviors {
            table_sort: false,
            ..Behaviors::all()
        })
        .build()
        .unwrap();
    doc.click("th:first-child button");
    assert_eq!(
        texts(&mut doc, "tbody tr td:first-child"),
        ["Pear", "Apple", "Fig"]
    );
}

// --- tabs ---

const TABS: &str = "tabs\n  section \"One\"\n    text \"a\"\n  section \"Two\"\n    text \"b\"\n  section \"Three\"\n    text \"c\"\n";

fn selected(doc: &mut InteractiveDocument) -> Option<String> {
    attr(doc, "[role=tab][aria-selected=true]", "data-value")
}

#[test]
fn cv_tabs_switch_on_click_and_arrow_keys() {
    let mut doc = cv(TABS);
    assert_eq!(selected(&mut doc).as_deref(), Some("one"));
    assert_eq!(display(&mut doc, "#cv-1-content-two"), "none");

    doc.click("#cv-1-trigger-two");
    assert_eq!(selected(&mut doc).as_deref(), Some("two"));
    assert_eq!(display(&mut doc, "#cv-1-content-two"), "block");
    assert_eq!(display(&mut doc, "#cv-1-content-one"), "none");

    doc.focus("#cv-1-trigger-two");
    doc.press(named(NamedKey::ArrowRight));
    assert_eq!(selected(&mut doc).as_deref(), Some("three"));
    doc.press(named(NamedKey::ArrowRight));
    assert_eq!(selected(&mut doc).as_deref(), Some("one"), "wraps");
    doc.press(named(NamedKey::End));
    assert_eq!(selected(&mut doc).as_deref(), Some("three"));
    doc.press(named(NamedKey::ArrowLeft));
    assert_eq!(selected(&mut doc).as_deref(), Some("two"));
}

const ARIA_TABS: &str = r#"<div role=tablist>
<button role=tab id=t1 aria-controls=p1 aria-selected=true>One</button>
<button role=tab id=t2 aria-controls=p2>Two</button>
<button role=tab id=t3 aria-controls=p3 disabled>Three</button></div>
<div role=tabpanel id=p1>a</div><div role=tabpanel id=p2>b</div><div role=tabpanel id=p3>c</div>"#;

#[test]
fn aria_tabs_toggle_selected_hidden_and_tabindex() {
    let mut doc = html(ARIA_TABS);
    assert_eq!(
        attr(&mut doc, "#t1", "aria-selected").as_deref(),
        Some("true")
    );
    assert!(attr(&mut doc, "#p2", "hidden").is_some());
    assert!(attr(&mut doc, "#p1", "hidden").is_none());
    assert_eq!(display(&mut doc, "#p2"), "none");

    doc.click("#t2");
    assert_eq!(
        attr(&mut doc, "#t1", "aria-selected").as_deref(),
        Some("false")
    );
    assert_eq!(
        attr(&mut doc, "#t2", "aria-selected").as_deref(),
        Some("true")
    );
    assert_eq!(attr(&mut doc, "#t2", "tabindex").as_deref(), Some("0"));
    assert_eq!(attr(&mut doc, "#t1", "tabindex").as_deref(), Some("-1"));
    assert!(attr(&mut doc, "#p2", "hidden").is_none());
    assert!(attr(&mut doc, "#p1", "hidden").is_some());

    doc.focus("#t2");
    doc.press(named(NamedKey::ArrowRight));
    assert_eq!(
        attr(&mut doc, "#t1", "aria-selected").as_deref(),
        Some("true"),
        "skips disabled, wraps"
    );
    doc.press(named(NamedKey::ArrowLeft));
    assert_eq!(
        attr(&mut doc, "#t2", "aria-selected").as_deref(),
        Some("true")
    );
    assert_eq!(doc.dom().focused(), doc.dom().query("#t2"));
}

// --- details ---

const ACCORDION: &str =
    "accordion\n  section \"A\"\n    text \"a\"\n  section \"B\"\n    text \"b\"\n";

#[test]
fn details_toggle_and_sync_state() {
    let mut doc = cv(ACCORDION);
    assert_eq!(
        attr(&mut doc, "details:first-child", "data-state").as_deref(),
        Some("closed")
    );
    doc.click("details:first-child summary");
    assert!(attr(&mut doc, "details:first-child", "open").is_some());
    assert_eq!(
        attr(&mut doc, "details:first-child", "data-state").as_deref(),
        Some("open")
    );
    assert_eq!(
        attr(&mut doc, "details:first-child summary", "aria-expanded").as_deref(),
        Some("true")
    );
    doc.click("details:first-child summary");
    assert!(attr(&mut doc, "details:first-child", "open").is_none());
    assert_eq!(
        attr(&mut doc, "details:first-child summary", "aria-expanded").as_deref(),
        Some("false")
    );
}

#[test]
fn named_details_close_each_other_and_keyboard_works() {
    let mut doc = html(
        "<details name=g id=a><summary id=sa>A</summary>x</details>\
         <details name=g id=b><summary id=sb>B</summary>y</details>",
    );
    doc.click("#sa");
    assert!(has(&mut doc, "#a[open]"));
    doc.focus("#sb");
    doc.press(named(NamedKey::Enter));
    assert!(has(&mut doc, "#b[open]"));
    assert!(!has(&mut doc, "#a[open]"));
    assert_eq!(
        attr(&mut doc, "#a", "data-state").as_deref(),
        Some("closed")
    );
}

// --- dialog ---

const DIALOG: &str = "<button id=open data-dialog-open=dlg>Open</button>\
    <dialog id=dlg><p>Hi</p><button id=first>One</button><button id=last data-dialog-close>Close</button></dialog>";

#[test]
fn dialog_opens_closes_and_restores_focus() {
    let mut doc = html(DIALOG);
    assert_eq!(display(&mut doc, "#dlg"), "none");
    doc.focus("#open");
    doc.click("#open");
    assert!(has(&mut doc, "dialog[open]"));
    assert_eq!(display(&mut doc, "#dlg"), "block");
    assert_eq!(
        doc.dom().focused(),
        doc.dom().query("#first"),
        "focus moves inside"
    );

    doc.click("#last");
    assert!(!has(&mut doc, "dialog[open]"));
    assert_eq!(display(&mut doc, "#dlg"), "none");
    assert_eq!(
        doc.dom().focused(),
        doc.dom().query("#open"),
        "focus returns to the opener"
    );
}

#[test]
fn dialog_escape_closes_and_tab_stays_inside() {
    let mut doc = html(DIALOG);
    doc.click("#open");
    doc.press(named(NamedKey::Tab));
    assert_eq!(doc.dom().focused(), doc.dom().query("#last"));
    doc.press(named(NamedKey::Tab));
    assert_eq!(
        doc.dom().focused(),
        doc.dom().query("#first"),
        "wraps inside the dialog"
    );
    doc.press(named(NamedKey::Escape));
    assert!(!has(&mut doc, "dialog[open]"));
}

#[test]
fn dialog_from_handler() {
    let mut doc = App::from_html(
        "<html><head></head><body><button id=b>x</button><dialog id=d>hi</dialog></body></html>",
        Options::default(),
    )
    .on("#b", Event::Click, |ctx| ctx.open_dialog("#d"))
    .build()
    .unwrap();
    doc.click("#b");
    assert!(has(&mut doc, "#d[open]"));
}

// --- select ---

const SELECT: &str = "<select id=s><option value=a>Alpha</option><option value=b>Beta</option>\
    <option value=c disabled>Gamma</option><option value=d>Delta</option></select>";

fn trigger_text(doc: &mut InteractiveDocument) -> String {
    texts(doc, ".cv-select-trigger").remove(0)
}

#[test]
fn select_is_replaced_by_a_listbox() {
    let mut doc = html(SELECT);
    assert_eq!(display(&mut doc, "#s"), "none");
    assert_eq!(trigger_text(&mut doc), "Alpha");
    assert_eq!(display(&mut doc, ".cv-select-list"), "none");
    assert_eq!(
        texts(&mut doc, ".cv-select-option"),
        ["Alpha", "Beta", "Gamma", "Delta"]
    );
    assert_eq!(
        attr(&mut doc, ".cv-select-trigger", "role").as_deref(),
        Some("combobox")
    );
}

#[test]
fn select_click_opens_and_chooses() {
    let value = Rc::new(RefCell::new(None));
    let v = value.clone();
    let mut doc = App::from_html(
        &format!("<html><head></head><body>{SELECT}<p id=out>x</p></body></html>"),
        Options::default(),
    )
    .on(".cv-select-option", Event::Click, move |ctx| {
        *v.borrow_mut() = ctx.select_value("#s")
    })
    .build()
    .unwrap();
    doc.click(".cv-select-trigger");
    assert!(has(&mut doc, ".cv-select[data-open]"));
    assert_eq!(
        attr(&mut doc, ".cv-select-trigger", "aria-expanded").as_deref(),
        Some("true")
    );
    assert_eq!(display(&mut doc, ".cv-select-list"), "block");

    doc.click(".cv-select-option:nth-child(2)");
    assert_eq!(trigger_text(&mut doc), "Beta");
    assert!(!has(&mut doc, ".cv-select[data-open]"));
    assert!(has(&mut doc, "#s option[value=b][selected]"));
    assert!(!has(&mut doc, "#s option[value=a][selected]"));
    assert_eq!(
        attr(&mut doc, ".cv-select-option:nth-child(2)", "aria-selected").as_deref(),
        Some("true")
    );
    assert_eq!(value.borrow().as_deref(), Some("b"));

    // Disabled options do nothing.
    doc.click(".cv-select-trigger");
    doc.click(".cv-select-option:nth-child(3)");
    assert_eq!(trigger_text(&mut doc), "Beta");
}

#[test]
fn select_outside_click_closes() {
    let mut doc = html(&format!("{SELECT}<p id=out>x</p>"));
    doc.click(".cv-select-trigger");
    assert!(has(&mut doc, ".cv-select[data-open]"));
    doc.click("#out");
    assert!(!has(&mut doc, ".cv-select[data-open]"));
}

#[test]
fn select_keyboard() {
    let mut doc = html(SELECT);
    doc.focus(".cv-select-trigger");
    // Closed: arrows change the value and skip disabled options.
    doc.press(named(NamedKey::ArrowDown));
    assert_eq!(trigger_text(&mut doc), "Beta");
    doc.press(named(NamedKey::ArrowDown));
    assert_eq!(trigger_text(&mut doc), "Delta");
    doc.press(named(NamedKey::Home));
    assert_eq!(trigger_text(&mut doc), "Alpha");

    // Enter opens, arrows move the highlight, Enter picks.
    doc.press(named(NamedKey::Enter));
    assert!(has(&mut doc, ".cv-select[data-open]"));
    doc.press(named(NamedKey::ArrowDown));
    assert_eq!(trigger_text(&mut doc), "Alpha", "highlight only");
    assert!(has(&mut doc, ".cv-select-option:nth-child(2)[data-active]"));
    doc.press(named(NamedKey::Enter));
    assert_eq!(trigger_text(&mut doc), "Beta");
    assert!(!has(&mut doc, ".cv-select[data-open]"));

    // Space opens, Escape closes without a change.
    doc.press(Key::Character(" ".into()));
    assert!(has(&mut doc, ".cv-select[data-open]"));
    doc.press(named(NamedKey::ArrowDown));
    doc.press(named(NamedKey::Escape));
    assert!(!has(&mut doc, ".cv-select[data-open]"));
    assert_eq!(trigger_text(&mut doc), "Beta");
}

// --- lint ---

#[test]
fn lint_warnings_are_surfaced_and_filtered() {
    let doc = cv("spinner\ncard \"x\"\n");
    let msgs: Vec<_> = doc.warnings().iter().map(|w| w.msg.clone()).collect();
    assert!(msgs.iter().any(|m| m.contains("spinner")), "{msgs:?}");
    assert!(!msgs.iter().any(|m| m.contains("has-selector")), "{msgs:?}");
    let off = Options {
        lint: false,
        ..Options::default()
    };
    assert!(
        App::from_cv("spinner\n", off)
            .build()
            .unwrap()
            .warnings()
            .is_empty()
    );
}
