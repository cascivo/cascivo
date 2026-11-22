# Native windows with cascivo-blitz

`cascivo-blitz` shows a `.cv` file in a native window. It uses the Blitz engine (Stylo, Taffy,
Vello). It needs no browser and no Dioxus. The `.cv` format is the same as in
[USING-CASCIVO-HTML.md](USING-CASCIVO-HTML.md).

## When to use it

| You want | Use |
| -------- | --- |
| A static HTML file | `cascivo-html` |
| A native window from `.cv` | `cascivo-blitz` |
| A terminal UI | `cascivo-tui` ([USING-CASCIVO-TUI.md](USING-CASCIVO-TUI.md)) |

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
(`cascivo_html::Options`, for assets and brand files).

## Test computed styles

```rust
let mut doc = cascivo_blitz::document_from_cv(src, &Options::default())?;
doc.resolve(0.0);
let button = doc.query_selector("button").unwrap().unwrap();
let bg = doc.resolved_style_value(button, "background-color");
```

This runs with no window and no GPU.

## What does not work yet

Blitz gaps that cascivo CSS meets: `@container` never matches, `:focus-visible` never matches,
CSS `fill`/`stroke` on SVG is ignored, no `<select>`, `<dialog>`, `<progress>`, and no scripts
(`table … sort` does nothing). Only `:has()` is fixed by this crate.

## Links

- Crate: [crates/cascivo-blitz](../crates/cascivo-blitz)
- Blitz: <https://github.com/DioxusLabs/blitz>
