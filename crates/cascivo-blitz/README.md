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

## API

- `document_from_cv(src, &Options) -> Result<HtmlDocument, Error>`: build a Blitz document. Headless.
- `launch_cv(src, Options) -> Result<(), Error>` (feature `window`): open a window, block until it closes.
- `html_from_cv(src, &Options) -> Result<String, Error>`: the HTML Blitz is given.
- `enable_prefs()`: turn on the Stylo prefs cascivo needs. The other functions call it.
- `Options { theme, color_scheme, viewport, html }`. `theme: None` follows the file's `@brand`.

## Features

| Feature | Default | What |
| ------- | ------- | ---- |
| `window` | yes | winit shell and Vello GPU renderer for `launch_cv`. |

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

## Known gaps in Blitz

Not fixed by this crate yet: `@container` never matches, `:focus-visible` never matches, SVG
`fill`/`stroke` from CSS is ignored, no `<select>`, `<dialog>` or `<progress>`, and no scripts.
Remote images are not fetched (`.cv` images are `data:` URIs by default).

## Links

- Guide: [docs/USING-CASCIVO-BLITZ.md](../../docs/USING-CASCIVO-BLITZ.md)
- `.cv` format: [cascivo-html](../cascivo-html)
