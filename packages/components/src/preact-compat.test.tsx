/**
 * Preact-compat suite — the interactive family must open and close without console errors.
 *
 * `preact/compat` has one behavioural difference cascivo depends on: a ref attached to a
 * **function component** resolves to the component *instance*, not the DOM node. Several
 * components clone a consumer-supplied trigger element, attach a ref to it, and later call
 * `.focus()` on that ref to restore focus on close. Under React 19 the ref is forwarded as
 * an ordinary prop, the component spreads it onto its host element, and `.current` is the
 * DOM node. Under Preact it is the instance, and `ref.current?.focus()` throws:
 *
 *     Uncaught TypeError: u.current?.focus is not a function
 *
 * A 2026-07-28 adopter hit it on `Dropdown`. The *behaviour* survived — focus did return to
 * the trigger in both runtimes — so it was a console error rather than a functional break,
 * but it fired on every dropdown interaction and is the first thing anyone evaluating
 * cascivo with devtools open would see. They also noted the sibling components sharing the
 * pattern (`Menu`, `MenuButton`, `OverflowMenu`) were never tested (report C9).
 *
 * So this covers the family together, and asserts the thing that actually failed: **no
 * console error**. `focusElement()` in `@cascivo/core` is the fix — it resolves a ref value
 * to a focusable node across both runtimes.
 *
 * "No console error" is a claim about something *not* happening, which is the easiest kind of
 * test to fool: it holds just as well when the interaction never reached the code under test.
 * This file was fooled that way once — see `popup()` below — so `Dropdown`, the reported
 * case, additionally asserts focus lands back on its trigger. That is a claim about something
 * that *did* happen, and it is what keeps the other assertions meaningful.
 *
 * Worth the setup beyond the console noise: the same reporter measured their app at 60 KB
 * gzip on Preact against 110 KB on React, with every component behaving identically. One
 * console error was the only thing between a Preact consumer and halving their JS.
 *
 * Runs in the dedicated "preact" vitest project (see vite.config.ts), where react and
 * react-dom are aliased to preact/compat at resolve level.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'react-dom'
import { Dropdown } from './dropdown/dropdown'
import { Menu, MenuItem, MenuTrigger } from './menu/menu'
import { MenuButton } from './menu-button/menu-button'
import { Combobox } from './combobox/combobox'
import { MultiSelect } from './multi-select/multi-select'
import { Popover, PopoverContent, PopoverTrigger } from './popover/popover'

/** A function component as the trigger — the shape that breaks under preact/compat. */
function TriggerButton(props: { children?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- preact/compat element
  return <button type="button" {...(props as any)} />
}

const items = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]
const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

let host: HTMLDivElement
let errorSpy: ReturnType<typeof vi.spyOn>
let onError: ((event: ErrorEvent) => void) | null = null
let uncaught: string[] = []

beforeEach(() => {
  // `@preact/signals` defers its effect flush behind a race — `requestAnimationFrame` versus
  // a 35 ms `setTimeout`, whichever fires first cancelling the other
  // (`clearTimeout(r); cancelAnimationFrame(t)` in signals.js). jsdom stops its rAF loop at
  // environment teardown, so on a busy runner only the Node timer survives: it fires after
  // the globals are gone and throws `ReferenceError: cancelAnimationFrame is not defined` as
  // an *unhandled* error, which fails the whole run with every test green. Faking the timer
  // APIs lets each case drain that flush while jsdom is still alive.
  //
  // Only the timer APIs. Signals batches updates through `queueMicrotask`, which vitest also
  // fakes by default — faking it here would stop the components under test from updating at
  // all and quietly turn this file into six assertions about nothing.
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  uncaught = []
  errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    uncaught.push(args.map(String).join(' '))
  })
  onError = (event: ErrorEvent) => uncaught.push(String(event.message))
  window.addEventListener('error', onError)
})

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- preact/compat unmount
  render(null as any, host)
  vi.runOnlyPendingTimers() // drain what the unmount scheduled, while jsdom still exists
  vi.useRealTimers()
  if (onError) window.removeEventListener('error', onError)
  errorSpy.mockRestore()
  host.remove()
})

