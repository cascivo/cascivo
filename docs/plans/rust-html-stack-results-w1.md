# W1 parity harness: results

## What exists
A React-vs-Rust conformance harness already existed (`packages/components/test/html-conformance*`,
207 exact-match cases against `crates/cascivo-html/tests/conformance/*.html`). W1 builds on it
rather than adding a second one:

- `test/html-conformance.parity.test.tsx` + `test/html-conformance/parity.ts`: for the 10 target
  components, every React `renderToStaticMarkup` fixture is flattened into path-addressed facts
  (element tree, `role`, `aria-*`, `data-*`, class contract, other attrs) and diffed against the
  Rust snapshot. Normalisation reuses `normalize.ts` (whitespace, attr order, `cv-<unit>-` class
  prefix, generated ids). Unlisted drift fails; stale allowlist entries fail; a mutation test
  proves role/aria/data/class drift is detected.
- `test/html-conformance/parity-allowlist.json`: justified differences (tabs only, one reason per facet).
- New `tabs` fixture (`tabs.cv`/`tabs.html` + `tabs.case.tsx`); the old exact-match test skips it.
- Wired into the `html-conformance` project of `@cascivo/components#test`, so `pnpm ready`
  (`vp run -r test`) runs it. CI-enforced with no new job.

## Rust invocation: snapshots, not a binary
The test reads the committed Rust `.html` snapshots. `cargo test` (`conformance.rs`) fails if a
snapshot differs from the real renderer, so the chain React == snapshot == Rust is enforced
without Vitest needing cargo (CI's JS job has no Rust toolchain; no build-time coupling).

## Measured drift (React SSR vs Rust)
| Component | Cases | Drift facts | Unjustified |
|---|---|---|---|
| button | 6 | 0 | 0 |
| badge | 7 | 0 | 0 |
| card | 6 | 0 | 0 |
| alert | 9 | 0 | 0 |
| avatar | 7 | 0 | 0 |
| separator | 4 | 0 | 0 |
| progress-bar | 11 | 0 | 0 |
| breadcrumb | 5 | 0 | 0 |
| stat | 6 | 0 | 0 |
| tabs | 1 | 62 | 0 (allowlisted, by design) |

Tabs: Rust is CSS-only (radio input + label + `role=group` panel); React is a JS button
`tablist` with `role=tab/tabpanel`, `aria-selected`, roving tabindex. Not a bug: it is the
Rust-side no-JS design, but the two do not share markup, so a future `@cascivo/elements`
tabs must pick one contract.

## Kill criterion 1 (markup drift)
PASS for 9/10 components: zero drift across 61 fixtures. Tabs is the one measured structural
divergence (62 facts), justified and gated. `progress` maps to the `progress-bar` component.

## Gates
`@cascivo/components#test` 2203 passed; `cargo test -p cascivo-html`, clippy `-D warnings` and
`cargo fmt --check` clean. 5 pre-existing oxlint unused-import warnings in `card*.case.tsx`
(untouched). Full `pnpm ready` not run end to end here.
