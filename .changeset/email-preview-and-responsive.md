---
'@cascivo/email-preview': minor
'@cascivo/email': minor
'cascivo': minor
'@cascivo/docs': patch
'@cascivo/docspack': patch
---

Email: a publishable preview, responsive layout primitives, and `cascivo email lint`

Reported by the weeklyfoo newsletter after migrating four templates.

- **`@cascivo/email-preview` is published, with a bin.** `npx @cascivo/email-preview ./emails`
  serves a directory of templates — default export rendered, optional `subject` and
  `previewProps` named exports, hot reload through Vite. The recipe used to document
  `pnpm --filter @cascivo/email-preview dev`, which is a workspace filter and worked only
  inside this monorepo; everyone else got "No projects matched the filters" and wrote their
  own preview server. The package moves from `apps/` to `packages/` so it reaches the drift
  feed and the packaging gates like every other published package.
- **`Container` is responsive by default** and **`Column` takes `stack`.** A 600px table
  will not lay out below its contents' min-content width, so `max-width: 100%` never
  prevented the sideways scroll every mobile reader was getting. Measured at 320px: 280px of
  overflow before, none after. Both halves are needed — a fluid container does nothing for a
  `Row` until its columns stack, which is why `stack` exists rather than being implied.
- **`className` on the layout primitives, and a `Style` primitive.** A media query needs
  something to select and somewhere to live; `Style` blocks are hoisted into `<head>` and
  deduplicated. This replaces the `[style*='--flag']` attribute-selector workaround an
  adopter had to invent, which is worse supported than a plain class.
- **`Button` no longer defaults `align` to `'left'`.** A button is its own table carrying its
  own `align`, so that default beat the `align` of any `Column` around it and
  `<Column align="right"><Button/></Column>` rendered hard left. With no attribute emitted it
  follows the cell, verified in a browser.
- **`cascivo email lint <file...>`** runs the conformance check on rendered HTML, fetching
  and caching the Can I email matrix so every adopter stops writing the same twelve lines.
  Reads stdin with `-`, takes a local matrix with `--data`, exits non-zero only on a blocked
  finding.
- A Playwright suite now asserts no shipped template scrolls sideways at 320/360/390/414,
  with a negative control proving the rule is what prevents it. Nothing caught this class of
  bug before: the conformance lint reads CSS feature support, not layout.
- `@cascivo/docs` and `@cascivo/docspack` carry the rewritten email recipe — the preview
  command that now works outside this repo, the responsive rules, and `simulate()`, which
  was exported and useful but documented nowhere outside the `.d.ts`.