/**
 * The element a component's Escape handler is bound to.
 *
 * This is the whole ballgame. These components handle Escape with React's `onKeyDown` on the
 * *popup*, and the popup is not an ancestor of `document.body`'s active element — so an
 * Escape dispatched at `document.activeElement` (jsdom leaves that as `<body>`, since it
 * implements neither `showPopover()` focus nor autofocus here) bubbles right past the
 * handler and the focus-restore path never runs. An earlier version of this file did exactly
 * that and passed against deliberately broken `focusElement`, which is worse than having no
 * test at all.
 */
function popup(): HTMLElement | null {
  return host.querySelector<HTMLElement>('[popover], [role="menu"], [role="listbox"]')
}

/**
 * Mount, click the trigger (opens), press Escape (closes + restores focus).
 *
 * Returns the trigger so a caller can assert focus actually came back to it — the observable
 * proof that `focusElement()` ran, and the reason this file is not self-deceiving.
 */
function openAndClose(node: unknown): HTMLButtonElement | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- preact/compat render
  render(node as any, host)
  const trigger = host.querySelector('button')
  trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  const target = popup() ?? (document.activeElement as HTMLElement | null) ?? host
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  // Signals' deferred effect flush is where the focus restore actually runs, so it has to
  // happen inside the assertion window — draining it in afterEach would hide the C9 throw.
  vi.runOnlyPendingTimers()
  return trigger
}

interface Case {
  name: string
  tree: () => unknown
  /**
   * Whether closing this component restores focus to the trigger button.
   *
   * True for exactly one component, and that is not an oversight — it is the coverage this
   * file honestly has. `Dropdown` is the only one that both accepts a consumer-supplied
   * trigger element AND calls `focusElement()` on the ref it clones onto it, which is the
   * precise shape that breaks under preact/compat: the ref resolves to the component
   * *instance*, so a bare `.current?.focus()` throws. `Menu` and `Popover` never call
   * `focusElement` at all; `MenuButton`, `Combobox` and `MultiSelect` do, but always against
   * a ref on a host element they render themselves, so `.current` is a DOM node in either
   * runtime. Those five are here for the weaker claim in this file's title — open and close
   * without console noise — and asserting focus return for them would be asserting a
   * behaviour they do not have.
   */
  restoresFocusToTrigger?: boolean
}

const cases: Case[] = [
  {
    name: 'Dropdown (the reported case — a function-component trigger)',
    tree: () => <Dropdown trigger={<TriggerButton>Open</TriggerButton>} items={items} />,
    restoresFocusToTrigger: true,
  },
  {
    // Menu takes CHILDREN, not `trigger`/`items` — this case was copy-pasted from the
    // Dropdown case above (which really does take those props), so it passed unknown props,
    // rendered nothing at all, and asserted "no console error" about an empty tree for
    // months. Exactly the vacuous-pass this file's header warns about. `Menu`'s dev-time
    // "requires a <MenuTrigger> child" error is what surfaced it.
    name: 'Menu',
    tree: () => (
      <Menu>
        <MenuTrigger>
          <TriggerButton>Open</TriggerButton>
        </MenuTrigger>
        {items.map((i) => (
          <MenuItem key={i.value}>{i.label}</MenuItem>
        ))}
      </Menu>
    ),
  },
  { name: 'MenuButton', tree: () => <MenuButton label="Open" items={items} /> },
  { name: 'Combobox', tree: () => <Combobox options={options} /> },
  {
    name: 'MultiSelect',
    tree: () => <MultiSelect options={options} value={[]} onValueChange={() => {}} />,
  },
  {
    name: 'Popover',
    tree: () => (
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>
    ),
  },
]

describe('preact/compat — the interactive family raises no console errors', () => {
  for (const { name, tree, restoresFocusToTrigger } of cases) {
    it(`${name} opens and closes cleanly`, () => {
      let trigger: HTMLButtonElement | null = null
      expect(() => {
        trigger = openAndClose(tree())
      }).not.toThrow()
      // The C9 signature specifically — a ref holding something that is not a DOM node.
      expect(uncaught.join('\n')).not.toMatch(/focus is not a function/)
      expect(uncaught.join('\n')).not.toMatch(/Cannot read propert/)

      if (restoresFocusToTrigger) {
        // Not decoration — this is the assertion that keeps the file from lying. Everything
        // above still passes when the Escape never reaches a handler and `focusElement()` is
        // never called, which is how this file spent its first revision green against a
        // deliberately broken helper. Focus landing back on the trigger is the one observable
        // proof that the C9 code path actually ran.
        expect(document.activeElement).toBe(trigger)
      }
    })
  }
})
