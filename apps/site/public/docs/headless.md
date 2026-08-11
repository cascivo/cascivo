<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/headless.md
  registry v0.17.1 · generated 2026-08-11
-->

# Headless primitives (`@cascivo/core`)

cascade is CSS-native, but the interactive behavior — focus, dismissal, keyboard
navigation, aria wiring — lives in a small, reusable **headless layer** in
`@cascivo/core`. You do **not** roll your own `aria-*` toggles or keyboard handlers
for menus, dialogs, and popovers: compose these primitives instead. They are
unstyled, signal-driven (no `useState`/`useEffect`), and SSR-safe.

## State & reactivity primitives

The catalogue below is the **a11y/behavior** layer; this is the **state** layer. cascivo
components never use `useState`/`useContext`/`useEffect` — the signal _is_ the state. When
you build on cascivo, reach for these, not the React hook you'd normally use:

> ⚠ **Before you write your first signal, turn off one lint rule.** Every write below —
> including this page's `onClick={() => (open.value = !open.value)}` — is reported as
> `Error: This value cannot be modified` by `react-hooks/immutability`, which
> `eslint-plugin-react-hooks@7` enables by default in `recommended-latest`. Add
> `@cascivo/eslint-config` (`...cascivo`, spread last) or set
> `'react-hooks/immutability': 'off'`. See
> [USING-WITH-STRICT-ESLINT.md](/docs/using-with-strict-eslint.md) §1 for why it cannot be
> narrowed and what turning it off costs.

| You'd normally reach for…                            | Use instead                                                                                                                                                                  | Why                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useState`                                           | `useSignal(initial)` (local) / `useComputed(fn)` (derived)                                                                                                                   | The signal is the state; fine-grained updates, no subtree re-render.                                                                                                                                                                 |
| A controlled/uncontrolled prop wired to state        | `useControllableSignal({ value, defaultValue, onChange })`                                                                                                                   | Codifies the controlled↔uncontrolled bridge once, with no effect.                                                                                                                                                                    |
| `useEffect` for a DOM side effect                    | `useSignalEffect(fn)`                                                                                                                                                        | Runs on signal change, SSR-safe; `useEffect` is banned in cascivo components.                                                                                                                                                        |
| `useContext` for shared state                        | A module-level `signal` imported anywhere                                                                                                                                    | Signals are globally reactive — no provider or prop-drilling needed.                                                                                                                                                                 |
| A cleanup registry to avoid leaks on route change    | `useScope()` / `createScope()`                                                                                                                                               | Disposes every owned effect on unmount; one scope per tenant/route boundary.                                                                                                                                                         |
| A reducer / explicit state machine                   | `createMachine` / `useMachine`                                                                                                                                               | A minimal transition-table FSM backed by a signal.                                                                                                                                                                                   |
| A form library (react-hook-form, Formik)             | `createForm` / `useForm` / `<Form>` / `field()` — **`@cascivo/react` only** (they build on the Field/Form components, which the copy-paste path vendors rather than imports) | Signal-backed store; sync/async + Standard Schema (zod/valibot) validation; optional `validateOnChange` validates on keystroke with zero re-renders.                                                                                 |
| `useEffect` to toggle a `.dark` class                | `<ThemeProvider>` + `useTheme()` / `setTheme()`                                                                                                                              | Persists + drives `data-theme`; pair with `themePreloadScript()` for SSR no-FOUC.                                                                                                                                                    |
| Intercepting nav-item `onClick` to route client-side | `setLinkComponent(YourLink)` / `getLinkComponent()`                                                                                                                          | Config-driven nav (SideNav, ShellHeader, Header, Breadcrumb, Switcher, Dock, NavigationMenu) renders links through the registered component — a real router `<Link>`, so hover-preloading works and no click interception is needed. |
| Reading token names out of a CSS file                | `import type { CascivoToken, CascivoColorToken } from '@cascivo/tokens/tokens'`                                                                                              | Generated union of every `--cascivo-*` property — visible in the type, no file lookup.                                                                                                                                               |

### When do I need `useSignals()`?

No consumer app runs the Babel signals transform, so a React component only re-renders on a
signal write if something subscribed it. The rule is short:

> **You need `useSignals()` only for a signal you did not get from a cascivo hook.**
> That means exactly three things: a module-level `signal()`, a signal handed to you as a
> prop, and `currentLocale()` from `@cascivo/i18n` (a plain function, so it cannot
> self-subscribe). Call it as the component's **first statement**.

Everything a cascivo hook returns is already reactive on its own: `useSignal`,
`useComputed`, `useControllableSignal`, `useDisclosure`, `useMediaQuery`, `useMachine`,
`useRovingFocus`, `useStreamBuffer`, `useScope`, `useTheme`, `useForm`, `useAnchorPosition`
all call `useSignals()` for you.

