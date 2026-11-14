---
name: cascivo-tui
description: Build a terminal UI (dashboard, form, list/table browser) in Rust with the `cascivo-tui` crate, a ratatui toolkit that styles nodes with cascivo class strings and the twelve cascivo themes. Use when the user wants a TUI or terminal app in Rust that matches cascivo's look, and verify it headless with TestApp.
---

# cascivo-tui

State, a pure `view`, `update` for messages. Style with class strings, check with `TestApp`.

## Steps

1. Read the guide `docs/USING-CASCIVO-TUI.md` (class table, every widget signature).
   Reference app: `crates/cascivo-tui/examples/dashboard.rs` + `examples/support/mod.rs`
   (tabs, table, list, modal, toasts, themes). Copy its shape.
2. `cargo add cascivo-tui` (MSRV Rust 1.88). Write one `Msg` enum, an app struct, `impl App`.
3. Prove it headless with `TestApp` (below) before running it for real.
4. Run: `run(app)` or `run_with(app, RunOptions { theme: Some("midnight".into()), ..Default::default() })`.

## Example

```rust
use cascivo_tui::prelude::*;

#[derive(Clone)]
enum Msg { Tab(usize), Row(usize), Ask, Close, Quit }

#[derive(Default)]
struct Ui { tab: usize, row: usize, confirm: bool }

impl App for Ui {
    type Msg = Msg;
    fn update(&mut self, m: Msg) -> Cmd<Msg> {
        match m {
            Msg::Tab(i) => self.tab = i,
            Msg::Row(i) => self.row = i,
            Msg::Ask => self.confirm = true,
            Msg::Close => self.confirm = false,
            Msg::Quit => return Cmd::Quit,
        }
        Cmd::None
    }
    fn view(&self) -> Node<Msg> {
        let rows = vec![vec!["api".into(), "up".into()], vec!["db".into(), "down".into()]];
        let body = table(&["Service", "State"], rows, &[Col::Grow(1), Col::Fixed(6)], self.row, Msg::Row).id("svc");
        let mut kids = vec![
            tabs(&["Overview", "Services"], self.tab, Msg::Tab).id("tabs"),
            col("grow p-1", [card("Services", "grow", [body])]),
            statusbar("prod", "2 services"),
            keyhints(&self.keys()),
        ];
        if self.confirm {
            let b = col("", [text("Restart?").into(), button("Yes", Msg::Close).id("yes")]);
            kids.push(modal("Confirm", b, Msg::Close)); // overlays last
        }
        col("", kids)
    }
    fn keys(&self) -> Keymap<Msg> {
        Keymap::new().bind("r", "restart", Msg::Ask).bind("q", "quit", Msg::Quit)
    }
}
```

## Class cheatsheet

Space-separated tokens, last wins, unknown tokens are errors. `N` = 0..=64.

- Layout: `gap-N p-N px-N py-N pt-N pr-N pb-N pl-N w-N h-N w-full h-full w-1/2 h-1/3 min-w-N max-h-N grow grow-N shrink-0 hidden`
- Align: `justify-start|center|end|between|around|evenly`, `items-start|center|end|stretch`
- Border: `border border-none border-t|r|b|l|x|y rounded border-double|thick|plain border-<role>`
- Colour: `text-<role>` `bg-<role>` (roles: bg surface surface2 border border_strong fg muted accent accent_fg success warning danger info focus selection; `bg-` takes bg surface surface2 accent selection success warning danger info)
- Text: `bold italic underline strike dim reverse text-left|center|right truncate wrap nowrap scroll-y clip`
- Variants: `focus: selected: disabled:` (colour/modifier only), `narrow:` (under 80 cols)
- `row`/`col` are builders, not classes. Roles are snake_case: `text-accent_fg`.

## Widget cheatsheet

- `col(class, [..])` `row(class, [..])` `spacer()` `text(s).bold().muted().class(..)` (then `.into()`)
- `heading(s)` `card(title, class, [..])` `statusbar(left, right)` `keyhints(&keymap)`
- `button(label, msg).id(..)` `input(value, placeholder, |s| Msg::Name(s)).on_submit(msg).cursor(&c).id(..)` (no built-in padding; add `.class("px-1")`)
- `list(Vec<String>, selected, |i| Msg).on_activate(|i| ..).scroll(&Scroll).id(..)`
- `table(&[headers], rows, &[Col], selected, |i| Msg)` (same builder) `tabs(&[titles], active, |i| Msg).id(..)`
- `progress(0.5, "cpu")` `sparkline(&[u64])`
- `modal(title, body, on_close)` (only while a flag is set, last child) `toasts(&[(Kind, String)])` last child, expire with `Cmd::tick`
- Layout: a container with no size and no growing child takes its intrinsic size (a one-line `row` is one line); wrapping `text` is measured at the width on offer.
- Focusable widgets need `.id(..)`. Keep `Scroll` and `Cursor` handles in the app.
- Cmds: `Cmd::none() Cmd::Quit Cmd::Msg(m) Cmd::tick(ms, m) Cmd::batch([..]) Cmd::SetTheme("dark".into())`
- Themes: arcade brutalist corporate cyberpunk dark flat light midnight minimal pastel terminal warm.

## Common errors

- `unknown class "bg-primary": did you mean "bg-accent"?` - take the suggestion; it is always a real class.
- `out of range "gap-99"` - numbers are capped (0..=64).
- `variant not allowed` - `focus:` and friends accept only colour and modifier tokens.
- `invalid key "..."` - chords look like `q`, `ctrl+k`, `shift+tab`, `esc`, `enter`, `f5`.
- A red error panel at run time names the same problem; `q` or `ctrl+c` quits.
- Widget not focusable: missing `.id(..)`. Modal under the page: not the last root child.

## Self-verify with TestApp

```rust
let mut t = TestApp::new(Ui::default(), 60, 12).theme("dark");
t.press("right");                       // chord strings: "tab", "ctrl+k", "enter", "j"
assert!(t.render().unwrap().contains("Services"));
t.press("r");
assert_eq!(t.focused(), Some("yes"));   // modal traps focus
t.press("esc").advance(2000);           // virtual clock for Cmd::tick
assert!(!t.app().confirm);
```

`render()` returns the screen as text; `cell(x, y)` gives symbol, colour roles and modifiers;
`render_to_string(&node, cols, rows)` renders one node. A `class` typo makes `render_to_string`
return `Err`. `t.assert_snapshot("name")` compares the screen with `tests/snapshots/name.txt`, writing it when missing or when `UPDATE_SNAPSHOTS=1`, and panics with a line diff otherwise. Run `cargo test` and fix until it passes, then run the app.
