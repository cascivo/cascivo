# v28 — Theme Configurator (`/create`) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully client-side theme configurator at `/create` on the landing: three-panel
layout (controls → live preview → code output), URL-hash state persistence, 10 built-in presets,
and one-click CSS copy/download.

**Architecture:** All work inside `apps/landing`. No new `@cascivo/*` packages. Signal store
(`store.ts`) holds `ThemeConfig`; pure function `configToCSS()` derives the CSS block; a
`<style data-cascivo-create>` element scoped to `[data-theme="create-custom"]` updates the preview
in real time. URL hash encodes the full config so every state is shareable. Layout uses CSS Grid
(`@container`-driven) — three columns on `lg+`, stacked on mobile.

**Tech Stack:** `@cascivo/core` (useSignal, useComputed, useSignals, useSignalEffect), React 18,
`@cascivo/react` (Button, Input, Checkbox, Toggle, Card, Badge, Alert, Select, Tabs, Tooltip),
`navigator.clipboard`, `URL.createObjectURL`, `history.replaceState`, CSS Grid + `@container`.

---

## Tranche Overview

| Tranche | Title                 | Goal                                                                     |
| ------- | --------------------- | ------------------------------------------------------------------------ |
| T1      | Route + page scaffold | Add `/create` route, nav link, SEO head, skeleton layout                 |
| T2      | Store + CSS generator | ThemeConfig signal, configToCSS, URL hash encode/decode, 10 presets      |
| T3      | Control panel         | Preset tiles, mode toggle, hue/chroma/radius sliders, font Select, reset |
| T4      | Preview panel         | `<style>` injection, cascivo component showcase, live CSS updates        |
| T5      | Code output panel     | CSS tab + copy/download, Usage tab, share link button                    |
| T6      | Gate                  | Full CI gate                                                             |

---

## Files Created / Modified per Tranche

### T1 — Route + scaffold

| Action | Path                                    |
| ------ | --------------------------------------- |
| Create | `apps/landing/src/pages/CreatePage.tsx` |
| Modify | `apps/landing/src/App.tsx`              |
| Modify | `apps/landing/src/sections/Header.tsx`  |
| Modify | `apps/landing/src/route-head.ts`        |

### T2 — Store + CSS generator

| Action | Path                                              |
| ------ | ------------------------------------------------- |
| Create | `apps/landing/src/pages/create/store.ts`          |
| Create | `apps/landing/src/pages/create/css-gen.ts`        |
| Create | `apps/landing/src/pages/create/url-state.ts`      |
| Create | `apps/landing/src/pages/create/presets.ts`        |
| Create | `apps/landing/src/pages/create/store.test.ts`     |
| Create | `apps/landing/src/pages/create/css-gen.test.ts`   |
| Create | `apps/landing/src/pages/create/url-state.test.ts` |

### T3 — Control panel

| Action | Path                                                          |
| ------ | ------------------------------------------------------------- |
| Create | `apps/landing/src/pages/create/ControlPanel.tsx`              |
| Modify | `apps/landing/src/pages/create/create.css` (create if absent) |

### T4 — Preview panel

| Action | Path                                                     |
| ------ | -------------------------------------------------------- |
| Create | `apps/landing/src/pages/create/PreviewPanel.tsx`         |
| Modify | `apps/landing/src/pages/create/create.css`               |
| Modify | `apps/landing/src/pages/CreatePage.tsx` (wire up panels) |

### T5 — Code output panel

| Action | Path                                                     |
| ------ | -------------------------------------------------------- |
| Create | `apps/landing/src/pages/create/CodePanel.tsx`            |
| Modify | `apps/landing/src/pages/create/create.css`               |
| Modify | `apps/landing/src/pages/CreatePage.tsx` (wire CodePanel) |

### T6 — Gate

No new files. Runs CI commands only.

---

## Key Interfaces (shared across tranches)

### `ThemeConfig` (defined in `store.ts`)

```ts
export type FontFamily = 'system' | 'geometric' | 'humanist' | 'transitional' | 'mono'

export type ThemeConfig = {
  baseMode: 'light' | 'dark'
  accentHue: number // 0–360
  accentChroma: number // 0.05–0.3
  radiusBase: number // rem: 0 | 0.25 | 0.375 | 0.5 | 0.75 | 1.5
  fontFamily: FontFamily
  presetId: string | null // name of last applied preset, or null
}

export const DEFAULT_CONFIG: ThemeConfig = {
  baseMode: 'light',
  accentHue: 250,
  accentChroma: 0.2,
  radiusBase: 0.375,
  fontFamily: 'system',
  presetId: 'light',
}
```

### `Preset` (defined in `presets.ts`)

