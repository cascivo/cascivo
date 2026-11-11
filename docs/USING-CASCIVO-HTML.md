# Static HTML with cascivo-html

`cascivo-html` turns a short text file (`.cv`) into **one HTML file** styled by the real cascivo
CSS. Use it for reports, dashboards, landing pages and one-off documents. It needs no React, no
build step and no JavaScript runtime. An agent writes the `.cv` text, the tool checks it and
renders it.

It is a Rust library plus a command-line tool. The library has no dependencies. The same input always gives the same bytes.

## When to use it

| You want | Use |
| -------- | --- |
| A running React app | `@cascivo/react` or `npx cascivo add` ([GETTING-STARTED.md](GETTING-STARTED.md)) |
| An agent-built page from JSON | `@cascivo/render` with a `ViewConfig` |
| One static HTML file (report, dashboard, landing page, document) | `cascivo-html` |
| A UI as Markdown for an agent to read | `@cascivo/text` ([MACHINE-MODE.md](MACHINE-MODE.md)) |

Static output only: no forms, no live data, no event handlers you write yourself.

## Install

```sh
cargo install cascivo-html-cli   # installs the `cascivo-html` binary
cargo add cascivo-html           # the library, for Rust programs
```

The `fetch` cargo feature (default on) lets the CLI download `http(s)` images. Turn it off with
`--no-default-features` if you do not want network code in the binary.

## The `.cv` format

One node per line. A child is indented by two spaces. Use spaces only; tabs are an error.

```cv
@title "Sales"
@brand #5b5bd6 r8 gap4 dark
page-header "Sales" "Q3 overview"
cols 3
  stat Revenue "$48k" "+12%"
  stat Users 1204
  stat Churn "2.1%"
card "Trend"
  line 3 5 8 13 9 14
```

- A string is a bare word, or `"text in quotes"`. A trailing quoted string is the node's text.
- A prop is `key=value` (`gap=4`, `variant=primary`). A bare word that is an enum value or a
  boolean prop name is a flag: `button Save primary`.
- Chart and table data is written inline: `bar Q1:12 Q2:18`, `line 3 5 8`,
  `table Name,Age | Ann,31 | Bob,42` (the first row is the header; props go before the rows).
- `3x card "x"` repeats a node. A line that starts with `#` is a comment.
- Aliases: `cols` = `columns`, `row` and `col` = `flex`, `h1` to `h3` = `heading`, `p` = `text`.

The format has 51 elements: layout, display, feedback, navigation and seven SVG charts (`bar`,
`line`, `area`, `pie`, `scatter`, `spark`, `gauge`). Do not guess names or props. Run
`cascivo-html guide` for the list and `cascivo-html guide <name>` for every prop of one component.

## Brand a page

`@brand` sets the look in one line. Every key is optional.

| Key | Meaning |
| --- | ------- |
| `#hex` | primary color |
| `accent=#hex` | accent color |
| `theme=<name>` | one of the twelve cascivo themes |
| `light`, `dark`, `auto` | color mode |
| `r8` | corner radius in px |
| `gap4` | default space step |
| `density=compact\|normal\|comfy` | spacing density |
| `font=Inter`, `mono=…` | font families |

For a reusable brand, put the same keys in a file, one per line, and use `@brand-file brand.cv`
in the page or `--brand brand.cv` on the command line. Brand files are read only from the input
file's folder.

## Images and SVG

```cv
image logo.png "Acme logo" w=64 h=64
svg icons/chart.svg "Revenue chart icon" w=48 fit=contain
svg "<svg viewBox='0 0 8 8'><circle cx='4' cy='4' r='3' fill='currentColor'/></svg>" "Dot"
```

- `image` embeds the file as a base64 `data:` URI. `svg` puts sanitized markup in the page, so
  `currentColor` follows the theme. The sanitizer rejects `<script>`, `<foreignObject>`, `on*`
  handlers, external `href`s, `@import`, DOCTYPE and entities.
- Paths are relative to the `.cv` file (the current folder for stdin). Add more folders with
  `--assets <dir>` (repeatable). `..` and paths outside those folders are refused.
- `http(s)` sources stay plain links. Pass `--fetch` to download and embed them.
- A file larger than 2 MiB is refused. Change the limit with `--max-asset <bytes>`.
- Give alt text. An `svg` with no alt text is hidden from assistive technology.

## The CLI

```sh
cascivo-html guide [component]                 # the agent cheat sheet, or one component
cascivo-html check [in.cv|-] [--brand f]       # validate only
cascivo-html render [in.cv|-] [-o out.html] [--brand f] [--assets dir] [--fetch] [--max-asset n]
```

`-` or no input reads stdin. Without `-o`, the HTML goes to stdout. Exit codes: `0` ok, `1`
invalid `.cv`, `2` usage or I/O error. Errors are `file:line:col: message` with the expected
signature or a did-you-mean.

The loop for an agent: read `guide`, write `page.cv`, run `check` until it exits `0`, then
`render page.cv -o page.html`. The skill [`cascivo-html`](../skills/cascivo-html/SKILL.md) wraps
this loop.

## The library

```rust
use cascivo_html::{render, Options};

let html = render("card \"Hi\"\n", &Options::default())?;
```

- `render`, `parse`, `check`, and `GUIDE` / `guide_for(name)` for the cheat sheet text.
- The library does no file I/O. Give it files through `Options::assets` (a list of
  `(path, bytes)`), `Options::asset_resolver` and `Options::brand_resolver`. The CLI does this for you.
- `Options::max_asset_bytes` sets the size limit; `Options::embed_urls` sends `http(s)` sources to
  your resolver.

Full API: [docs.rs/cascivo-html](https://docs.rs/cascivo-html).

## Links

- Crate: [crates.io/crates/cascivo-html](https://crates.io/crates/cascivo-html) and
  [crates.io/crates/cascivo-html-cli](https://crates.io/crates/cascivo-html-cli)
- Source and examples: [`crates/cascivo-html`](https://github.com/cascivo/cascivo/tree/main/crates/cascivo-html)
- Releasing (changesets for crates): [RELEASING.md](RELEASING.md)
