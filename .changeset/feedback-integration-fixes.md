---
'@cascivo/tokens': minor
'@cascivo/react': minor
'@cascivo/themes': patch
---

Integration-feedback fixes (from the bpmn-kit and pagome migrations):

- **tokens:** `@function` helpers (`--cascivo-step`/`--cascivo-scale`) are no longer
  auto-imported from the main token CSS — they are now opt-in via the new
  `@cascivo/tokens/functions.css` export. This removes the `@import must precede all
other statements` warning and the lightningcss / Tailwind v4 `Unknown at rule:
@function` break for every consumer. Every call site already ships a static
  fallback, so default output is unchanged. Also adds the missing
  `--cascivo-text-4xl` (+ `-fluid`) type-scale token.
- **react:** `Button` now supports `asChild` (render button styling on a real
  `<a href>`); `Sheet`'s `title` is now optional and `ReactNode`-typed (labels the
  dialog via `aria-labelledby`). Adds the conventional `"./package.json"` export.
- **themes:** tightens the `@cascivo/tokens` peer-dependency range to `>=0.2.0`.
