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

If the binary is missing: `cargo install --path crates/cascivo-html-cli` from the cascivo repo.

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

## Rules

- Never guess a component or prop name; run `guide <name>`.
- Brand files (`--brand`, `@brand-file`) are read only from the input file's directory.
- Same input gives byte-identical output, so diffs of the `.html` are meaningful.
