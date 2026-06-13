# Performance Bench Methodology

This document diagnoses the current state of the per-component incremental bundle matrix
before any fixes land (T3-T2 and later). Read `apps/bench/METHODOLOGY.md` for the overall
benchmark methodology; this doc focuses specifically on the incremental matrix and the two
known defects that corrupt its output.

## What the metric measures

Source: `apps/bench/runner/src/bundle.ts`, `measureDist()` and `measureApps()`.

The runner builds each matrix entry as a standalone Vite production app and measures:

- Every `.js` file in `dist/`: read raw bytes, then `gzipSync(bytes, { level: 6 })`.
- Every `.css` file in `dist/`: same.
- `totalGzKb = jsGzKb + cssGzKb` (sum of individually-gzipped files, converted to KB).

Because Vite production builds minify by default (Rolldown built-in minifier), the pipeline
is **minify-then-gzip at level 6** — the standard "min+gzip" metric used across the industry.

**Incremental cost formula:**

```
incrementalGzKb = round((totalGzKb_component - totalGzKb_baseline) * 100) / 100
```

This is meant to answer: "how many bytes does importing this one component add to an
otherwise empty app?" The correctness of the number depends entirely on the baseline being
a realistic zero-cost anchor for each library.

## Finding 1: shadcn tabs = 0 — stub entry

**File:** `apps/bench/app-shadcn/src/matrix/tabs.tsx`

The tabs matrix entry for shadcn renders raw HTML without importing the actual component:

```tsx
import { createRoot } from 'react-dom/client'
import '../index.css'
createRoot(document.getElementById('root')!).render(
  <div role="tablist">
    <button role="tab">A</button>
  </div>,
)
```

No `@radix-ui/react-tabs` import. No shadcn tabs component. The bundle produced by this
entry is structurally identical to the baseline entry (same CSS via `index.css`, same React
runtime). As a result:

- `totalGzKb_tabs ≈ totalGzKb_baseline`
- `incrementalGzKb` rounds to `0`

This is not an accurate measurement of shadcn's Tabs cost. It is a stub that was never
replaced with a real component import.

**By contrast**, the cascade tabs entry (`apps/bench/app-cascade/src/matrix/tabs.tsx`)
correctly imports `{ Tabs, TabsList, TabsTrigger, TabsContent }` from `@cascade-ui/react`,
and carbon's tabs entry imports `{ Tab, Tabs, TabList, TabPanels, TabPanel }` from
`@carbon/react`. Only shadcn is a stub.

## Finding 2: cascade per-component inflation — missing runtime in baseline

**File:** `apps/bench/app-cascade/src/matrix/baseline.tsx`

The cascade baseline entry is:

```tsx
import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
createRoot(document.getElementById('root')!).render(<div>baseline</div>)
```

It imports only the theme CSS. It does not import `@cascade-ui/core` (the micro-FSM +
Preact Signals runtime) or `@cascade-ui/i18n` (the signal-driven locale store). These are
one-time shared dependencies that every cascade component transitively pulls in.

**Effect:** The first cascade component that appears in any matrix entry (e.g., `button`)
absorbs the full `@cascade-ui/core` + `@cascade-ui/i18n` runtime cost in its incremental
number. Subsequent components that already share this transitive bundle see artificially
lower incremental costs if they are measured in isolation (each matrix entry is its own
build, so each component entry independently absorbs the runtime again).

This inflates every cascade component's `incrementalGzKb` by the cost of the shared runtime
— potentially tens of KB — making cascade look more expensive per-component than it actually
is in a real app where the runtime is paid once across all components.

**By contrast**, shadcn's baseline (`apps/bench/app-shadcn/src/matrix/baseline.tsx`)
imports `index.css` which includes the Tailwind v4 stylesheet — a genuine shared cost that
every shadcn component depends on. Carbon's baseline
(`apps/bench/app-carbon/src/matrix/baseline.tsx`) imports `index.scss` which pulls in the
Carbon styles. Both shadcn and carbon correctly pre-load their shared runtime/style
dependencies in the baseline.

## Per-lib baseline composition (current state — before fix)

| Library | What baseline imports | What is missing |
|---------|----------------------|-----------------|
| cascade | `@cascade-ui/themes/light` (CSS only) | `@cascade-ui/core`, `@cascade-ui/i18n` |
| shadcn  | `index.css` (Tailwind v4 via `@import "tailwindcss"`) | nothing (correct) |
| carbon  | `index.scss` (Carbon styles via `@use '@carbon/react'`) | nothing (correct) |

## Planned fix (T3-T2)

T3-T2 will correct both defects:

1. **Fix cascade baseline** — add explicit imports of `@cascade-ui/core` and `@cascade-ui/i18n`
   to `apps/bench/app-cascade/src/matrix/baseline.tsx` so the shared runtime is amortized
   into the baseline, not charged to each component.

2. **Fix shadcn tabs stub** — replace the raw HTML stub in
   `apps/bench/app-shadcn/src/matrix/tabs.tsx` with a real import of the shadcn Tabs
   component (via `@radix-ui/react-tabs` or the vendored shadcn component).

3. **Add standalone + amortized lenses** (T3-T3) — the runner will report two views:
   - **Standalone**: current behavior — each entry is its own build, incremental = entry minus
     baseline. Useful for understanding first-component cost.
   - **Amortized**: cascade baseline pre-loads core + i18n; per-component cost reflects
     marginal cost in an app that already uses cascade. This is the fair cross-library
     comparison for multi-component apps.

## Per-lib baseline composition (after fix)

| Library | Baseline imports |
|---------|-----------------|
| cascade | `@cascade-ui/themes/light` + `@cascade-ui/core` + `@cascade-ui/i18n` |
| shadcn  | `index.css` (Tailwind v4) + `@radix-ui/react-slot` (shared dep present in all shadcn components) |
| carbon  | `index.scss` (full Carbon styles via `@use '@carbon/react'`) |
