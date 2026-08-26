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

**Standalone cost:**

```
standaloneGzKb = totalGzKb_component
```

An alias for `totalGzKb`. Represents the full isolated build of that component and all its
transitive deps (including the runtime). No baseline subtraction. Useful to show the
first-use cost when no other components from the library are already loaded.

**Amortized cost formula (T3-T3+):**

```
amortizedGzKb = round(sum(incrementalGzKb for all N components) / N * 100) / 100
```

Computed after all components are measured for a given library. The same value is stored
on every cell for that library. Answers: "if you use all N components from this library,
what is the average marginal cost per component?" This normalises out first-component
runtime overhead and gives a fair cross-library comparison for multi-component apps.

**Near-zero note:**

When `|incrementalGzKb| < 0.05`, a `note` field is added to the cell explaining why the
cost is effectively zero. Two variants:

- `standaloneGzKb > 0`: the component has real standalone weight but the baseline already
  covers that shared runtime, so the marginal cost is ~0.
- `standaloneGzKb === 0`: no weight at all — the entry may be a stub or dead import.

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
correctly imports `{ Tabs, TabsList, TabsTrigger, TabsContent }` from `@cascivo/react`,
and carbon's tabs entry imports `{ Tab, Tabs, TabList, TabPanels, TabPanel }` from
`@carbon/react`. Only shadcn is a stub.

## Finding 2: cascade per-component inflation — missing runtime in baseline

**File:** `apps/bench/app-cascade/src/matrix/baseline.tsx`

The cascade baseline entry is:

```tsx
import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
createRoot(document.getElementById('root')!).render(<div>baseline</div>)
```

It imports only the theme CSS. It does not import `@cascivo/core` (the micro-FSM +
Preact Signals runtime) or `@cascivo/i18n` (the signal-driven locale store). These are
one-time shared dependencies that every cascade component transitively pulls in.

**Effect:** The first cascade component that appears in any matrix entry (e.g., `button`)
absorbs the full `@cascivo/core` + `@cascivo/i18n` runtime cost in its incremental
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

| Library | What baseline imports                                   | What is missing                  |
| ------- | ------------------------------------------------------- | -------------------------------- |
| cascade | `@cascivo/themes/light` (CSS only)                      | `@cascivo/core`, `@cascivo/i18n` |
| shadcn  | `index.css` (Tailwind v4 via `@import "tailwindcss"`)   | nothing (correct)                |
| carbon  | `index.scss` (Carbon styles via `@use '@carbon/react'`) | nothing (correct)                |

## Planned fix (T3-T2)

T3-T2 will correct both defects:

1. **Fix cascade baseline** — add explicit imports of `@cascivo/core` and `@cascivo/i18n`
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

| Library | Baseline imports                                                                                   | Notes                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| cascade | `@cascivo/themes/light` + `useSignals` from `@cascivo/core` + `currentLocale` from `@cascivo/i18n` | Named imports force the runtime into the baseline bundle without tree-shaking them away   |
| shadcn  | `index.css` (Tailwind v4 via `@import "tailwindcss"`)                                              | Unchanged — already correct; `@radix-ui/react-slot` is pulled in by individual components |
| carbon  | `index.scss` (Carbon styles via `@use '@carbon/react'`)                                            | Unchanged — already correct                                                               |

The shadcn tabs matrix entry now imports from a real shadcn-style `Tabs` component backed by `@radix-ui/react-tabs` (added as an explicit dep in `apps/bench/app-shadcn/package.json`). The vendored component lives at `apps/bench/app-shadcn/src/components/ui/tabs.tsx`.

## 2026-08-26 correction — the cascade preload is removed again

The T3-T2 fix above did not do what it claims, and the version of it that shipped produced
numbers that cannot be published.

**What actually happened.** Rolldown elides a `void`-ed named import, so
`import { useSignals } from '@cascivo/core'; void useSignals` put **nothing** of
`@cascivo/core` in the baseline. `currentLocale` survived only because `@cascivo/i18n`
creates its store at module scope — a side effect the bundler must keep. The baseline
therefore carried 6.45KB gz of i18n and no core at all. Every cascade incremental was
understated by that 6.45KB, and `badge`, `input`, `checkbox`, `select` and `tabs` — which
import no i18n — came out **negative**: the table said adding Badge to your app makes the
bundle 5.62KB smaller.

**Why the answer is not "preload harder".** Retaining core as well only enlarges the
baseline, and Badge (0.83KB gz over an empty app, CSS and markup, no runtime) drops further
below it. A baseline is a valid anchor only when it is a subset of every entry measured
against it, and no non-trivial runtime is a subset of every component in this catalog.

**What the baseline is now.** App shell plus the library's own stylesheet — the same shape
shadcn and carbon have always had, and the one this document's own definition asks for
("how many bytes does importing this one component add to an otherwise empty app?"). The
multi-component question the preload was reaching for is what `amortizedGzKb` answers, and
that column needs no baseline surgery to be correct.

**Effect on the published table.** Every cascade incremental rose by exactly 6.45KB
(button 1.99 → 8.02, table 5.42 → 14.46, badge 1.67 → 0.83 — badge falls because it was
never paying for i18n in the first place). The comparison is now like for like: cascade
amortizes to 5.97KB per component against shadcn's 11.79KB and carbon's 23.50KB.
