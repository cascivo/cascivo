use cascivo_tui::prelude::*;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;

fn r(n: &Node, w: u16, h: u16) -> String {
    render_to_string(n, w, h).unwrap()
}

#[test]
fn card_snapshots() {
    let n: Node = card("Hi", "", [text("body").into()]);
    assert_eq!(r(&n, 12, 3), "╭ Hi ──────╮\n│ body     │\n╰──────────╯");
    assert_eq!(r(&n, 8, 3), "╭ Hi ──╮\n│ body │\n╰──────╯");
}

#[test]
fn card_long_title_truncates() {
    let n: Node = card("A very long title", "", []);
    assert_eq!(r(&n, 10, 2), "╭ A ver… ╮\n╰────────╯");
}

#[test]
fn wide_glyphs() {
    let n: Node = card("日本語日本語", "", [text("🙂ab").into()]);
    let s = r(&n, 12, 3);
    assert_eq!(s.lines().next().unwrap(), "╭ 日本語… ─╮");
    assert!(s.contains("│ 🙂ab"));
    let p: Node = progress(0.5, "日本");
    assert!(r(&p, 14, 1).starts_with("日本 50% "));
}

#[test]
fn heading_is_bold_accent() {
    let n: Node = heading("Hello");
    assert_eq!(r(&n, 8, 1), "Hello");
    let mut buf = Buffer::empty(Rect::new(0, 0, 8, 1));
    let t = Theme::default();
    render(&n, Rect::new(0, 0, 8, 1), &mut buf, &t, None).unwrap();
    assert_eq!(buf[(0, 0)].fg, t.color(Role::Accent));
    assert!(
        buf[(0, 0)]
            .modifier
            .contains(ratatui::style::Modifier::BOLD)
    );
}

#[test]
fn statusbar_layout_and_bg() {
    let n: Node = statusbar("ready", "q quit");
    assert_eq!(r(&n, 20, 1), " ready       q quit");
    assert_eq!(r(&n, 12, 1), " re… q quit");
    let mut buf = Buffer::empty(Rect::new(0, 0, 20, 1));
    let t = Theme::default();
    render(&n, Rect::new(0, 0, 20, 1), &mut buf, &t, None).unwrap();
    assert_eq!(buf[(10, 0)].bg, t.color(Role::Surface2));
}

#[test]
fn progress_clamps() {
    let a: Node = progress(1.5, "x");
    assert_eq!(r(&a, 12, 1), "x 100% █████");
    let b: Node = progress(f64::NAN, "x");
    assert_eq!(r(&b, 12, 1), "x 0% ░░░░░░░");
    let c: Node = progress(-3.0, "");
    assert_eq!(r(&c, 8, 1), "0% ░░░░░");
    assert_eq!(r(&c, 2, 1), "0%");
}

#[test]
fn sparkline_cases() {
    let e: Node = sparkline(&[]);
    assert_eq!(r(&e, 6, 1), "");
    let z: Node = sparkline(&[0, 0]);
    assert_eq!(r(&z, 6, 1), "▁▁");
    let s: Node = sparkline(&[0, 4, 8, u64::MAX]);
    assert_eq!(r(&s, 4, 1), "▁▁▁█");
    assert_eq!(r(&s, 2, 1), "▁█");
}
