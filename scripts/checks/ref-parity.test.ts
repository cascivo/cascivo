/**
 * Ref-parity guard — a component that wraps a single host element must forward a ref to it.
 *
 * There was not one `forwardRef` in `@cascivo/react`'s 4,755-line `.d.ts` and no component
 * declared a `ref` prop, so `<Textarea ref={r} />` was `ts(2322)`. At runtime it already
 * worked on React 19 — components spread unknown props onto the underlying element and React
 * 19 passes `ref` through as an ordinary prop — so the behaviour was right and only the types
 * were missing. A consumer has no way to know that, so every call site needed a cast; the
 * 2026-07-28 adopter needed the element for caret restoration and quarantined the cast in a
 * file of its own (report C10).
 *
 * Why a guard and not just a sweep: the first implementation pass converted four components
 * and left eleven, which is the same "fixed one instance of a class" shape that WS-7 hit with
 * chart formatters in the very same plan. A sweep decays; a guard does not.
 *
 * The rule: if a component spreads `{...props}` onto exactly one **intrinsic** element
 * (`<button>`, `<input>`, `<a>`, …), it must be a `forwardRef`. Composites that spread onto a
 * wrapper `<div>` are excluded by name with a reason — for those the useful ref target is an
 * inner control, which is a design decision, not an oversight.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const COMPONENTS_DIR = join(REPO_ROOT, 'packages/components/src')

/** Intrinsic elements whose ref a consumer plausibly wants. */
const HOST_TAGS = ['button', 'input', 'textarea', 'select', 'a']

/**
 * Components that spread onto a host-like element but deliberately do not forward a ref,
 * each with the reason. Keep this list short and specific.
 */
const ALLOWLIST: Record<string, string> = {
  search:
    'composite — {...props} lands on the wrapper; the useful ref is the inner <input>, and ' +
    'which element `ref` should mean is a design decision, not an oversight',
  combobox: 'composite — same shape as search (wrapper vs inner input)',
  'tags-input': 'composite — same shape as search (wrapper vs inner input)',
  'otp-input': 'composite — {...props} lands on the role="group" wrapper, not a single input',
  accordion:
    'multi-export file — the <button> spread is on the AccordionTrigger SUBCOMPONENT, and ' +
    'this guard reasons per file, so it cannot express "trigger forwards, item does not". ' +
    'Sharpening it to per-export analysis is open work; do not read this as "no gap"',
  tabs: 'multi-export file — same limitation as accordion (TabsTrigger vs TabsList)',
}

interface Component {
  name: string
  source: string
}

function components(): Component[] {
  const out: Component[] = []
  for (const entry of readdirSync(COMPONENTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(COMPONENTS_DIR, entry.name, `${entry.name}.tsx`)
    if (!existsSync(file)) continue
    out.push({ name: entry.name, source: readFileSync(file, 'utf8') })
  }
  return out
}

/**
 * The intrinsic element that receives `{...props}`, if exactly one does.
 *
 * Returns null when the spread lands on a wrapper `<div>`/`<span>`, on a component, or on
 * more than one element — all cases where "the ref target" is not self-evident.
 */
function singleHostSpread(source: string): string | null {
  const hosts = new Set<string>()
  for (const match of source.matchAll(/\{\.\.\.(?:props|rest)\}/g)) {
    // Walk back to the opening `<tag` of the element carrying this spread.
    const before = source.slice(0, match.index)
    const open = before.lastIndexOf('<')
    if (open === -1) continue
    const tag = /^<([a-zA-Z][\w.-]*)/.exec(before.slice(open))?.[1]
    if (tag && HOST_TAGS.includes(tag)) hosts.add(tag)
  }
  return hosts.size === 1 ? [...hosts][0]! : null
}

describe('ref-parity — single-host components forward a ref', () => {
  it('every component spreading props onto one intrinsic element is a forwardRef', () => {
    const missing: string[] = []
    for (const c of components()) {
      if (c.name in ALLOWLIST) continue
      const host = singleHostSpread(c.source)
      if (host === null) continue
      if (/\bforwardRef\b/.test(c.source)) continue
      missing.push(`${c.name} (spreads onto <${host}>)`)
    }
    assert.deepEqual(
      missing,
      [],
      'These components pass unknown props straight to a single intrinsic element, so a ref ' +
        'ALREADY reaches the DOM node under React 19 — but nothing declares it, so passing ' +
        'one is a ts(2322) and every consumer has to cast (2026-07-28 report C10).\n' +
        'Wrap the component in `forwardRef<HTMLXxxElement, XxxProps>` and put `ref` on the ' +
        'host element. Use forwardRef rather than a bare `ref?: Ref<T>` prop: the peer floor ' +
        'is react >= 18, where ref-as-prop does not work, so a bare type would compile and ' +
        'silently hand back null.\n' +
        `Or add the component to ALLOWLIST with a reason.\nMissing: ${missing.join(', ')}`,
    )
  })

  it('finds the components it is meant to cover (guards against passing vacuously)', () => {
    const hosted = components()
      .map((c) => ({ name: c.name, host: singleHostSpread(c.source) }))
      .filter((c) => c.host !== null)
    assert.ok(
      hosted.length >= 8,
      `expected at least 8 single-host components, found ${hosted.length}: ` +
        hosted.map((c) => c.name).join(', '),
    )
    for (const expected of ['textarea', 'input', 'button']) {
      assert.ok(
        hosted.some((c) => c.name === expected),
        `${expected} should be detected as single-host; found: ${hosted.map((c) => c.name).join(', ')}`,
      )
    }
  })
})
