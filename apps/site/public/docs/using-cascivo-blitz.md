<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-cascivo-blitz.md
  registry v1.10.0 · generated 2026-11-11
-->

# Native windows with cascivo-blitz

`cascivo-blitz` shows a `.cv` file in a native window. It uses the Blitz engine (Stylo, Taffy,
Vello). It needs no browser and no Dioxus. The `.cv` format is the same as in
[USING-CASCIVO-HTML.md](/docs/using-cascivo-html.md).

## When to use it

| You want                   | Use                                                                |
| -------------------------- | ------------------------------------------------------------------ |
| A static HTML file         | `cascivo-html`                                                     |
| A native window from `.cv` | `cascivo-blitz`                                                    |
| A terminal UI              | `cascivo-tui` ([USING-CASCIVO-TUI.md](/docs/using-cascivo-tui.md)) |

## Install

```sh
cargo add cascivo-blitz                          # window + GPU renderer
cargo add cascivo-blitz --no-default-features    # headless: build and style documents only
```

Rust 1.91 or newer. Blitz is pinned to a beta (`0.3.0-beta.4`).

## Open a window

```rust
use cascivo_blitz::{launch_cv, Options};

fn main() -> Result<(), cascivo_blitz::Error> {
    launch_cv("h1 \"Hello\"\nbutton \"Go\" primary\n", Options::default())
}
```

`Options`: `theme` (`None` follows the file; `Some("dark")` forces a theme), `color_scheme`
(`@media (prefers-color-scheme)`, `light-dark()`), `viewport` (headless size), `html`
(`cascivo_html::Options`, for assets and brand files; `target` defaults to `Target::Blitz`), `lint`
(collect compatibility warnings).

## Test computed styles

```rust
let mut doc = cascivo_blitz::document_from_cv(src, &Options::default())?;
doc.resolve(0.0);
let button = doc.query_selector("button").unwrap().unwrap();
let bg = doc.resolved_style_value(button, "background-color");
```

This runs with no window and no GPU.

## Make it interactive

`App` adds Rust event handlers, signal bindings and native behaviours. There is no Dioxus and no
virtual DOM: a handler changes the DOM through Blitz's `DocumentMutator`.

```rust
use cascivo_blitz::{App, Event, Options, Signal};

fn main() -> Result<(), cascivo_blitz::Error> {
    let count = Signal::new(0);
    let (inc, shown) = (count.clone(), count.clone());
    App::from_cv("text \"0\"\nbutton \"+\" primary\n", Options::default())
        .on("button", Event::Click, move |_| inc.update(|n| *n += 1))
        .bind_text("p", move || shown.get().to_string())
        .launch()
}
```

Run `cargo run -p cascivo-blitz --example interactive` for a longer one.

### Handlers

`on(selector, event, handler)` runs `handler` when the event reaches a node that matches the
selector, on the node or a descendant. Events bubble. Events: `Click`, `DoubleClick`, `Input`,
`KeyDown`, `KeyUp`, `Focus`, `Blur`.

`.cv` has no `id` prop. Select by tag, by `[data-…]`, or by the component class that cascivo-html
writes (`.cv-card-card`, `.cv-data-table-table`). For your own markup use `App::from_html`.

The handler gets a `Ctx`:

| Call                                              | Does                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `set_text(sel, text)`, `text(sel)`                | replace or read text                                                |
| `set_attr`, `remove_attr`, `attr`                 | attributes                                                          |
| `set_class(sel, class, on)`, `toggle_class`       | classes                                                             |
| `select_value(sel)`                               | chosen value of a `<select>`                                        |
| `open_dialog(sel)`, `close_dialog(sel)`           | dialogs                                                             |
| `target()`, `current()`, `key()`, `input_value()` | the event                                                           |
| `prevent_default()`, `stop_propagation()`         | control the event                                                   |
| `dom()`                                           | node-level `Dom`: `query`, `closest`, `attr`, `set_attr`, `text`, … |