**That list is machine-checked, not a promise in prose.** Every hook on it is rendered in a
transform-free React component, written to, and asserted to re-render
(`packages/core/src/self-subscribe.test.tsx`), and
`scripts/checks/self-subscribe-parity.test.ts` fails the build if this paragraph and the
code ever disagree in either direction. It is written this way because it was once prose:
the list claimed twelve hooks while the test covered three, `useSignal` and `useComputed`
were quietly not among the ten that worked, and an adopter shipped an entire dashboard whose
filters, sorts and toggles did nothing — with no error to explain it.

> **Symptom to recognize:** handlers fire, your signal updates, the UI never moves. That is
> always a missing subscription, never a broken handler. See
> [TROUBLESHOOTING.md](/docs/troubleshooting.md#handlers-fire-but-the-ui-never-updates-toggles-dont-toggle-modals-dont-open).

**One caveat on the wrappers.** `useSignals()` starts tracking where it is called, so a
signal read that happens _above_ your first `useSignal`/`useComputed` call is not tracked.
Call the hooks before reading signals — or just call `useSignals()` first, which is always
safe and is what cascivo's own components do.

### Syncing a controlled prop into a signal

Preact runs effects **synchronously on write**, so _where you read the mirrored signal_
decides which primitive is correct:

| The signal is read…                                    | Use                                                        | Why                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| in render (JSX, a `data-*` attribute, a derived value) | `useControllableSignal({ value, defaultValue, onChange })` | The write must be synchronous or the component renders one tick stale. A render-phase write that only notifies the writing component's own subscription is a legal same-fiber render-phase update.                                                                                            |
| only inside `useSignalEffect`                          | `useEffectPropSignal(prop)`                                | A synchronous write would run the effect body **inside React's render phase** — `showModal()`, listener registration against a pre-commit ref, a parent `setState`. `useEffectPropSignal` defers the mirror one microtask so the effect lands after the commit, where it was always meant to. |

Never hand-roll `const s = useSignal(prop); s.value = prop` for the second case: that is the
exact shape that shipped a render-phase `showModal()` in `Modal`, `Sheet`, `Dropdown`,
`AlertDialog`, `HeaderPanel`, `CommandMenu` and `Presence`.

For the full friction-to-primitive rationale with code — and why the generic
React/Tailwind patterns an LLM defaults to are wrong here — see
[ENTERPRISE-READINESS.md](/docs/enterprise-readiness.md).

## Catalogue

| Primitive                                                                                       | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useId(prefix?)`                                                                                | Stable, SSR-safe, colon-stripped id for aria wiring and CSS anchor names. One per instance — never hardcode aria ids or use `Math.random()`.                                                                                                                                                                                                                                                                                                                                        |
| `DismissableLayer`                                                                              | Dismisses on an outside pointer press or Escape. Nested layers form a stack — only the top-most responds (a dropdown inside a modal dismisses top-first).                                                                                                                                                                                                                                                                                                                           |
| `FocusScope`                                                                                    | Focus trap with `trapped`, `restoreFocus`, `autoFocus`. Cycles Tab/Shift+Tab within its subtree.                                                                                                                                                                                                                                                                                                                                                                                    |
| `useRovingFocus`                                                                                | Roving tabindex for toolbars/lists. Arrow keys move focus (Home/End jump, `loop` wraps); only the active item is tabbable. Spread `getItemProps(i)`.                                                                                                                                                                                                                                                                                                                                |
| `useTypeahead`                                                                                  | Type-to-select. Accumulates printable keypresses into a query, resets after inactivity, and calls `onMatch(query)` so you focus the matching item.                                                                                                                                                                                                                                                                                                                                  |
| `useDisclosure`                                                                                 | Controllable open/close state (`isOpen`, `open`, `close`, `toggle`).                                                                                                                                                                                                                                                                                                                                                                                                                |
| `useAnchorPosition` / `computePosition`                                                         | Position a floating element against an anchor.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Portal`                                                                                        | Render into `document.body` (or a target) while keeping React context.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `Presence`                                                                                      | Keep an element mounted through its exit transition.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `useScrollLock`                                                                                 | Lock body scroll while an overlay is open.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `VisuallyHidden`                                                                                | Visually hide content while keeping it in the a11y tree.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Slot` / `composeRefs` / `mergeProps`                                                           | Merge props/refs when forwarding to a child element.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `focusElement`                                                                                  | Focus whatever a ref actually points at; returns whether it worked. Use it instead of `ref.current?.focus()` whenever the ref was attached to a **consumer-supplied element** (a cloned `trigger`), because a ref on a function component resolves to the DOM node under React 19 but to the component _instance_ under `preact/compat` — so `.focus()` is undefined there and throws. Safe (and equivalent) on a ref you attached to your own intrinsic element.                   |
| `normalizeTone` / `Tone` / `ToneInput`                                                          | The catalog's one severity vocabulary — `neutral \| info \| success \| warning \| danger`. `Badge`, `Tag`, `Status` and `Notification` all accept it, plus their historical spellings (`destructive`/`error` → `danger`, `default` → `neutral`) which `normalizeTone` resolves. Use it to map one domain enum onto every display component without a per-component lookup table.                                                                                                    |
| `normalizeProgress` / `Progress` / `ProgressInput`                                              | The catalog's one sequence vocabulary — `pending \| active \| complete \| error`. `Steps` and `Timeline` both accept it, plus Timeline's `current` / `upcoming` aliases, which `normalizeProgress` resolves.                                                                                                                                                                                                                                                                        |
| `sentimentOf` / `Trend` / `GoodDirection` / `Sentiment`                                         | Splits **which way a metric moved** (the arrow) from **whether that is welcome** (the colour). `Stat` and `Kpi` both hard-coded up-is-green, so a deploy console's error-rate and latency tiles rendered their worst news in green, and negating the delta to fix the colour also reversed the arrow. Pass `goodDirection="down"` for errors/latency/cost/churn, `"neutral"` where neither direction is inherently good.                                                            |
| `ThemeProvider` / `useTheme` / `setTheme` / `themeSignal` / `applyTheme` / `themePreloadScript` | The theme runtime: persists the choice, drives `data-theme` + `color-scheme`, and renders with no FOUC under SSR. **In `@cascivo/core`, so the copy-paste path can reach it** — `@cascivo/react` re-exports the same names, so both install paths use identical code. `useTheme()` returns a TUPLE `[name, setTheme]`, not `{ theme, setTheme }`. Outside React (an imperative shell, a pre-hydration script) use `applyTheme(theme, target?)`. See [THEMING.md](/docs/theming.md). |
| `persistedSignal`                                                                               | A signal backed by localStorage (or any `StorageDriver`), SSR-safe: with no `window` the driver is a no-op and the signal still works on the server. Survives reload and syncs across tabs. Lives here rather than in `@cascivo/storage` because the theme runtime above needs it and `@cascivo/storage` depends on this package — `@cascivo/storage` re-exports it unchanged.                                                                                                      |
| `localStorageDriver` / `memoryDriver` / `StorageDriver`                                         | Storage backends for `persistedSignal`. `memoryDriver()` is the SSR/test fallback. `indexedDBDriver` stays in `@cascivo/storage` (it is async and not needed by the theme runtime).                                                                                                                                                                                                                                                                                                 |
| `setLinkComponent` / `getLinkComponent`                                                         | Register the component config-driven nav renders links through. Call `setLinkComponent(...)` once at app start so SideNav/ShellHeader/Header/Breadcrumb/Switcher/Dock/NavigationMenu render your framework's router `<Link>` (preserving `href`, `aria-current`, active `data-state`), instead of a plain `<a>`. The Link must forward `ref` to its anchor for roving-focus navs. Re-exported from `@cascivo/react` (Path B) as well as `@cascivo/core` (Path A).                   |

### `@cascivo/core/pure` — the server-safe subset

`@cascivo/core`'s main entry is a single bundled chunk carrying a `'use client'` banner. That
banner is load-bearing (without it Next.js treats every hook and `Portal`/`Presence` as a
Server Component), but it also means **everything** imported from `@cascivo/core` sits behind
a client boundary — including helpers that need no browser at all. A component that renders
on the server and imports `cn` from there fails RSC prerendering with `Attempted to call cn()
from the server but cn is on the client`.

`@cascivo/core/pure` is the same helpers built without the banner:

```tsx
import { cn, Slot, normalizeTone, useId } from '@cascivo/core/pure'
```

Exports `cn`, `composeRefs`, `mergeProps`, `Slot`, `normalizeTone`, `normalizeProgress`,
`useId`, and their types. Every one is transitively free of client-only React APIs — `useId`
included, because React exports it under the `react-server` condition.

**When to use which.** Reach for `/pure` only from a component that must render on the
server — exactly the set `clientJs: 'none'` names in the manifests. Everything else keeps its
single `@cascivo/core` import, which re-exports all of these anyway. **Type-only imports
never need it**: `import type { ToneInput } from '@cascivo/core'` is erased at compile time,
so it creates no runtime edge, and routing types through two specifiers makes the published
`.d.ts` alias them (`ToneInput$1`).

Adding to this subpath is a packaging decision, not a convenience — anything unexportable
from a Server Component belongs in the main entry.

## Router integration — client-side nav links

cascivo's config-driven nav components render plain `<a href>` by default. To make
them navigate through your framework's router (keeping client-side transitions and
hover-preloading) register a link component once at startup — a module singleton, so
no provider or per-item wiring:

```tsx
// TanStack Router — its Link takes `to`, so map href → to and spread the rest:
import { setLinkComponent, type LinkComponentProps } from '@cascivo/react'
import { Link } from '@tanstack/react-router'
setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href} {...rest} />)

