<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-cascivo-tui.md
  registry v1.10.0 · generated 2026-11-11
-->

# Using cascivo-tui

`cascivo-tui` is the cascivo design system for the terminal: a small widget toolkit on
[ratatui](https://ratatui.rs). You describe a screen as a tree of nodes styled with utility
**class strings** (`"col gap-1 p-1 border rounded text-accent"`), and the crate lays it out and
paints it with one of twelve cascivo **themes**. Apps follow one pattern: state, a pure `view`,
and `update` for messages. Class strings are validated, so a typo is an error with a suggestion,
not a silent no-op.

MSRV: Rust 1.88 (ratatui 0.30 requires it; the workspace default is lower).

## Quickstart

```toml
[dependencies]
cascivo-tui = "0.1"
```

A counter. `+` adds one, `q` quits, `ctrl+c` always quits.

```rust,no_run
use cascivo_tui::prelude::*;

#[derive(Clone)]
enum Msg {
    Inc,
    Quit,
}

struct Counter(i32);

impl App for Counter {
    type Msg = Msg;

    fn update(&mut self, msg: Msg) -> Cmd<Msg> {
        match msg {
            Msg::Inc => {
                self.0 += 1;
                Cmd::none()
            }
            Msg::Quit => Cmd::Quit,
        }
    }

    fn view(&self) -> Node<Msg> {
        col("p-1", [text(format!("count: {}", self.0)).into()])
    }

    fn keys(&self) -> Keymap<Msg> {
        Keymap::new().bind("+", "add", Msg::Inc).bind("q", "quit", Msg::Quit)
    }
}

fn main() -> Result<(), TuiError> {
    run(Counter(0))
}
```

The full reference app is `crates/cascivo-tui/examples/dashboard.rs` (logic in
`examples/support/mod.rs`): three tabs, a table, a log list, a restart modal, toasts and live
theme switching. Run it with `cargo run -p cascivo-tui --example dashboard`.

## Mental model

- **MVU.** `App` has an associated `Msg` type (`Clone + 'static`). `update(msg)` changes state and
  returns a `Cmd`. `view()` builds the whole tree from state; it is called per draw and per key, so
  keep it pure. There is no retained widget state: scroll position and text cursors live in the
  app (`Scroll`, `Cursor` handles), selection indexes are plain fields.
- **Node tree.** `Node<M>` is a container (`col`, `row`) or a leaf (`text`, a widget). Children are
  passed as arrays; a `Text` converts with `.into()`. Builders return the node, so chain
  `.class("...")`, `.id("...")`, `.title("...")` on it.
- **Class strings.** Whitespace-separated utility tokens (see the class table). They are parsed
  once and cached. Unknown tokens, out-of-range numbers and a variant on a class that cannot take
  one are errors, never ignored.
- **Messages out of widgets.** Widgets do not mutate anything. A button holds a message value
  (`button("Save", Msg::Save)`); lists, tables and tabs take a `Fn(usize) -> Msg`; inputs take a
  `Fn(String) -> Msg`. The runtime feeds the message to `update`.
- **`Cmd`.** `Cmd::none()`, `Cmd::Quit`, `Cmd::Msg(m)` (feed back straight away, depth-limited),
  `Cmd::tick(ms, m)` (deliver once after a delay), `Cmd::batch([..])`, `Cmd::SetTheme(name)`.
  `App::init` runs once before the first draw and may return a `Cmd` too.
- **Layout.** `col` stacks children top to bottom, `row` left to right, using ratatui's `Layout`.
  A leaf takes its intrinsic size, a container fills the remaining space, `grow` shares leftover
  space, `w-N`/`h-N` fix a size in cells. Children that do not fit are clipped, never overlapped.
  Frames narrower than 80 columns apply `narrow:` classes.

## Class table

`N` is an integer 0..=64 (`grow-N`: 0..=16). `row` and `col` are node kinds chosen by the builder,
not classes. Conflicting tokens resolve last-wins (`w-4 w-8` is width 8); text modifiers
(`bold italic`) and border sides (`border-t border-l`) accumulate. Role names use the snake names
below: `text-accent_fg`, `bg-surface2`, `border-border_strong`. This table is checked against
`cascivo_tui::class::VOCABULARY` by `tests/docs.rs`.

| Class                                                                                                                                                                                                                                                 | Meaning                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `gap-N`                                                                                                                                                                                                                                               | Cells between children.                                                |
| `p-N` `px-N` `py-N` `pt-N` `pr-N` `pb-N` `pl-N`                                                                                                                                                                                                       | Padding in cells: all, horizontal, vertical, top, right, bottom, left. |
| `w-N` `h-N`                                                                                                                                                                                                                                           | Fixed width / height in cells.                                         |
| `w-full` `h-full`                                                                                                                                                                                                                                     | Fill the parent along that axis.                                       |
| `w-1/2` `w-1/3` `w-2/3` `w-1/4` `w-3/4`                                                                                                                                                                                                               | Fraction of the parent width.                                          |
| `h-1/2` `h-1/3` `h-2/3` `h-1/4` `h-3/4`                                                                                                                                                                                                               | Fraction of the parent height.                                         |
| `min-w-N` `min-h-N` `max-w-N` `max-h-N`                                                                                                                                                                                                               | Lower / upper bounds in cells.                                         |
| `grow` `grow-N`                                                                                                                                                                                                                                       | Share leftover main-axis space (`grow` is `grow-1`).                   |
| `shrink-0`                                                                                                                                                                                                                                            | Keep the intrinsic size.                                               |
| `justify-start` `justify-center` `justify-end` `justify-between` `justify-around` `justify-evenly`                                                                                                                                                    | Main-axis distribution (default `justify-start`).                      |
| `items-start` `items-center` `items-end` `items-stretch`                                                                                                                                                                                              | Cross-axis alignment (default `items-stretch`).                        |
| `border`                                                                                                                                                                                                                                              | Border on all sides.                                                   |
| `border-none`                                                                                                                                                                                                                                         | Clear all border sides.                                                |
| `border-t` `border-r` `border-b` `border-l` `border-x` `border-y`                                                                                                                                                                                     | Individual sides; they accumulate.                                     |
| `rounded`                                                                                                                                                                                                                                             | Rounded corner style; combine with `border`.                           |
| `border-double` `border-thick` `border-plain`                                                                                                                                                                                                         | Border line style.                                                     |
| `border-bg` `border-surface` `border-surface2` `border-border` `border-border_strong` `border-fg` `border-muted` `border-accent` `border-accent_fg` `border-success` `border-warning` `border-danger` `border-info` `border-focus` `border-selection` | Border colour from a theme role.                                       |
| `text-fg` `text-muted` `text-accent` `text-accent_fg` `text-success` `text-warning` `text-danger` `text-info`                                                                                                                                         | Text colour from a theme role.                                         |
| `bg-bg` `bg-surface` `bg-surface2` `bg-accent` `bg-selection` `bg-success` `bg-warning` `bg-danger` `bg-info`                                                                                                                                         | Background colour from a theme role.                                   |
| `bold` `italic` `underline` `strike` `dim` `reverse`                                                                                                                                                                                                  | Text modifiers; they accumulate.                                       |
| `text-left` `text-center` `text-right`                                                                                                                                                                                                                | Text alignment.                                                        |
| `truncate` `wrap` `nowrap`                                                                                                                                                                                                                            | Overflow handling for text.                                            |
| `scroll-y` `clip`                                                                                                                                                                                                                                     | Scroll or clip overflowing content vertically.                         |
| `hidden`                                                                                                                                                                                                                                              | Skip the node entirely.                                                |

Variants prefix any colour, modifier or layout token: `focus:`, `selected:`, `disabled:` (state
variants, colour and modifier tokens only) and `narrow:` (frames under 80 columns). Example:
`"bg-surface focus:bg-accent focus:text-accent_fg narrow:p-0"`.

Theme roles: `bg`, `surface`, `surface2`, `border`, `border_strong`, `fg`, `muted`, `accent`,
`accent_fg`, `success`, `warning`, `danger`, `info`, `focus`, `selection`.

## Widgets

All widgets are in `cascivo_tui::prelude::*` (and the crate root). Widgets that take input join the
focus ring only once they have an `.id("...")`. Builders that return a struct (`list`, `table`,
`input`) convert into a node with `.into()` or by ending the chain with `.id(..)`.

### text, col, row, spacer

```rust
use cascivo_tui::prelude::*;

let n: Node = col(
    "gap-1 p-1",
    [
        text("Revenue").bold().into(),
        row("gap-2", [text("left").into(), spacer(), text("right").muted().into()]),
    ],
);
assert!(render_to_string(&n, 20, 4).unwrap().contains("Revenue"));
```

`col(class, children)`, `row(class, children)`, `spacer()`, `text(s)` with `.class(..)`,
`.bold()`, `.muted()`.

### heading

`heading(s: impl Into<String>) -> Node<M>`: bold, accent-coloured text.

```rust
use cascivo_tui::prelude::*;

let n: Node = heading("Title");
assert_eq!(n.classes(), "bold text-accent");
```

### card

`card(title: &str, class: &str, children: impl Into<Vec<Node<M>>>) -> Node<M>`: a rounded, bordered
surface with the title on the top border.

```rust
use cascivo_tui::prelude::*;

let n: Node = card("Stats", "", [text("ok").into()]);
assert_eq!(n.border_title(), Some("Stats"));
```

### button

`button(label: &str, on_press: M) -> Node<M>` where `M: Clone + 'static`. Enter or Space while
focused emits a clone of `on_press`. Needs an id to be focusable.

```rust
use cascivo_tui::prelude::*;

let n: Node<&str> = button("Save", "save").id("save");
assert!(n.is_focusable());
assert_eq!(render_to_string(&n, 10, 1).unwrap(), " Save");
```

### input

`input(value: &str, placeholder: &str, on_change: impl Fn(String) -> M) -> Input<M>`. Builder
methods: `.on_submit(msg)`, `.cursor(&Cursor)`, `.class(..)`, `.id(..)`. Typing, Backspace, Delete,
Left, Right, Home and End all emit `on_change(new_value)`; store whatever it gives you. Keep one
`Cursor` in the app and pass it on every build, otherwise the cursor stays at the end.

```rust
use cascivo_tui::prelude::*;

let n: Node<String> = input("héllo", "name", |s| s).id("name");
assert_eq!(render_to_string(&n, 10, 1).unwrap(), " héllo");

let cursor = Cursor::default();
cursor.set(2);
assert_eq!(cursor.get(), Some(2));
```

### list

`list(items: Vec<String>, selected: usize, on_select: impl Fn(usize) -> M) -> List<M>`. `j`/`k`/
Down/Up emit `on_select(index)` and clamp at the ends. Builder: `.on_activate(Fn(usize) -> M)` for
Enter, `.scroll(&Scroll)`, `.class(..)`, `.id(..)`. Keep one `Scroll` in the app.

```rust
use cascivo_tui::prelude::*;

let n: Node<usize> = list(vec!["a".into(), "b".into(), "c".into()], 1, |i| i).id("files");
assert_eq!(render_to_string(&n, 6, 2).unwrap(), "  a\n› b");
```

### table

`table(header: &[&str], rows: Vec<Vec<String>>, widths: &[Col], selected: usize, on_select: impl Fn(usize) -> M) -> Table<M>`.
`Col::Grow(n)` shares space, `Col::Fixed(n)` is n cells; a column with no `Col` is `Grow(1)`.
The header is sticky and only the body scrolls. Same builder as `list`.

```rust
use cascivo_tui::prelude::*;
use cascivo_tui::widgets::Col;

let n: Node<usize> = table(
    &["Name", "Qty"],
    vec![vec!["apple".into(), "3".into()]],
    &[Col::Grow(1), Col::Fixed(3)],
    0,
    |i| i,
)
.id("t");
assert_eq!(render_to_string(&n, 10, 2).unwrap(), "Name   Qty\napple  3");
```

### tabs

`tabs(titles: &[&str], active: usize, on_change: impl Fn(usize) -> M) -> Node<M>`. Left/Right move
and clamp; `1`-`9` jump. The app decides which body to show from `active`.

```rust
use cascivo_tui::prelude::*;

let n: Node<usize> = tabs(&["One", "Two"], 1, |i| i).id("tabs");
assert_eq!(render_to_string(&n, 12, 1).unwrap(), " One   Two");
```

### progress

`progress(ratio: f64, label: &str) -> Node<M>`: ratio clamped to 0..=1.

```rust
use cascivo_tui::prelude::*;

let n: Node = progress(0.5, "cpu");
assert_eq!(render_to_string(&n, 14, 1).unwrap(), "cpu 50% ███░░░");
```

### sparkline

`sparkline(data: &[u64]) -> Node<M>`: scaled to the largest value; shows the latest values when
too wide.

```rust
use cascivo_tui::prelude::*;

let n: Node = sparkline(&[0, 4, 8]);
assert_eq!(render_to_string(&n, 5, 1).unwrap(), "▁▄█");
```

### statusbar

`statusbar(left: impl Into<String>, right: impl Into<String>) -> Node<M>`: one row on the raised
surface; `left` truncates, `right` stays whole.

```rust
use cascivo_tui::prelude::*;

let n: Node = statusbar("ready", "q quit");
assert_eq!(n.children().len(), 2);
```

### keyhints

`keyhints(keys: &Keymap<M>) -> Node<M>`: a hint line built from `Keymap::bind` labels, always ending
with `tab focus`. `ambient` bindings are not listed.

```rust
use cascivo_tui::prelude::*;

let km = Keymap::new().bind("q", "quit", 1).ambient("ctrl+c", 2);
let n: Node<i32> = keyhints(&km);
assert_eq!(render_to_string(&n, 40, 1).unwrap(), "q quit · tab focus");
```

### modal

`modal(title: &str, body: Node<M>, on_close: M) -> Node<M>`. Centered over the rest of the view.
While it is in the tree, focus and keys are trapped inside it, the app keymap is skipped, and Esc
emits `on_close`. The app owns visibility: include the node only while a flag is set. Make it the
last child of the root so it paints on top.

```rust
use cascivo_tui::prelude::*;

let body: Node<&str> = col("", [text("Delete?").into(), button("Yes", "yes").id("yes")]);
let ui: Node<&str> = col("", [text("page").into(), modal("Confirm", body, "close")]);
let s = render_to_string(&ui, 20, 8).unwrap();
assert!(s.contains("Confirm") && s.contains("Delete?"));
assert!(ui.active_modal().unwrap().find("yes").is_some());
```

### toast, toasts

`toast(kind: Kind, msg: &str) -> Node<M>` is one bordered message; `toasts(items: &[(Kind, String)])`
is a bottom-right stack of the newest 3 (`MAX_TOASTS`). `Kind` is `Info`, `Success`, `Warning`
or `Danger`; each has a glyph (`i`, `✓`, `!`, `✗`) so it is not colour-only. The app owns
lifetimes: push to state on an event and schedule removal with `Cmd::tick(2000, Msg::Expire)`.
Place `toasts(..)` last among the root's children.

```rust
use cascivo_tui::prelude::*;

let items = [(Kind::Info, "one".to_string()), (Kind::Danger, "two".to_string())];
let ui: Node = col("", [text("page").into(), toasts(&items)]);
let s = render_to_string(&ui, 20, 8).unwrap();
assert!(s.contains("i one") && s.contains("✗ two"));
```

## Focus, keys, modal and toast behaviour

- **Focus ring.** Nodes with an `.id(..)` and a focusable widget (button, input, list, table, tabs)
  form the ring in tree order. Tab and Shift-Tab move through it. Focus shows as the `focus:`
  colours plus bold or reverse, never colour alone.
- **Key routing.** A key goes to the focused widget first, then to `App::keys`, then to Tab/Shift-Tab
  focus movement. An open modal confines focus to its body and skips `App::keys`. `ctrl+c` always
  quits.
- **Keymap.** `Keymap::new().bind("r", "restart", Msg::Restart)` shows `r restart` in `keyhints`;
  `.ambient("ctrl+k", Msg::Palette)` binds without a hint. Chords are `"q"`, `"ctrl+k"`, `"tab"`,
  `"shift+tab"`, `"esc"`, `"enter"`, `"f5"`, `"+"`. A chord that does not parse is skipped, and the
  runtime paints an error panel instead of panicking.
- **Errors at runtime.** A class error in the view, a bad chord or a message chain that overruns the
  depth limit paints a red error panel; keys then do nothing except `ctrl+c` and `q`, which quit.

## Themes

Twelve themes: `arcade`, `brutalist`, `corporate`, `cyberpunk`, `dark`, `flat`, `light`,
`midnight`, `minimal`, `pastel`, `terminal`, `warm`. `Theme::names()` lists them and
`Theme::by_name(name)` looks one up. The default is `terminal`. Choose one at start-up with
`RunOptions { theme: Some("midnight".into()), ..Default::default() }` passed to `run_with`, with
the `CASCIVO_THEME` environment variable, or at runtime by returning `Cmd::SetTheme(name)` from
`update`. An unknown name in `Cmd::SetTheme` paints the error panel, so typos are loud. The colour
depth follows the terminal (`NO_COLOR` and `COLORTERM`), and focus keeps a bold or reverse cue at
every depth.

```rust
use cascivo_tui::prelude::*;

assert!(Theme::names().contains(&"midnight"));
assert!(Theme::by_name("midnight").is_some());
let next: Cmd<()> = Cmd::SetTheme("midnight".to_owned());
assert!(matches!(next, Cmd::SetTheme(_)));
```

## Testing

`TestApp` runs your `App` headless on a fixed grid with a virtual clock. `press("ctrl+k")` sends a
chord, `type_text("abc")` types characters, `advance(ms)` moves time for `Cmd::tick`,
`resize(cols, rows)` resizes, `render()` returns the screen as text, `cell(x, y)` returns a
`CellView` (symbol, colours, theme roles, modifiers), `app()` reads state, `focused()` reads the
focus id, `is_quit()` checks for exit, and `.theme("dark")` selects a theme. For a single node use
`render_to_string(&node, cols, rows)`.

```rust
use cascivo_tui::prelude::*;

#[derive(Clone)]
enum Msg {
    Inc,
    Quit,
}
struct Counter(i32);
impl App for Counter {
    type Msg = Msg;
    fn update(&mut self, m: Msg) -> Cmd<Msg> {
        match m {
            Msg::Inc => {
                self.0 += 1;
                Cmd::none()
            }
            Msg::Quit => Cmd::Quit,
        }
    }
    fn view(&self) -> Node<Msg> {
        col("", [text(format!("count: {}", self.0)).into()])
    }
    fn keys(&self) -> Keymap<Msg> {
        Keymap::new().bind("+", "add", Msg::Inc).bind("q", "quit", Msg::Quit)
    }
}

let mut t = TestApp::new(Counter(0), 20, 3);
t.press("+").press("+");
assert_eq!(t.render().unwrap(), "count: 2");
assert!(!t.is_quit());
t.press("q");
assert!(t.is_quit());
```

`TestApp::press` panics on a chord that does not parse and `TestApp::theme` on an unknown theme
(the message lists the valid names); both are test-only APIs. The dashboard's own test is
`tests/example_smoke.rs`.

## Common errors

| Message                                                 | Cause and fix                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `unknown class "bg-primary": did you mean "bg-accent"?` | Not a cascivo class. Use the suggestion; aliases such as `primary`, `destructive`, `error`, `foreground`, `background` map to roles. |
| `out of range "gap-99": did you mean "gap-64"?`         | A number above the limit (0..=64, `grow-N` 0..=16).                                                                                  |
| `variant not allowed "focus:p-1"`                       | `focus:`, `selected:` and `disabled:` take only colour and modifier tokens. Use `narrow:` for layout.                                |
| `invalid key "ctrl+"`                                   | A `Keymap` chord that does not parse. Use `ctrl+`, `alt+`, `shift+` plus one key or a name (`tab`, `esc`, `enter`, `f5`).            |
| red error panel at runtime                              | A class error, bad chord or message loop in the view. The panel names it. Fix and rerun; `q` or `ctrl+c` quits.                      |
| a widget never gets focus                               | It has no `.id(..)`.                                                                                                                 |
| a modal paints under the page                           | It is not the last child of the root.                                                                                                |
| `render_to_string` returns `Err(TuiError::Class(..))`   | A class string in the tree is invalid; the error carries the token and suggestion.                                                   |
