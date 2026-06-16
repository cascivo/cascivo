# v27 — Landing Performance, Navbar Redesign & Search — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the landing from a full-reload MPA to an SPA (client-side routing with view
transitions), redesign the navbar (sticky, compact theme switcher, GitHub icon, scroll indicator),
introduce `@cascivo/search` (CMD+K search dialog), add a Modern CSS tech deep dive section to the
home page, and fix the two outstanding accessibility-page issues (brand name + table pagination).

**Architecture:** All changes span `apps/landing` and a new `packages/search` workspace package.
No changes to published library packages (`packages/components`, `packages/core`, etc.). The
landing uses `useSignal`/`useSignalEffect` throughout; the new router is a signal-driven intercept
layer. The search package is workspace-local only (not published to npm in this version).

**Tech Stack:** `@cascivo/core` (useSignal, useComputed, useSignals, useSignalEffect), React 18,
`history.pushState`, View Transitions API (`document.startViewTransition`), `@cascivo/components`
(Modal, Input, Kbd, Tooltip), trigram string index (pure JS, < 50 lines), CSS sticky + scroll
progress.

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                   |
| ------- | ---------------------------------- | ---------------------------------------------------------------------- |
| T1      | SPA client-side router             | Intercept anchor clicks; pushState; popstate; view transitions         |
| T2      | Sticky navbar + scroll indicator   | Sticky CSS; scroll progress bar; GitHub icon                           |
| T3      | Compact theme switcher             | Cycle icon button replaces header-themes dots; Tooltip                 |
| T4      | Quick search                       | `@cascivo/search` package + CMD+K dialog + landing index               |
| T5      | Modern CSS tech deep dive          | New `TechDeepDive` section on home page                                |
| T6      | A11y page: brand fix + pagination  | Fix "Cascade" × 4; pagination on A11yMatrix DataTable                  |
| T7      | Gate                               | Full CI gate                                                           |

---

## Files Created / Modified per Tranche

### T1 — SPA router

| Action | Path                                          |
| ------ | --------------------------------------------- |
| Create | `apps/landing/src/router.ts`                  |
| Modify | `apps/landing/src/App.tsx`                    |
| Modify | `apps/landing/src/sections/Header.tsx`        |

### T2 — Sticky navbar + scroll indicator

| Action | Path                                          |
| ------ | --------------------------------------------- |
| Modify | `apps/landing/src/landing.css`                |
| Modify | `apps/landing/src/sections/Header.tsx`        |

### T3 — Compact theme switcher

| Action | Path                                          |
| ------ | --------------------------------------------- |
| Modify | `apps/landing/src/sections/Header.tsx`        |
| Modify | `apps/landing/src/landing.css`                |

### T4 — Quick search

| Action | Path                                                        |
| ------ | ----------------------------------------------------------- |
| Create | `packages/search/src/index.ts` (SearchIndex + types)       |
| Create | `packages/search/src/SearchDialog.tsx`                      |
| Create | `packages/search/src/search.css`                            |
| Create | `packages/search/package.json`                              |
| Create | `apps/landing/src/search/index.ts` (index builder)          |
| Create | `apps/landing/src/search/SearchButton.tsx`                  |
| Modify | `apps/landing/src/sections/Header.tsx`                      |
| Modify | `apps/landing/src/App.tsx` (mount CMD+K listener globally)  |
| Modify | `apps/landing/vite.config.ts` (alias for packages/search)   |

### T5 — Tech deep dive

| Action | Path                                                      |
| ------ | --------------------------------------------------------- |
| Create | `apps/landing/src/sections/TechDeepDive.tsx`              |
| Modify | `apps/landing/src/App.tsx` (insert section)               |
| Modify | `apps/landing/src/landing.css`                            |

### T6 — A11y fixes

| Action | Path                                                                    |
| ------ | ----------------------------------------------------------------------- |
| Modify | `apps/landing/src/pages/accessibility/AccessibilityStatement.tsx`       |
| Modify | `apps/landing/src/pages/accessibility/AxeComparison.tsx`                |
| Modify | `apps/landing/src/pages/accessibility/A11yMatrix.tsx`                   |

### T7 — Gate

No file changes. Gate commands only.

---

## Dependency Graph

