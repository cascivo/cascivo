# Headless primitives (`@cascivo/core`)

cascade is CSS-native, but the interactive behavior — focus, dismissal, keyboard
navigation, aria wiring — lives in a small, reusable **headless layer** in
`@cascivo/core`. You do **not** roll your own `aria-*` toggles or keyboard handlers
for menus, dialogs, and popovers: compose these primitives instead. They are
unstyled, signal-driven (no `useState`/`useEffect`), and SSR-safe.

## State & reactivity primitives

The catalogue below is the **a11y/behavior** layer; this is the **state** layer. cascivo
components never use `useState`/`useContext`/`useEffect` — the signal *is* the state. When
you build on cascivo, reach for these, not the React hook you'd normally use:

| You'd normally reach for… | Use instead | Why |
| --- | --- | --- |
| `useState` | `useSignal(initial)` (local) / `useComputed(fn)` (derived) | The signal is the state; fine-grained updates, no subtree re-render. |
| A controlled/uncontrolled prop wired to state | `useControllableSignal({ value, defaultValue, onChange })` | Codifies the controlled↔uncontrolled bridge once, with no effect. |
| `useEffect` for a DOM side effect | `useSignalEffect(fn)` | Runs on signal change, SSR-safe; `useEffect` is banned in cascivo components. |
| `useContext` for shared state | A module-level `signal` imported anywhere | Signals are globally reactive — no provider or prop-drilling needed. |
| A cleanup registry to avoid leaks on route change | `useScope()` / `createScope()` | Disposes every owned effect on unmount; one scope per tenant/route boundary. |
| A reducer / explicit state machine | `createMachine` / `useMachine` | A minimal transition-table FSM backed by a signal. |
| A form library (react-hook-form, Formik) | `createForm` / `useForm` / `<Form>` / `field()` | Signal-backed store; sync/async + Standard Schema (zod/valibot) validation; optional `validateOnChange` validates on keystroke with zero re-renders. |
| `useEffect` to toggle a `.dark` class | `<ThemeProvider>` + `useTheme()` / `setTheme()` | Persists + drives `data-theme`; pair with `themePreloadScript()` for SSR no-FOUC. |
| Intercepting nav-item `onClick` to route client-side | `setLinkComponent(YourLink)` / `getLinkComponent()` | Config-driven nav (SideNav, ShellHeader, Header, Breadcrumb, Switcher, Dock, NavigationMenu) renders links through the registered component — a real router `<Link>`, so hover-preloading works and no click interception is needed. |
| Reading token names out of a CSS file | `import type { CascivoToken, CascivoColorToken } from '@cascivo/tokens/tokens'` | Generated union of every `--cascivo-*` property — visible in the type, no file lookup. |

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
> [TROUBLESHOOTING.md](TROUBLESHOOTING.md#handlers-fire-but-the-ui-never-updates-toggles-dont-toggle-modals-dont-open).

**One caveat on the wrappers.** `useSignals()` starts tracking where it is called, so a
signal read that happens *above* your first `useSignal`/`useComputed` call is not tracked.
Call the hooks before reading signals — or just call `useSignals()` first, which is always
safe and is what cascivo's own components do.

### Syncing a controlled prop into a signal

Preact runs effects **synchronously on write**, so *where you read the mirrored signal*
decides which primitive is correct:

| The signal is read… | Use | Why |
| --- | --- | --- |
| in render (JSX, a `data-*` attribute, a derived value) | `useControllableSignal({ value, defaultValue, onChange })` | The write must be synchronous or the component renders one tick stale. A render-phase write that only notifies the writing component's own subscription is a legal same-fiber render-phase update. |
| only inside `useSignalEffect` | `useEffectPropSignal(prop)` | A synchronous write would run the effect body **inside React's render phase** — `showModal()`, listener registration against a pre-commit ref, a parent `setState`. `useEffectPropSignal` defers the mirror one microtask so the effect lands after the commit, where it was always meant to. |

Never hand-roll `const s = useSignal(prop); s.value = prop` for the second case: that is the
exact shape that shipped a render-phase `showModal()` in `Modal`, `Sheet`, `Dropdown`,
`AlertDialog`, `HeaderPanel`, `CommandMenu` and `Presence`.

For the full friction-to-primitive rationale with code — and why the generic
React/Tailwind patterns an LLM defaults to are wrong here — see
[ENTERPRISE-READINESS.md](ENTERPRISE-READINESS.md).

## Catalogue

| Primitive | What it does |
| --- | --- |
| `useId(prefix?)` | Stable, SSR-safe, colon-stripped id for aria wiring and CSS anchor names. One per instance — never hardcode aria ids or use `Math.random()`. |
| `DismissableLayer` | Dismisses on an outside pointer press or Escape. Nested layers form a stack — only the top-most responds (a dropdown inside a modal dismisses top-first). |
| `FocusScope` | Focus trap with `trapped`, `restoreFocus`, `autoFocus`. Cycles Tab/Shift+Tab within its subtree. |
| `useRovingFocus` | Roving tabindex for toolbars/lists. Arrow keys move focus (Home/End jump, `loop` wraps); only the active item is tabbable. Spread `getItemProps(i)`. |
| `useTypeahead` | Type-to-select. Accumulates printable keypresses into a query, resets after inactivity, and calls `onMatch(query)` so you focus the matching item. |
| `useDisclosure` | Controllable open/close state (`isOpen`, `open`, `close`, `toggle`). |
| `useAnchorPosition` / `computePosition` | Position a floating element against an anchor. |
| `Portal` | Render into `document.body` (or a target) while keeping React context. |
| `Presence` | Keep an element mounted through its exit transition. |
| `useScrollLock` | Lock body scroll while an overlay is open. |
| `VisuallyHidden` | Visually hide content while keeping it in the a11y tree. |
| `Slot` / `composeRefs` / `mergeProps` | Merge props/refs when forwarding to a child element. |
| `setLinkComponent` / `getLinkComponent` | Register the component config-driven nav renders links through. Call `setLinkComponent(...)` once at app start so SideNav/ShellHeader/Header/Breadcrumb/Switcher/Dock/NavigationMenu render your framework's router `<Link>` (preserving `href`, `aria-current`, active `data-state`), instead of a plain `<a>`. The Link must forward `ref` to its anchor for roving-focus navs. Re-exported from `@cascivo/react` (Path B) as well as `@cascivo/core` (Path A). |

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
import them from `@cascivo/core` on Path B: `@cascivo/core` is only a *transitive* dependency
of `@cascivo/react`, so `import … from '@cascivo/core'` is a phantom-dependency error
(`MODULE_NOT_FOUND` under pnpm's strict `node_modules`, and a lint error under
`no-extraneous-dependencies`) unless you add `@cascivo/core` to your own `package.json`. The
`@cascivo/core` import is correct **only** on the copy-paste path (Path A), where `cascivo init`
installs `@cascivo/core` as a direct dependency; both resolve the same singleton.

The registered component receives the full computed prop bag (`href`, `className`,
`aria-current`, `data-state`, `onClick`, …), so active styling and accessibility carry
over unchanged. For a one-off custom item, `SideNavItem.render({ children, linkProps })`
gives you the same bag plus the default icon/label node.

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
      enabled(panel).find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(q))?.focus()
    },
  })

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const panel = e.currentTarget
    const list = enabled(panel)
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); list[i < 0 ? 0 : (i + 1) % list.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[i < 0 ? list.length - 1 : (i - 1 + list.length) % list.length]?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus() }
    else if (e.key === 'End') { e.preventDefault(); list.at(-1)?.focus() }
    else typeahead.onKeyDown(e)
  }

  return (
    <>
      <button type="button" aria-haspopup="menu" aria-expanded={open.value} onClick={() => (open.value = !open.value)}>
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
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); item.onSelect() }
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
- Enforced by `pnpm primitives:check` (see [`CLAUDE.md`](../CLAUDE.md) authoring rules).
