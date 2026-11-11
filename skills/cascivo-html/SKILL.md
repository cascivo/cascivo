---
name: cascivo-html
description: Turn a page described in a tiny `.cv` text format into one static, branded, self-contained HTML file with the `cascivo-html` CLI. Use for reports, dashboards, landing pages and one-off documents that need no React or build step.
---

# cascivo-html

Write `.cv` text, validate it, render one `.html` file. Static output only: no forms, no runtime data.

## Steps

1. Read the guide: `cascivo-html guide` (syntax, brand keys, every component, three examples).
   Details for one component: `cascivo-html guide <name>`.
2. Write the page to `page.cv`.
3. Validate: `cascivo-html check page.cv`. Errors are `file:line:col: message` and show the expected
   signature or a did-you-mean; fix and re-run until it exits 0.
4. Render: `cascivo-html render page.cv -o page.html`. Pass `--brand brand.cv` to apply a reusable brand file.

If the binary is missing: `cargo install cascivo-html-cli` (or `cargo install --path crates/cascivo-html-cli` from the cascivo repo).
Full guide: <https://cascivo.com/docs/guides/using-cascivo-html>.

## Format in 10 lines

```cv
@title "Sales"
@brand #5b5bd6 r8 gap4 dark
cols 2
  card "Revenue"
    bar Q1:12 Q2:18 Q3:9
  card "Users"
    line 3 5 8 13
table Name,Age | Ann,31 | Bob,42
```

One node per line, two-space indent for children, `"quoted"` strings, `key=value` props, bare flags,
`3x node` to repeat. Only two-space indents (no tabs).

## Images and SVG

Give a file path or URL; the output stays one self-contained file.

```cv
image logo.png "Acme logo" w=64 h=64
svg icons/chart.svg "Revenue chart icon" w=48 fit=contain
svg "<svg viewBox='0 0 8 8'><circle cx='4' cy='4' r='3' fill='currentColor'/></svg>" "Dot"
```

- `image` embeds the file as a base64 data URI; `svg` inlines sanitized markup, so `currentColor`
  follows the theme. Pass alt text; an svg without it is hidden from assistive tech.
- Paths are relative to the `.cv` file (current directory for stdin). Other folders:
  `--assets <dir>` (repeatable). `..` and paths outside those roots are rejected.
- `https://` sources stay plain links unless you pass `--fetch` (then they are downloaded and
  embedded; 15 s timeout). `svg` needs a file, inline markup or `--fetch`.
- Assets over 2 MiB are refused; raise with `--max-asset <bytes>`.
- `render` fails with `file:line:col` when a file is missing, has an unknown type or an svg cannot be sanitized.

## Rules

- Never guess a component or prop name; run `guide <name>`.
- Brand files (`--brand`, `@brand-file`) are read only from the input file's directory.
- Same input gives byte-identical output, so diffs of the `.html` are meaningful.
