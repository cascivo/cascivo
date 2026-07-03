# Testing cascivo components

How to test UIs built with cascivo using Vitest + Testing Library. cascivo's
own component suite (192 components, `packages/components/src/*/[name].test.tsx`)
uses exactly this stack; the patterns below are lifted from it.

## Setup

```sh
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```ts
// vite.config.ts (or vitest.config.ts)
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

```ts
// src/test-setup.ts
import '@testing-library/jest-dom'
```

## Basics: render, query by role, interact

Signal-driven components need no special harness — render them and assert on
the DOM like any React component. From cascivo's own `Toggle` suite:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from '@cascivo/react'

it('toggles when clicked (uncontrolled)', async () => {
  render(<Toggle label="Notifications" />)
  const toggle = screen.getByRole('switch')
  await userEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-checked', 'true')
})
```

Prefer role queries (`getByRole('switch', { name: 'Notifications' })`) —
cascivo components ship full ARIA wiring, so the accessible name/role is the
stable contract to test against, not class names.

## The `useSignals` gotcha

cascivo components call `useSignals()` internally, so **testing the components
themselves just works**. The trap is in *your* components: any React component
that reads a signal's `.value` during render must call `useSignals()` (from
`@cascivo/core`) as its first statement. Without it the component never
subscribes — in tests the symptom is that handlers fire (spies are called) but
assertions on the rendered output keep seeing the old UI:

```tsx
import { useSignal, useSignals } from '@cascivo/core'

function Counter() {
  useSignals() // ← without this, the count below never updates on screen
  const count = useSignal(0)
  return <button onClick={() => count.value++}>{count.value}</button>
}
```

If a test shows a click handler being invoked but the DOM frozen at its initial
state, check `useSignals()` before anything else. (The same bug reproduces in
the browser — see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).)

## What to polyfill in jsdom

jsdom does not implement everything cascivo's overlay components touch. These
are the shims cascivo's own suite uses; add the ones your tests hit to your
setup file.

**`<dialog>` methods** (Modal, AlertDialog, CommandMenu — jsdom has no
`showModal`/`close`):

```ts
HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
})
```

**The Popover API** (Popover, Menu, Toggletip, …). jsdom implements just enough
of it to hurt: a UA stylesheet rule hides every closed popover
(`[popover]:not(:popover-open) { display: none }`), which breaks Testing Library
role queries. cascivo's suite drops the attribute so the rule never applies —
components still call `showPopover`/`hidePopover` (no-ops here) and `data-state`
drives the CSS:

```ts
const _setAttribute = HTMLElement.prototype.setAttribute
HTMLElement.prototype.setAttribute = function (name: string, value: string) {
  if (name === 'popover') return
  _setAttribute.call(this, name, value)
}
HTMLElement.prototype.showPopover = function () {}
HTMLElement.prototype.hidePopover = function () {}
```

**`CSS.supports`** (feature detection in positioning code):

```ts
if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
  globalThis.CSS = { ...globalThis.CSS, supports: () => false } as typeof CSS
}
```

**`IntersectionObserver`** — only needed for scroll-spy components (Toc):
stub it with `vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)`
and drive the callback manually. **`matchMedia`** is absent in jsdom; cascivo
components guard for that (e.g. AppShell defaults to its desktop state), so no
polyfill is required unless your own code calls it unguarded.

The full reference setup lives at
[`packages/components/src/setup.ts`](../packages/components/src/setup.ts).

## Don't write timing-dependent tests

Never assert after a real `setTimeout`/sleep — flaky by construction. For
debounce/duration behavior, use fake timers and advance them explicitly, wiring
`user-event` to the fake clock. From cascivo's `Search` (debounced `onSearch`)
suite:

```tsx
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('fires once after the debounce delay', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const onSearch = vi.fn()
  render(<Search onSearch={onSearch} />)
  await user.type(screen.getByRole('searchbox'), 'ab')
  expect(onSearch).not.toHaveBeenCalled()
  vi.advanceTimersByTime(300) // deterministic — no real waiting
  expect(onSearch).toHaveBeenCalledTimes(1)
})
```

One Vitest-specific trap: Testing Library's async wrapper flushes its internal
zero-delay timeout by checking for a `jest` global, which Vitest never defines —
so `await user.type(…)` **deadlocks under `vi.useFakeTimers()`**. cascivo's
setup file works around it; copy this into yours if you combine fake timers
with `user-event`:

```ts
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

configure({
  asyncWrapper: async (cb) => {
    const result = await cb()
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
      if (vi.isFakeTimers()) vi.advanceTimersByTime(0)
    })
    return result
  },
})
```

## See also

- [`packages/components/src/toggle/toggle.test.tsx`](../packages/components/src/toggle/toggle.test.tsx) — interaction basics
- [`packages/components/src/modal/modal.test.tsx`](../packages/components/src/modal/modal.test.tsx) — dialog polyfills
- [`packages/components/src/search/search.test.tsx`](../packages/components/src/search/search.test.tsx) — fake-timer debounce tests
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — the runtime version of the `useSignals` symptom
