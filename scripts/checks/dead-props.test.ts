/**
 * Dead-props guard — a prop a component declares must be a prop the component reads.
 *
 * `PopoverTriggerProps` declared `asChild?: boolean`. It was typed, it had TSDoc, it was
 * accepted at runtime — and the implementation destructured `{ children }` and never
 * looked at it, so the trigger always wrapped its child in its own `<button>`. Passing
 * `<IconButton>` produced a `<button>` nested inside a `<button>`: invalid HTML, and a
 * real accessibility defect, because the inner element's `aria-label` is exactly the
 * accessible name a screen reader needs and it was orphaned somewhere the a11y tree does
 * not expect to find it. The 2026-07-28 adopter proved the prop was inert by diffing the
 * rendered `outerHTML` with and without it: byte-identical (report C19).
 *
 * That is Mechanism A — a behavioral claim that exists only as prose. The type said the
 * Slot pattern was supported; nothing checked that any code implemented it. `Slot` had
 * existed in `@cascivo/core` the whole time and seven other components used it correctly.
 *
 * The rule: every prop on an exported `…Props` interface must appear as an identifier in
 * **that interface's own component function**. A rest element (`...props`, `...rest`) in
 * the parameter destructuring consumes everything not explicitly named, so a component
 * that spreads the remainder is satisfied — the props genuinely do reach the DOM.
 *
 * The scope has to be the component, not the file. `popover.tsx` exports three components
 * and the *first* of them (`Popover`) spreads `...options`, so a file-level rest check
 * skips the whole file and never looks at `PopoverTrigger` — i.e. it would have passed
 * clean over the exact defect it exists to catch. The component is found by name from the
 * interface (`PopoverTriggerProps` → `PopoverTrigger`), the same derivation
 * `aschild-docs.test.ts` uses.
 *
 * Deliberately conservative: a prop is flagged only when it appears nowhere in its own
 * component, and a component whose function cannot be located by name is skipped. A noisy
 * guard gets allowlisted into uselessness, and this defect is always this stark.
 *
 * Run: `pnpm dead-props:check` (also in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const SOURCE_DIRS = [
  join(REPO_ROOT, 'packages/components/src'),
  join(REPO_ROOT, 'packages/layouts/src'),
  join(REPO_ROOT, 'packages/charts/src'),
]

/**
 * Props that are declared but intentionally unread, with the reason.
 *
 * Keep this small and justified. "It's hard to detect" is not a reason — fix the
 * detector. "The prop is consumed by a sibling component through context" is.
 */
const ALLOWLIST: Record<string, string> = {}

interface Offender {
  file: string
  interfaceName: string
  prop: string
}

function tsxFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__fixtures__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full))
    else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) out.push(full)
  }
  return out
}

/** Source with comments and string/template literals blanked, for identifier scanning. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:[^`\\]|\\[\s\S])*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
}

/** `export interface FooProps { … }` blocks, as [name, body] pairs. */
function exportedPropsInterfaces(source: string): [string, string][] {
  const out: [string, string][] = []
  for (const match of source.matchAll(/export\s+interface\s+(\w+Props)\b[^{]*\{/g)) {
    const open = source.indexOf('{', match.index)
    let depth = 0
    for (let i = open; i < source.length; i++) {
      if (source[i] === '{') depth++
      else if (source[i] === '}' && --depth === 0) {
        out.push([match[1]!, source.slice(open + 1, i)])
        break
      }
    }
  }
  return out
}

/**
 * Own property names declared directly in an interface body.
 *
 * Nested object-type members (`secondAxis?: { format?: … }`) are skipped by ignoring
 * anything inside a brace — only the outer property is the component's own prop.
 */
function declaredProps(body: string): string[] {
  const flat = body.replace(/\{[^{}]*\}/g, '{}')
  const names = new Set<string>()
  for (const match of flat.matchAll(/(?:^|[;\n])\s*(?:readonly\s+)?(\w+)\??\s*:/g)) {
    names.add(match[1]!)
  }
  return [...names]
}

/**
 * The full text of the component function named `name`, or null if it can't be located.
 *
 * Matches both shapes in this catalog: `function Foo(` (plain, and the inner function of a
 * `forwardRef(function Foo(…))`) and `const Foo = ` (arrow / `forwardRef(...)` assignment).
 * Brace-matches from the first `{` after the match, which for an arrow component is the
 * parameter destructuring — harmless, since the destructuring is exactly what we need to
 * inspect and the body follows inside the same span for every shape here.
 */
function componentSource(code: string, name: string): string | null {
  const match = code.match(new RegExp(`(?:function|const)\\s+${name}\\b`))
  if (match?.index === undefined) return null
  const open = code.indexOf('{', match.index)
  if (open === -1) return null
  let depth = 0
  for (let i = open; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}' && --depth === 0) {
      // For an arrow/forwardRef component the first brace-balanced span is the parameter
      // destructuring; the body starts right after. Take everything to the end of the
      // enclosing declaration so both are covered.
      const rest = code.slice(i + 1)
      const bodyOpen = rest.indexOf('{')
      if (bodyOpen === -1 || bodyOpen > 200) return code.slice(match.index, i + 1)
      let bodyDepth = 0
      for (let j = bodyOpen; j < rest.length; j++) {
        if (rest[j] === '{') bodyDepth++
        else if (rest[j] === '}' && --bodyDepth === 0) {
          return code.slice(match.index, i + 1) + rest.slice(0, j + 1)
        }
      }
      return code.slice(match.index)
    }
  }
  return null
}

