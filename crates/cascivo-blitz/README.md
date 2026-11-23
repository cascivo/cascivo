# cascivo-blitz

Render cascivo `.cv` text in a native window with [Blitz](https://github.com/DioxusLabs/blitz).
No browser, no webview, no Dioxus. `.cv` goes to HTML and CSS through `cascivo-html`; Blitz
parses, styles, lays out and paints it.

## Quick example

```toml
[dependencies]
cascivo-blitz = "0.1"
```

```rust
let src = r#"
center
  h1 "Hello, Blitz"
  button "Go" primary
"#;
cascivo_blitz::launch_cv(src, cascivo_blitz::Options::default())?;
```

Try it: `cargo run -p cascivo-blitz --example hello [file.cv]`.

## Interactive apps

`App` adds Rust event handlers, signal bindings and native behaviours. No Dioxus, no virtual DOM.

```rust
use cascivo_blitz::{App, Event, Options, Signal};

let count = Signal::new(0);
let (inc, shown) = (count.clone(), count.clone());
App::from_cv("text \"0\"\nbutton \"+\" primary\n", Options::default())
    .on("button", Event::Click, move |_| inc.update(|n| *n += 1))
    .bind_text("p", move || shown.get().to_string())
    .launch()?;
```

Try it: `cargo run -p cascivo-blitz --example interactive`.

- Handlers match by CSS selector (`#id`, `.class`, `[data-action=save]`, `button`). `.cv` has no
  `id` prop, so select by tag or by the component class (`.cv-card-card button`), or use `from_html`.
- `Signal`, `computed`, `effect`, `batch`: a small single-thread signal layer. Bindings are effects
  that patch the DOM through `DocumentMutator`.
- `Ctx` in a handler: `set_text`, `set_attr`, `toggle_class`, `select_value`, `open_dialog`,
  `prevent_default`, `stop_propagation`, and `dom()` for node-level access.
- Native behaviours run before your handlers, so handlers see the new state:

| Behaviour  | Markup                                                                        | Keys                                    |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| table sort | `table[data-sortable] th[aria-sort]` (`table … sort`)                         | Enter, Space on the header button       |
| tabs       | radio tabs from `tabs`; `[role=tab]` with `aria-controls`                     | Arrows, Home, End                       |
| details    | `details[name]` closes its group; `data-state`, `aria-expanded` follow `open` | Enter, Space                            |
| dialog     | `<dialog>`, `[data-dialog-open=id]`, `[data-dialog-close]`                    | Escape closes, Tab stays inside         |
| select     | `<select>` becomes a combobox and listbox; the `<select>` keeps the value     | Arrows, Home, End, Enter, Space, Escape |

Blitz turns no key press into a click, so Enter and Space on a focused button, summary, tab,
checkbox or radio send one. Turn a behaviour off with `.behaviors(Behaviors { select: false, ..Behaviors::all() })`.

- `InteractiveDocument` is headless. `click`, `pointer_click`, `press`, `focus` and `input` send
  synthetic events, so tests need no window.

## API

- `document_from_cv(src, &Options) -> Result<HtmlDocument, Error>`: build a Blitz document. Headless.
- `launch_cv(src, Options) -> Result<(), Error>` (feature `window`): open a window, block until it closes.
- `html_from_cv(src, &Options) -> Result<String, Error>`: the HTML Blitz is given.
- `enable_prefs()`: turn on the Stylo prefs cascivo needs. The other functions call it.
- `Options { theme, color_scheme, viewport, html, lint }`. `theme: None` follows the file's `@brand`.
  `html.target` defaults to `Target::Blitz`, which lowers CSS and SVG for Blitz. `lint` collects
  `cascivo_html::lint` warnings (`InteractiveDocument::warnings`, printed by `App::launch`).
- `App`, `Ctx`, `Event`, `InteractiveDocument`, `Behaviors`, `Dom`: see above.
- `reactive::{Signal, Computed, Effect, computed, effect, batch, untracked}`.
- `lint_cv(src, &Options)`: warnings for `.cv` that degrades on Blitz.

## Features

| Feature  | Default | What                                                |
| -------- | ------- | --------------------------------------------------- |
| `window` | yes     | winit shell and Vello GPU renderer for `launch_cv`. |

Without it (`--no-default-features`) the crate builds and tests with no GPU or window stack.
Use that for CI and for computed-style tests.

## Prefs shim

Blitz leaves Stylo's `:has()` off, so `:has()` rules in cascivo CSS (card padding, link icons)
are dropped. `enable_prefs()` turns it on before the first document is built. The pref is
process-wide.

## Blitz version

Pinned to `=0.3.0-beta.4`, a beta. The stable 0.2.x line cannot do this: its Stylo (0.8) hard-codes
`:has()` off, and it has no pref to change that. The 0.3 beta MSRV is Rust 1.91. Expect API breaks
on each beta bump.

## Known gaps

- Dialogs have no `::backdrop` in Blitz. A large `box-shadow` stands in for it, and a modal dialog
  has no `inert` page behind it. Tab stays inside, but screen readers can still reach the page.
- `multiple` selects are left as they are (Blitz draws no `<select>`).
- No scripts run. Anything cascivo-html does in inline JS other than table sort has no effect.
- Signals are single-thread (`Rc`). Set them from handlers or from the thread that runs the window.
  A change made outside an event shows after the next event or `poll`.
- Remote images are not fetched (`.cv` images are `data:` URIs by default).

## Links

- Guide: [docs/USING-CASCIVO-BLITZ.md](../../docs/USING-CASCIVO-BLITZ.md)
- `.cv` format: [cascivo-html](../cascivo-html)