```
T1 (SPA router)        ──────────────────────────────────────────► T7 (gate)
T2 (sticky navbar)     ────────────────────────────────────────────► T7
T3 (theme switcher)    ─────────┐
                                ├─ both modify Header.tsx; do T3 after T2
T2 (sticky navbar)     ─────────┘
T4 (search)            ──────────────── depends on T1 (uses router for navigation)
T5 (tech deep dive)    ──────────────────────────────────────────► T7
T6 (a11y fixes)        ──────────────────────────────────────────► T7
```

T1 must land first (T4 depends on it for navigation). T2 and T3 both modify `Header.tsx` — do
T3 immediately after T2 in the same working session to avoid conflicts. T5 and T6 are fully
independent. T7 runs last.

Recommended order: T1 → T2 → T3 → T4 → T5 → T6 → T7.

---

## Key Technical Decisions

### SPA router (T1)

The router is 40–60 lines. It exports a `currentPath` signal and two functions:

```ts
// apps/landing/src/router.ts
import { signal } from '@preact/signals-react'

export const currentPath = signal(
  typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/+$/, '') || '/'
    : '/',
)

export function navigate(href: string) {
  const target = href.replace(/\/+$/, '') || '/'
  if (target === currentPath.value) return
  history.pushState(null, '', href)
  if ('startViewTransition' in document) {
    document.startViewTransition(() => { currentPath.value = target })
  } else {
    currentPath.value = target
  }
}

// Call once at app startup
export function initRouter() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a')
    if (!a || !a.href) return
    const url = new URL(a.href)
    if (url.origin !== location.origin) return     // external — allow
    if (a.target === '_blank') return              // new tab — allow
    if (a.download) return                         // download — allow
    e.preventDefault()
    navigate(url.pathname)
  })
  window.addEventListener('popstate', () => {
    currentPath.value = location.pathname.replace(/\/+$/, '') || '/'
  })
}
```

`App.tsx` changes `window.location.pathname` read to `currentPath.value`, calls `useSignals()`,
and calls `initRouter()` once (in a `useSignalEffect` that runs on mount only).

The `Header.tsx` NAV_LINKS click handler stays; its `onClick` calls `navigate()` explicitly for
the SPA links, eliminating the need for the interceptor on those specific elements.

### Sticky header + scroll progress (T2)

```css
/* landing.css — header sticky */
.shell-header {
  position: sticky;
  top: 0;
  z-index: var(--cascivo-z-overlay, 200);
  background: var(--cascivo-color-surface);
  /* Prevent bleed on scroll */
  border-block-end: 1px solid var(--cascivo-color-border);
}

/* Scroll progress bar sits below the sticky header */
.scroll-progress {
  position: sticky;
  top: var(--cascivo-shell-header-block-size, 3.5rem);
  z-index: 199;
  block-size: 2px;
  background: var(--cascivo-color-border);
  transform-origin: inline-start;
  will-change: transform;
}

.scroll-progress::after {
  content: '';
  display: block;
  block-size: 100%;
  background: var(--cascivo-color-accent);
  transform: scaleX(var(--scroll-ratio, 0));
  transform-origin: inline-start;
  transition: transform 50ms linear;
}
```

A `scrollRatio` signal reads `window.scrollY / (document.body.scrollHeight - innerHeight)` via
`useSignalEffect` with a passive scroll listener. The ratio is written to a CSS custom property
on `.scroll-progress` via `el.style.setProperty('--scroll-ratio', ratio)`, avoiding React
re-renders entirely.

The GitHub icon is an inline SVG (`<svg aria-hidden="true" viewBox="0 0 16 16">`) wrapped in
`<a href="…" aria-label="GitHub" …>`. The GitHub mark SVG path is the standard Octicons mark
(open source, MIT licensed, safe to embed inline without attribution).

### Compact theme switcher (T3)

The `header-themes` div is replaced with a single `<button>` element. The button's icon is one of
three SVGs (sun, moon, sun-with-rays-warm) determined by `theme.value`. Clicking increments the
index: `setTheme(THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length])`.

The `Tooltip` component wraps the button and shows `theme.value` (e.g., "dark") on hover. If
`@cascivo/components/tooltip` needs a `content` prop, use that.

