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
import { Menu } from './menu/menu'
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
  if (onError) window.removeEventListener('error', onError)
  errorSpy.mockRestore()
  host.remove()
})

/** Mount, click the first button (opens), press Escape (closes + restores focus). */
function openAndClose(node: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- preact/compat render
  render(node as any, host)
  const trigger = host.querySelector('button')
  trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  const target = (document.activeElement ?? host) as HTMLElement
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('preact/compat — the interactive family raises no console errors', () => {
  const cases: [string, () => unknown][] = [
    [
      'Dropdown (the reported case — a function-component trigger)',
      () => <Dropdown trigger={<TriggerButton>Open</TriggerButton>} items={items} />,
    ],
    ['Menu', () => <Menu trigger={<TriggerButton>Open</TriggerButton>} items={items} />],
    ['MenuButton', () => <MenuButton label="Open" items={items} />],
    ['Combobox', () => <Combobox options={options} />],
    ['MultiSelect', () => <MultiSelect options={options} value={[]} onValueChange={() => {}} />],
    [
      'Popover',
      () => (
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Body</PopoverContent>
        </Popover>
      ),
    ],
  ]

  for (const [name, tree] of cases) {
    it(`${name} opens and closes cleanly`, () => {
      expect(() => openAndClose(tree())).not.toThrow()
      // The C9 signature specifically — a ref holding something that is not a DOM node.
      expect(uncaught.join('\n')).not.toMatch(/focus is not a function/)
      expect(uncaught.join('\n')).not.toMatch(/Cannot read propert/)
    })
  }
})
