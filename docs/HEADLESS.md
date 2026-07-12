# Headless primitives (`@cascivo/core`)

cascade is CSS-native, but the interactive behavior — focus, dismissal, keyboard
navigation, aria wiring — lives in a small, reusable **headless layer** in
`@cascivo/core`. You do **not** roll your own `aria-*` toggles or keyboard handlers
for menus, dialogs, and popovers: compose these primitives instead. They are
unstyled, signal-driven (no `useState`/`useEffect`), and SSR-safe.

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