### Signals and bindings

`Signal<T>` holds a value. `computed(|| …)` derives one. `effect(|| …)` re-runs when a signal it
read changes. `batch(|| …)` groups writes so effects run once. They are single-thread and have no
macro.

`bind_text(sel, f)`, `bind_attr(sel, name, f)` and `bind_class(sel, class, f)` keep the DOM equal
to `f()`. `f` reads signals, and the DOM follows when they change. The DOM is patched after each
event.

### Native behaviours

Blitz runs no scripts and has no `<select>` or `<dialog>`. cascivo-blitz replaces them. They run
before your handlers, so a handler on a table sees it already sorted. All are on by default.

| Behaviour  | Acts on                                                                                                                                                                    | Keyboard                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| table sort | `table[data-sortable] th[aria-sort]` (`table … sort`). Numbers sort as numbers. Sets `aria-sort`, `data-parity`                                                            | Enter or Space on the header button     |
| tabs       | radio tabs from `tabs` (Blitz already switches them on click). ARIA tabs: `[role=tab]` with `aria-controls`, `[role=tabpanel]`; sets `aria-selected`, `tabindex`, `hidden` | Arrows, Home, End                       |
| details    | `details[name]` closes the others in its group; `data-state` and `aria-expanded` follow `open`                                                                             | Enter, Space                            |
| dialog     | `<dialog>` shows with `open`. `[data-dialog-open=id]`, `[data-dialog-toggle=id]`, `[data-dialog-close]`. Focus moves in, and returns to the opener                         | Escape closes; Tab stays inside         |
| select     | `<select>` is hidden and a combobox button plus listbox take its place. The `<select>` keeps the value (`selected` on its `option`)                                        | Arrows, Home, End, Enter, Space, Escape |

Blitz turns no key press into a click. cascivo-blitz sends a click for Enter or Space on a focused
button, summary, `role=button|tab`, checkbox or radio. Blitz also drops focus after a click on a
plain button; cascivo-blitz gives it back.

Turn one off: `.behaviors(Behaviors { select: false, ..Behaviors::all() })`.

### Compatibility warnings

`Options` renders with `Target::Blitz`, which rewrites CSS and SVG for the engine. With
`Options::lint` (default on), `App::launch` prints the `cascivo_html::lint` warnings for the `.cv`
(`InteractiveDocument::warnings` returns them). Warnings that the crate already fixes are dropped:
table sort and `:has()`.

### Test without a window

```rust
let mut doc = App::from_cv(src, Options::default()).on(…).build()?;
doc.click("button");                       // synthetic click
doc.focus("th button");
doc.press(cascivo_blitz::Key::Named(cascivo_blitz::NamedKey::Enter));
assert_eq!(doc.text("p").as_deref(), Some("1"));
```

`click`, `pointer_click` (real pointer events through hit testing), `press`, `focus` and `input`
all run the handlers and behaviours. `doc.resolve(0.0)` and `resolved_style_value` check styles.

## What does not work yet

- Dialogs have no `::backdrop` in Blitz. A large `box-shadow` stands in for it, and the page behind
  is not `inert`. Tab stays inside the dialog, but a screen reader can still reach the page.
- `<select multiple>` is left as it is.
- Signals are single-thread. A change made outside an event shows after the next event or `poll`.
- Blitz gaps that `Target::Blitz` lowers in CSS (`@container`, `:focus-visible`, SVG `fill` and
  `stroke`) follow the window, not the parent box. See [USING-CASCIVO-HTML.md](/docs/using-cascivo-html.md).
- No other scripts run. cascivo-html inline JS other than table sort has no effect.

## Links

- Crate: [crates/cascivo-blitz](https://github.com/cascivo/cascivo/tree/main/crates/cascivo-blitz)
- Blitz: <https://github.com/DioxusLabs/blitz>