```tsx
<Tooltip content={`Theme: ${theme.value}`}>
  <button
    type="button"
    className="header-theme-cycle"
    aria-label={`Switch theme (current: ${theme.value})`}
    onClick={() => cycleTheme()}
  >
    <ThemeIcon theme={theme.value} />
  </button>
</Tooltip>
```

### Search package design (T4)

`packages/search/src/index.ts` exports `SearchIndex`:

```ts
export interface SearchItem {
  id: string
  title: string
  section?: string
  description?: string
  href: string
  type: 'component' | 'page'
}

export class SearchIndex {
  private items: SearchItem[]
  constructor(items: SearchItem[]) { this.items = items }
  search(query: string): SearchItem[] {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return this.items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.section?.toLowerCase().includes(q)
    ).slice(0, 8)
  }
}
```

For v27, substring matching is sufficient (registry has < 30 components + < 20 page sections).
Trigram indexing can be added later without changing the public API.

`SearchDialog.tsx` is a controlled component:

```tsx
interface SearchDialogProps {
  index: SearchIndex
  open: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}
```

It uses `@cascivo/components/modal` for the dialog shell, `@cascivo/components/input` for the
query field, and renders results as a keyboard-navigable list. `↑`/`↓` move a `cursor` signal;
`Enter` calls `onNavigate(results[cursor].href)` then `onClose()`.

The landing wires it:

```tsx
// apps/landing/src/App.tsx (simplified)
const searchOpen = useSignal(false)
useSignalEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
})
```

### TechDeepDive section (T5)

New file `apps/landing/src/sections/TechDeepDive.tsx`. Three `<article>` blocks, each with a
heading, a one-sentence summary, and a two-column `<pre><code>` pair ("before" in the left column,
"after cascivo" in the right). The section id is `tech-deep-dive`. It's inserted in `App.tsx`
(inside `HomePage`) between `<Principles />` and `<StatsBand />`.

CSS highlights:

```css
.tech-deep-dive {
  /* two-column code pairs at md+ */
  .tech-block-compare {
    display: grid;
    gap: var(--cascivo-space-4);
    grid-template-columns: 1fr;
  }
  @container (inline-size >= 40rem) {
    .tech-block-compare {
      grid-template-columns: 1fr 1fr;
    }
  }
}
```

### A11y fixes (T6)

`AccessibilityStatement.tsx`:
- Line 90: `Cascade targets` → `cascivo targets`
- Line 92: `Cascade at 2.2 AA` → `cascivo at 2.2 AA`
- Line 100: `<th scope="col">Cascade</th>` → `<th scope="col">cascivo</th>`

`AxeComparison.tsx`:
- Line 54: `Cascivo complements` → `cascivo complements`

`A11yMatrix.tsx` — add `pagination` prop to `DataTable`:

```tsx
<DataTable
  columns={COLUMNS}
  rows={rows.value}
  getRowId={(r) => r.name}
  density="compact"
  stickyHeader
  pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
  title="Keyboard and ARIA matrix"
  description="Role, WCAG level, and keyboard interaction per registry entry, generated from each component.meta.ts."
/>
```

The `pageSignal` inside `DataTable` resets to 1 whenever `rows` changes (already implemented in
the component via `useComputed` — the `currentPage` clamps to `pageCount`, which shrinks when
filters reduce the row count).

---

## Conventions to follow in every tranche

1. **Signals over hooks.** `useSignal`, `useComputed`, `useSignalEffect` only. No `useState`,
   `useEffect`, `useContext`, `useReducer` anywhere in landing or search package code.
2. **`useSignals()` first line** in every React component that reads `.value` during render.
3. **Token-only CSS.** No hardcoded colour hex. No raw pixel sizes (use rem or CSS tokens).
4. **Mobile-first.** Base at 320 px; `@container` / `min-width` enhancements at canonical sizes.
5. **`pnpm breakpoint:check` must exit 0** after every CSS change.
6. **Commit after each tranche.** All gate commands exit 0 before committing.

---

## Gate Commands (run before each commit)

```sh
pnpm exec vp check           # fmt + lint + tsc
pnpm build                   # build all packages
pnpm exec vp run -r check    # type-check all packages
pnpm test                    # unit + smoke tests
pnpm regen && pnpm exec vp check --fix && git diff --exit-code
pnpm breakpoint:check
```