```ts
export type Preset = {
  id: string // unique key, matches theme name
  label: string // display name
  swatchBg: string // CSS colour string for the preset tile background swatch
  swatchAccent: string // CSS colour string for the preset tile accent swatch
  config: ThemeConfig
}
```

### `configToCSS` signature (defined in `css-gen.ts`)

```ts
export function configToCSS(config: ThemeConfig): string
// Returns a complete `@layer cascade.theme { [data-theme="create-custom"] { ... } }` block.
// No side effects. Pure function.
```

### URL hash contract (defined in `url-state.ts`)

```ts
export function configToHash(config: ThemeConfig): string // returns base64url string
export function hashToConfig(hash: string): ThemeConfig | null // returns null on invalid/empty
```

---

## Architecture Notes

### CSS injection pattern (T4)

```ts
// Mount
const el = document.createElement('style')
el.dataset.cascivoCre = ''
document.head.appendChild(el)

// On config change (useSignalEffect)
el.textContent = configToCSS(config.value)

// Unmount (cleanup from useSignalEffect)
el.remove()
```

The `<style>` element is reused across signal updates — only `textContent` changes. No element
recreation per update. `data-cascivo-cre` is the attribute used so it can be queried
(`document.querySelector('[data-cascivo-cre]')`) without colliding with other `<style>` tags.

### URL hash debounce pattern (T2)

```ts
// In store.ts, outside the component
let debounceId = 0
export function updateHash(config: ThemeConfig) {
  clearTimeout(debounceId)
  debounceId = window.setTimeout(() => {
    history.replaceState(null, '', '#' + configToHash(config))
  }, 300)
}
```

Called from a `useSignalEffect` in `CreatePage.tsx` (not in `store.ts` directly, because
`useSignalEffect` must be called inside a component or custom hook).

### `configToCSS` token generation

The function constructs OKLCH values for the accent family by inserting `accentHue` and
`accentChroma` into a fixed lightness/chroma template that mirrors the approach in
`packages/themes/src/light.css`. Example:

```ts
const acc = (l: number, c: number = config.accentChroma) =>
  `oklch(${l} ${c.toFixed(3)} ${config.accentHue})`

lines.push(`  --cascivo-color-accent: ${acc(lightMode ? 0.52 : 0.65)};`)
lines.push(`  --cascivo-color-accent-hover: ${acc(lightMode ? 0.45 : 0.707)};`)
// etc.
```

Radius tokens are generated via explicit `calc()` strings matching the existing theme pattern:

```ts
lines.push(`  --cascivo-radius-base: ${config.radiusBase}rem;`)
lines.push(`  --cascivo-radius-surface: calc(var(--cascivo-radius-base) * 1.66);`)
lines.push(`  --cascivo-radius-indicator: calc(var(--cascivo-radius-base) / 2);`)
// etc.
```

### `data-theme` scoping in the preview

The preview root div carries `data-theme="create-custom"`. The CSS generated by `configToCSS`
targets `[data-theme="create-custom"]`. The page's own `data-theme` attribute lives on
`document.documentElement` and is managed by `theme.ts` — it does not affect the preview
because the generated CSS is a more-specific selector.

---

## Tranche Cross-References

- T2 (`store.ts`) defines `ThemeConfig`, `config` signal, `DEFAULT_CONFIG` — imported by T3, T4, T5.
- T2 (`css-gen.ts`) defines `configToCSS` — imported by T4 (style injection), T5 (code display).
- T2 (`url-state.ts`) defines `configToHash` / `hashToConfig` — called in T4 (`CreatePage.tsx`).
- T2 (`presets.ts`) defines `PRESETS` array — imported by T3 (preset tiles).
- T3 (`ControlPanel.tsx`) writes to `config.value` — T4 reacts via `useSignalEffect`.
- T4 (`PreviewPanel.tsx`) reads `config.value` via `useSignals()` (no direct signal read in render,
  only inside `useSignalEffect` for the `<style>` update).
- T5 (`CodePanel.tsx`) reads `config.value` via `useSignals()` to render the generated CSS string.

---

## Definition of Done (summary — full criteria in ROADMAP-V28.md)

- [ ] T1: `/create` loads, "Create" in nav, correct `<title>`.
- [ ] T2: `configToCSS` unit tests pass; round-trip hash test passes; 10 preset schema tests pass.
- [ ] T3: Controls render at 320 px; preset tiles update sliders; reset works.
- [ ] T4: `<style data-cascivo-cre>` injected on mount, removed on unmount; live update confirmed.
- [ ] T5: Copy CSS, Download, and Share buttons work; Usage tab content correct.
- [ ] T6: All six CI commands exit 0.
