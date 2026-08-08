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
 * chart formatters in the very same plan. A sweep decays; a guard does not — and when this
 * one was first written it immediately found nine components the plan's own list of sixteen
 * had never mentioned.
 *
 * The rule: if an exported component spreads `{...props}` onto exactly one **intrinsic**
 * element (`<button>`, `<input>`, `<a>`, …), it must be a `forwardRef`.
 *
 * This guard checks the WRAPPER. The other half — that the `ref` a wrapper receives actually
 * reaches an element — is enforced by **`noUnusedParameters` in tsconfig.base.json**, not
 * here. `SkipNavLink` was wrapped in `forwardRef`, documented as forwarding, counted by this
 * guard as compliant, and never put `ref` on its `<a>`: consumers got `null` with no type
 * error. `noUnusedParameters` reported it as `TS6133: 'ref' is declared but its value is
 * never read` the moment it was switched on.
 *
 * A regex version of that second check was written here first and deleted: it read
 * `ref={…}` / `composeRefs(…)` and so called `AccordionTrigger` broken for forwarding via
 * `summaryRef={ref}` — four false positives. The compiler understands every forwarding shape
 * and has none. Re-implementing a tool that already runs is how the host-lint guard missed
 * 117 errors (Mechanism F); don't reintroduce it here.
 *
 * Scope is **per exported component**, not per file. An earlier revision reasoned per file
 * and had to allowlist `accordion` and `tabs` wholesale, because it could not express
 * "`AccordionTrigger` forwards, `AccordionItem` does not" — which meant three real gaps hid
 * behind one allowlist entry each. Splitting each file into its exported components removed
 * both entries and surfaced the gaps.
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
 * Exported components that spread onto a host-like element but deliberately do not forward
 * a ref, each with the reason. Keyed by the exported component name.
 *
 * Keep this short and specific. "Composite, so the ref target is a design decision" is a
 * reason; "awkward to thread" is not.
 */
const ALLOWLIST: Record<string, string> = {
  Search:
    'composite — {...props} lands on the wrapper; the useful ref is the inner <input>, and ' +
    'which element `ref` should mean is a design decision, not an oversight',
  Combobox: 'composite — same shape as Search (wrapper vs inner input)',
  TagsInput: 'composite — same shape as Search (wrapper vs inner input)',
  OtpInput: 'composite — {...props} lands on the role="group" wrapper, not a single input',
}

interface ExportedComponent {
  file: string
  name: string
  source: string
}

function componentFiles(): { name: string; source: string }[] {
  const out: { name: string; source: string }[] = []
  for (const entry of readdirSync(COMPONENTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(COMPONENTS_DIR, entry.name, `${entry.name}.tsx`)
    if (!existsSync(file)) continue
    out.push({ name: entry.name, source: readFileSync(file, 'utf8') })
  }
  return out
}

/**
 * Split a file into its exported components, each with its own source span.
 *
 * A component's span runs from its `export function X` / `export const X =` to the start of
 * the next top-level `export`, which is a good enough boundary for the two questions asked
 * of it (does THIS component spread onto a host tag, and is IT a forwardRef) without
 * needing a parser.
 */
function exportedComponents(file: string, source: string): ExportedComponent[] {
  const starts: { name: string; index: number }[] = []
  for (const m of source.matchAll(/^export (?:function|const) ([A-Z]\w*)/gm)) {
    starts.push({ name: m[1]!, index: m.index! })
  }
  return starts.map((s, i) => ({
    file,
    name: s.name,
    source: source.slice(s.index, starts[i + 1]?.index ?? source.length),
  }))
}

/**
 * The intrinsic element that receives `{...props}` within this component, if exactly one
 * does. Null when the spread lands on a wrapper `<div>`/`<span>`, on another component, or
 * on more than one element — all cases where "the ref target" is not self-evident.
 */
function singleHostSpread(source: string): string | null {
  const hosts = new Set<string>()
  for (const match of source.matchAll(/\{\.\.\.(?:props|rest)\}/g)) {
    const before = source.slice(0, match.index)
    const open = before.lastIndexOf('<')
    if (open === -1) continue
    const tag = /^<([a-zA-Z][\w.-]*)/.exec(before.slice(open))?.[1]
    if (tag && HOST_TAGS.includes(tag)) hosts.add(tag)
  }
  return hosts.size === 1 ? [...hosts][0]! : null
}

function allComponents(): ExportedComponent[] {
  return componentFiles().flatMap((f) => exportedComponents(f.name, f.source))
}

describe('ref-parity — single-host components forward a ref', () => {
  it('every exported component spreading props onto one intrinsic element is a forwardRef', () => {
    const missing: string[] = []
    for (const c of allComponents()) {
      if (c.name in ALLOWLIST) continue
      const host = singleHostSpread(c.source)
      if (host === null) continue
      if (/\bforwardRef\b/.test(c.source)) continue
      missing.push(`${c.file}: ${c.name} (spreads onto <${host}>)`)
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
        `Or add the component to ALLOWLIST with a reason.\nMissing:\n  ${missing.join('\n  ')}`,
    )
  })

  it('splits files into exported components (guards against passing vacuously)', () => {
    const all = allComponents()
    assert.ok(
      all.length >= 150,
      `expected 150+ exported components across the catalog, found ${all.length}`,
    )
    // The two files an earlier revision had to allowlist wholesale, precisely because it
    // could not see subcomponents. If this ever stops finding them, the split has broken.
    for (const expected of ['AccordionTrigger', 'TabsTrigger', 'AccordionItem']) {
      assert.ok(
        all.some((c) => c.name === expected),
        `${expected} not found — the per-export split is not working`,
      )
    }
  })
})
