Cascade React + Next.js — minimal Next.js App Router example showing cascivo's prebuilt
[`@cascivo/react`](https://github.com/cascivo/cascivo/tree/main/packages/react) distribution
working with React Server Components.

What it demonstrates:

- **RSC compatibility** — `app/layout.tsx` and `app/page.tsx` are server components. cascivo
  components ship with `'use client'` preserved in the prebuilt dist, so importing them from a
  server component turns them into client references while the page markup stays server-rendered.
- **Client islands** — `app/toggle-demo.tsx` is the single `'use client'` boundary: a `Toggle`
  wired to a signal (`useSignal` + explicit `useSignals()` subscription, since Next.js applies no
  signals Babel transform).
- **CSS import placement** — `@cascivo/react/styles.css` (component structure) and
  `@cascivo/themes/all` (tokens + base typography + light & dark) are imported once in the
  server root layout; the theme is selected via `data-theme="light"` on `<html>`.

Run it (from the repo root):

```sh
pnpm install
pnpm exec vp run @cascivo/react#build   # the example consumes the prebuilt dist
pnpm exec vp run @cascivo/example-react-next#dev     # or #build / #start
```

Note: unlike the Vite examples (which alias package source), this app resolves `@cascivo/react`
through its `exports` map to `dist/` — build `@cascivo/react` first. CI runs the full workspace
build before building examples, so this ordering is automatic there.