// Next.js — its Link takes `href` directly:
import Link from 'next/link'
setLinkComponent(Link)
```

`LinkComponentProps` (re-exported from `@cascivo/react`, also in `@cascivo/core`) is the
computed prop bag — `href`, `className`, `onClick`, `aria-current`, active `data-state`,
`tabIndex`, and any `data-*`. Spread it whole so active styling and a11y carry over; the
`onClick` only `preventDefault`s a disabled item, so a router keeps middle-click /
open-in-new-tab.

On the prebuilt path (Path B) import `setLinkComponent`/`getLinkComponent`/`LinkComponentProps`
from **`@cascivo/react`** — they are re-exported there for exactly this reason. Do **not**
import them from `@cascivo/core` on Path B: `@cascivo/core` is only a _transitive_ dependency
of `@cascivo/react`, so `import … from '@cascivo/core'` is a phantom-dependency error
(`MODULE_NOT_FOUND` under pnpm's strict `node_modules`, and a lint error under
`no-extraneous-dependencies`) unless you add `@cascivo/core` to your own `package.json`. The
`@cascivo/core` import is correct **only** on the copy-paste path (Path A), where `cascivo init`
installs `@cascivo/core` as a direct dependency; both resolve the same singleton.

The registered component receives the full computed prop bag (`href`, `className`,
`aria-current`, `data-state`, `onClick`, …), so active styling and accessibility carry
over unchanged. For a one-off custom item, `SideNavItem.render({ children, linkProps })`
gives you the same bag plus the default icon/label node.

### `setLinkComponent` covers config-driven navs — not links you write yourself

It is deliberately scoped to components that render the `<a>` **for** you. A link you place
in page content (a project name in a card title, a branch in a table cell) is styled with
**`asChild`** instead, which puts cascivo's styling on your router's element:

```tsx
<Link asChild><RouterLink to="/projects/alpha">alpha</RouterLink></Link>
<Button asChild><RouterLink to="/projects/new">New Project</RouterLink></Button>
```

A bare `<Link href="/x">` in a routed app is a full page reload, and copying cascivo's link
CSS into your own layer drifts on every release — override `--cascivo-link-color` instead.
Full guide, including every `asChild`-capable component:
[USING-WITH-A-ROUTER.md](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-A-ROUTER.md).

## Recipe: an accessible menu from primitives

The shipped `Menu` composes `usePopover` + `useTypeahead` + DOM-resolved roving
focus. To build your own, the same three concerns compose directly:

```tsx
'use client'
import { useId, useTypeahead, useSignals, useSignal } from '@cascivo/core'

