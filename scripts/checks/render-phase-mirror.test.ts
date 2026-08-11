/**
 * Render-phase prop-mirror guard.
 *
 * `CLAUDE.md` forbids hand-rolling `const s = useSignal(prop); s.value = prop` and points at
 * `useControllableSignal` (render reads) or `useEffectPropSignal` (effect reads). Nothing
 * checked it, so `DataTable` shipped four of them and the middle one made the documented
 * controlled-selection API log "Cannot update a component while rendering a different
 * component" on every click under React 19 (2026-08-08 report A). Eight more components
 * carried the same shape.
 *
 * Why the write is not merely untidy: a signal write during render notifies the
 * subscriptions opened by the PREVIOUS render, so the signals runtime calls
 * `forceStoreRerender` from inside the current render pass — a setState-in-render that React
 * 19 reports and that concurrent rendering can tear.
 *
 * What this cannot see: writes inside event handlers and `useSignalEffect` bodies are legal
 * and are excluded by the brace-depth heuristic below. It is deliberately conservative —
 * a statement-level write in a component body is unambiguous, and that is the whole
 * population of the defect.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SCAN = ['packages/components/src', 'packages/charts/src', 'packages/layouts/src']

/**
 * Files that own the pattern rather than repeat it. Each needs a reason, and the list is
 * asserted to stay small — an allowlist that grows is how a guard becomes decoration.
 */
const ALLOWLIST = new Map<string, string>([
  // The primitives CLAUDE.md tells everyone else to use. The mirror lives here on purpose,
  // guarded by an Object.is check so an unchanged value never notifies.
  ['packages/core/src/controllable.ts', 'the sanctioned controlled-prop mirror'],
  ['packages/core/src/effect-prop.ts', 'the sanctioned deferred mirror'],
  ['packages/core/src/machine.ts', 'FSM transition, not a prop mirror'],
  ['packages/core/src/theme.tsx', 'theme store reconciliation, covered by theme tests'],
])

function walk(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full)
  }
  return out
}

/**
 * A statement-level signal write to a bare identifier or member expression, at the top level
 * of a function body (one indent level). Handler bodies and effect callbacks are nested
 * deeper, so they do not match.
 */
const BARE_MIRROR = /^ {2}(?:if \([^)]*\) )?([A-Za-z_$][\w$]*)\.value = (?!.*\?\?)([^=\n]+)$/

/** `const x = useSignal(...)` — the other half of the shape. */
const SIGNAL_DECL = /^\s*const ([A-Za-z_$][\w$]*) = useSignal[<(]/

describe('no hand-rolled render-phase prop mirrors', () => {
  const files = SCAN.flatMap((d) => walk(join(ROOT, d)))

  it('scans a plausible number of files', () => {
    assert.ok(files.length > 100, `only ${files.length} source files found — walker broken?`)
  })

  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll('\\', '/')
    if (ALLOWLIST.has(rel)) continue
    const source = readFileSync(file, 'utf8')
    if (!/\.value = /.test(source)) continue

    it(`${rel} mirrors controlled props through a primitive`, () => {
      const lines = source.split('\n')
      const declared = new Set<string>()
      for (const line of lines) {
        const decl = SIGNAL_DECL.exec(line)
        if (decl) declared.add(decl[1]!)
      }

      const offenders: string[] = []
      for (const [i, line] of lines.entries()) {
        const m = BARE_MIRROR.exec(line)
        if (!m) continue
        const [, target, rhs] = m
        if (!declared.has(target!)) continue
        // A write of a locally computed value is state, not a prop mirror. Prop mirrors
        // assign a bare identifier or a property path — never a call or an expression.
        if (!/^[A-Za-z_$][\w$.?]*$/.test(rhs!.trim())) continue
        offenders.push(`${rel}:${i + 1}  ${line.trim()}`)
      }

      assert.deepEqual(
        offenders,
        [],
        `Hand-rolled render-phase prop mirror.\n${offenders.join('\n')}\n\n` +
          "A signal write during render notifies the previous render's subscriptions, which " +
          'React 19 reports as "Cannot update a component while rendering a different ' +
          'component". Use `useControllableSignal` (value read during render), ' +
          '`useEffectPropSignal` (value read only inside useSignalEffect), or read the prop ' +
          "directly when nothing derives from it — see DataTable's selection.",
      )
    })
  }

  it('the allowlist stays small', () => {
    assert.ok(
      ALLOWLIST.size <= 4,
      `allowlist has grown to ${ALLOWLIST.size} — migrate the call site instead of exempting it`,
    )
  })
})
