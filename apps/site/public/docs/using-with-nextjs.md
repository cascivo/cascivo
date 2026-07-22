<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-with-nextjs.md
  registry v0.10.0 · generated 2026-07-22
-->

# Using cascivo with Next.js (App Router / RSC)

cascivo works in Next.js App Router projects out of the box: components ship
with `'use client'` **preserved in the published bundle**, so React Server
Components treat them as client components without any wrapper on your side.
This page covers the wiring and how the server/client split falls out.

Prerequisite reading: [GETTING-STARTED.md](/docs/getting-started.md) for the two
install paths. Everything below applies to both; snippets use the prebuilt
`@cascivo/react` package.

## Install

```sh
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

## Import the themes CSS in the root layout

Do this once, in a **Server Component** — `app/layout.tsx` is the natural place.
Next.js supports global CSS imports in Server Components, and this keeps the
theme out of every client bundle:

```tsx
// app/layout.tsx — a Server Component (no 'use client')
import '@cascivo/themes/all.css' // tokens (once) + base typography + light & dark

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  )
}
```

`data-theme` on `<html>` themes the whole app; it can also scope any subtree
(`<aside data-theme="dark">`). See [THEMING.md](/docs/theming.md).

## Theme switching without a flash (SSR)

The static `data-theme="light"` above is a fine default. For a user-toggleable theme
that survives reload with **no flash of the wrong theme**, use the theme runtime from
`@cascivo/react`: inline `themePreloadScript()` in the root layout so the persisted theme
paints on the first byte, then toggle from a client component with `useTheme()`.

```tsx
// app/layout.tsx — Server Component. The pre-paint script sets data-theme before the
// app bundle runs, so there is no flash; the client then owns toggling.
import '@cascivo/themes/all.css'
import { themePreloadScript } from '@cascivo/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themePreloadScript() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Wrap your client tree in `<ThemeProvider>` and toggle with `useTheme()` (a `'use client'`
component). Full API in [THEMING.md](/docs/theming.md#switching-themes-at-runtime).

## Component CSS is bundled automatically

Each component pulls in its own stylesheet when you import it — Next.js
(webpack or Turbopack) includes the styles only for the components you actually
use and tree-shakes the rest. There is **no** component-CSS import to add or
maintain; the themes import above is the only global CSS wiring.

## How the server/client split works

- **Every cascivo component is a client component.** Interactivity is driven by
  Preact signals, which run in the browser; `'use client'` is preserved in the
  `@cascivo/react` bundle, so each component import creates its own client
  boundary automatically.
- **You can render them directly from Server Components.** A Server Component
  page can emit `<Button>` or `<Card>` in its JSX; Next.js serializes the props
  across the boundary. Server-rendered HTML is produced as usual, then the
  component hydrates on the client.
- **Props crossing the boundary must be serializable.** Passing `children` and
  plain data is fine; passing event handlers (`onClick`, `onChange`) from a
  Server Component is not — Next.js will error. Put interactive composition
  (handlers, signals, form state) inside your own `'use client'` file:

```tsx
// app/page.tsx — Server Component: static composition is fine
import { Card, CardContent, Badge } from '@cascivo/react'
import { SaveButton } from './save-button'

export default function Page() {
  return (
    <Card>
      <CardContent>
        <Badge>Beta</Badge>
        <SaveButton />
      </CardContent>
    </Card>
  )
}
```

```tsx
// app/save-button.tsx — your client boundary for interactivity
'use client'
import { Button } from '@cascivo/react'

export function SaveButton() {
  return <Button onClick={() => save()}>Save</Button>
}
```

If your own client component reads a signal's `.value` during render, call
`useSignals()` (from `@cascivo/core`) as its first statement — see the gotcha in
[TESTING.md](https://github.com/cascivo/cascivo/blob/main/docs/TESTING.md#the-usesignals-gotcha) and
[TROUBLESHOOTING.md](/docs/troubleshooting.md).

## Copy-paste flow in Next.js

`npx cascivo init` + `npx cascivo add <component>` work the same in a Next.js
repo: source is copied to `outputDir` (default `src/components/ui`) with
`'use client'` already in the source files. Import from there instead of
`@cascivo/react`; the theming and boundary rules above are identical.

## Naming collisions with Next.js globals

Two cascivo exports shadow Next.js modules — alias them on import:

```tsx
import { Image as CascivoImage, Link as CascivoLink } from '@cascivo/react'
```

Editor auto-import sometimes picks the wrong `Image`/`Link`; if styles or
routing break after adding one, check the import resolves where you meant. Full
list in the [`@cascivo/react` README](https://github.com/cascivo/cascivo/blob/main/packages/react/README.md#gotchas--naming-collisions).

## FAQ

**Can I use cascivo with React Server Components at all, given it's
signal-driven?** Yes. Components are RSC-compatible and mark themselves
`'use client'` where they need interactivity — the signals runtime only ever
executes in the browser. Server Components compose them freely as long as the
props they pass are serializable.

**Where's a working example?** [`apps/examples/react-next`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-next)
is the Next.js App Router example in this repo, demonstrating `'use client'`
boundary placement for signal-driven components.

## See also

- [COMPATIBILITY.md](/docs/compatibility.md) — framework and browser matrix.
- [GETTING-STARTED.md](/docs/getting-started.md) — install paths and the theme wiring.
- [CSS-LAYERS-PITFALL.md](https://github.com/cascivo/cascivo/blob/main/docs/CSS-LAYERS-PITFALL.md) — before adding a global reset
  to `globals.css`.