export function Menu({ items }: { items: { label: string; onSelect: () => void }[] }) {
  useSignals()
  const open = useSignal(false)
  const menuId = useId('menu')

  // Resolve enabled items from the DOM so disabled rows/separators are skipped.
  const enabled = (panel: HTMLElement) =>
    Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'))

  const typeahead = useTypeahead({
    onMatch: (q) => {
      const panel = document.getElementById(menuId)
      if (!panel) return
      enabled(panel)
        .find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(q))
        ?.focus()
    },
  })

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const panel = e.currentTarget
    const list = enabled(panel)
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      list[i < 0 ? 0 : (i + 1) % list.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      list[i < 0 ? list.length - 1 : (i - 1 + list.length) % list.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      list[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      list.at(-1)?.focus()
    } else typeahead.onKeyDown(e)
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open.value}
        onClick={() => (open.value = !open.value)}
      >
        Actions
      </button>
      {open.value && (
        <div id={menuId} role="menu" onKeyDown={onKeyDown}>
          {items.map((item) => (
            <div
              key={item.label}
              role="menuitem"
              tabIndex={0}
              onClick={item.onSelect}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  item.onSelect()
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
```

Wrap the panel in `<DismissableLayer onDismiss={() => (open.value = false)}>` to close
on outside click / Escape, and add `<FocusScope trapped>` for a modal menu. Every
piece is independently testable and shared across components — no per-component aria
or keyboard reimplementation.

## Rules of thumb

- **Ids:** always `useId()`. A hardcoded literal breaks the moment a component renders
  twice on a page; `Math.random()` breaks SSR hydration.
- **Dismissal:** `DismissableLayer`, not a raw `document` listener — it also gets the
  nested-layer, top-first case right.
- **Keyboard:** `useRovingFocus` for arrow navigation, `useTypeahead` for type-to-select.
- Enforced by `pnpm primitives:check` (see [`CLAUDE.md`](https://github.com/cascivo/cascivo/blob/main/CLAUDE.md) authoring rules).
