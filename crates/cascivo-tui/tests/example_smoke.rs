//! Drives the dashboard example headless.

#[path = "../examples/support/mod.rs"]
mod support;

use cascivo_tui::prelude::*;
use support::Dashboard;

fn app(cols: u16, rows: u16) -> TestApp<Dashboard> {
    TestApp::new(Dashboard::default(), cols, rows)
}

#[test]
fn first_frame_80x24() {
    let mut t = app(80, 24);
    let s = t.render().unwrap();
    assert_first_frame(&s);
}

// Structural snapshot: exact rows that matter, without pinning the sparkline glyphs.
fn assert_first_frame(s: &str) {
    let lines: Vec<&str> = s.lines().collect();
    assert!(
        lines[0].contains("Overview") && lines[0].contains("Table") && lines[0].contains("Log")
    );
    assert!(s.contains("╭ Load"), "{s}");
    assert!(s.contains("cpu "), "{s}");
    assert!(s.contains("6 services, 1 degraded"), "{s}");
    let last2: Vec<&str> = lines.iter().rev().take(2).copied().collect();
    assert!(
        last2[1].contains("theme: terminal") && last2[1].contains("tab 1/3"),
        "{s}"
    );
    assert_eq!(last2[0], "r restart · t theme · q quit · tab focus");
}

#[test]
fn switch_tab_and_select() {
    let mut t = app(80, 24);
    t.press("2");
    assert_eq!(t.app().tab, 1);
    let s = t.render().unwrap();
    assert!(s.contains("Service") && s.contains("worker"), "{s}");
    // Tabs hold focus; move to the table, select row 3, activate for a toast.
    t.press("tab").press("j").press("j");
    assert_eq!(t.app().row, 2);
    t.press("enter");
    assert!(t.render().unwrap().contains("selected worker"));
    t.advance(2000);
    assert!(!t.render().unwrap().contains("selected worker"));
    t.press("shift+tab").press("3");
    assert!(t.render().unwrap().contains("000 load sample"));
}

#[test]
fn modal_open_confirm_and_cancel() {
    let mut t = app(80, 24);
    t.press("r");
    assert!(t.app().confirming);
    assert!(t.render().unwrap().contains("Restart api?"));
    assert_eq!(t.focused(), Some("yes"));
    t.press("esc");
    assert!(!t.app().confirming);
    t.press("r").press("enter");
    assert!(!t.app().confirming);
    assert!(t.render().unwrap().contains("restarted api"));
}

#[test]
fn theme_cycle_changes_colors() {
    let mut t = app(80, 24);
    let before = t.cell(0, 23);
    t.press("t");
    let after = t.cell(0, 23);
    assert!(t.render().unwrap().contains("theme: warm"));
    assert!(
        before.fg != after.fg || before.bg != after.bg,
        "{before:?} {after:?}"
    );
    for _ in 0..Theme::names().len() - 1 {
        t.press("t");
    }
    assert!(t.render().unwrap().contains("theme: terminal"));
}

#[test]
fn quit_via_q() {
    let mut t = app(80, 24);
    assert!(!t.is_quit());
    t.press("q");
    assert!(t.is_quit());
}

#[test]
fn small_terminal_does_not_panic() {
    let mut t = app(40, 12);
    t.render().unwrap();
    for k in ["2", "tab", "j", "enter", "3", "r", "esc", "t"] {
        t.press(k);
        t.render().unwrap();
    }
    t.advance(1000);
    t.render().unwrap();
}