function findOffenders(): Offender[] {
  const offenders: Offender[] = []
  for (const dir of SOURCE_DIRS) {
    for (const file of tsxFiles(dir)) {
      const raw = readFileSync(file, 'utf8')
      const code = codeOnly(raw)

      for (const [interfaceName, body] of exportedPropsInterfaces(raw)) {
        // `PopoverTriggerProps` → `PopoverTrigger`; `IconButtonBaseProps` → `IconButton`.
        const componentName = interfaceName.replace(/Props$/, '').replace(/Base$/, '')
        const implementation = componentSource(code, componentName)
        if (implementation === null) continue // not a component, or an unrecognised shape
        // A rest element in this component's own destructuring forwards the remainder.
        if (/\.\.\.\w+\s*[,}]/.test(implementation)) continue

        for (const prop of declaredProps(body)) {
          if (`${interfaceName}.${prop}` in ALLOWLIST) continue
          if (new RegExp(`\\b${prop}\\b`).test(implementation)) continue
          offenders.push({ file: relative(REPO_ROOT, file), interfaceName, prop })
        }
      }
    }
  }
  return offenders
}

describe('dead-props — every declared prop is read by its component', () => {
  it('no exported props interface declares a prop the implementation never reads', () => {
    const offenders = findOffenders()
    assert.deepEqual(
      offenders.map((o) => `${o.file}: ${o.interfaceName}.${o.prop}`),
      [],
      'These props are declared on an exported interface and never referenced by the ' +
        'component. A typed, documented prop that does nothing is worse than no prop: the ' +
        'consumer writes code that compiles, reads correct, and silently has no effect — ' +
        "`PopoverTrigger`'s `asChild` shipped that way and produced nested <button>s " +
        '(2026-07-28 report C19).\n' +
        'Either implement it, delete it, or add `"<Interface>.<prop>": "<reason>"` to ' +
        `ALLOWLIST in this file. Offenders:\n  ${offenders
          .map((o) => `${o.file}: ${o.interfaceName}.${o.prop}`)
          .join('\n  ')}`,
    )
  })

  // Reproduces `popover.tsx` as it shipped in 0.13.0: three components in one file, the
  // FIRST of which (`Popover`) spreads `...options` while the offender (`PopoverTrigger`)
  // does not. A file-level rest check passes clean here — which is why the real check is
  // per-component. If this ever stops failing, the guard has gone blind to its own case.
  it('flags a dead prop even when a sibling component in the same file spreads a rest', () => {
    const source = [
      'export interface PopoverProps extends UsePopoverOptions {',
      '  children: ReactNode',
      '}',
      'export function Popover({ children, ...options }: PopoverProps) {',
      '  const popover = usePopover(options)',
      '  return <Ctx.Provider value={popover}>{children}</Ctx.Provider>',
      '}',
      '',
      'export interface PopoverTriggerProps {',
      '  children: ReactNode',
      '  asChild?: boolean',
      '}',
      '',
      'export function PopoverTrigger({ children }: PopoverTriggerProps) {',
      '  return <button>{children}</button>',
      '}',
    ].join('\n')

    const code = codeOnly(source)
    const dead: string[] = []
    for (const [interfaceName, body] of exportedPropsInterfaces(source)) {
      const implementation = componentSource(code, interfaceName.replace(/Props$/, ''))
      assert.ok(implementation !== null, `componentSource() could not locate ${interfaceName}`)
      if (/\.\.\.\w+\s*[,}]/.test(implementation)) continue
      for (const prop of declaredProps(body)) {
        if (!new RegExp(`\\b${prop}\\b`).test(implementation)) {
          dead.push(`${interfaceName}.${prop}`)
        }
      }
    }
    assert.deepEqual(
      dead,
      ['PopoverTriggerProps.asChild'],
      'the guard must flag PopoverTrigger.asChild while ignoring Popover, which spreads',
    )
  })
})
