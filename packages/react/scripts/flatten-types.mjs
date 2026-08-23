// Roll the published types up into a single, self-contained dist/index.d.ts
// (v37 T4, #4). Previously this emitted a stub that re-exported through
// dist/types/packages/react/src/index → ../../components/src/..., leaking the
// internal monorepo layout into the published surface and sending consumers'
// "Go to definition" into dist/types/packages/components/src/.
//
// vp pack's dts bundler inlines every component declaration into one file whose
// only remaining imports are the externals (@cascivo/core, react) — i.e. the
// published surface. We run it for types only (the runtime js/css come from the
// preceding `vp build`, which keeps the correct cascivo.css name + 'use client'
// banner), strip vp's cosmetic //#region source-path comments, and write the
// result to dist/index.d.ts.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Put each named import/export specifier on its own line.
 *
 * The dts bundler emits two enormous single lines: the `import { ... } from "@cascivo/core"`
 * (~65 names, ~940 chars) and a trailing `export { ... }` naming all 197 components (~7.2 kB).
 * Both defeat grep, which is how an agent reads this file - every search for a component name
 * matched the export line and dumped the whole thing, and `grep ThemeProviderProps` found
 * nothing at all even though the name is right there in the import. An adopter reported that
 * `grep -v` on that line "became a reflex within ten minutes" (2026-08-22 report item 19).
 *
 * Formatting only: the declarations are unchanged, so this cannot affect type resolution.
 */
function explodeSpecifierList(line) {
  const m = /^(import type |import |export type |export )\{ (.+) \}( from ".+";|;)$/.exec(line)
  if (!m) return line
  const [, head, body, tail] = m
  // Bail on anything with braces or generics - those are not plain specifier lists.
  if (/[{}<>]/.test(body)) return line
  const names = body.split(', ')
  if (names.length < 4) return line
  return head + '{\n' + names.map((n) => '  ' + n + ',').join('\n') + '\n}' + tail
}

const isWin = process.platform === 'win32'
const pkgRoot = fileURLToPath(new URL('..', import.meta.url))
const outDir = mkdtempSync(join(tmpdir(), 'cascivo-react-dts-'))

try {
  // Generate the bundled .d.mts into a throwaway dir (we only keep the types).
  execFileSync(
    'pnpm',
    [
      'exec',
      'vp',
      'pack',
      '--out-dir',
      isWin ? `"${outDir}"` : outDir,
      '--dts',
      '--no-clean',
      'src/index.ts',
    ],
    {
      cwd: pkgRoot,
      stdio: 'inherit',
      // pnpm is pnpm.cmd on Windows; .cmd files require a shell on Node >= 22.
      shell: isWin,
    },
  )

  const bundled = readFileSync(join(outDir, 'index.d.mts'), 'utf8')
  // Drop vp's `//#region <source path>` / `//#endregion` navigation comments so
  // no internal source path strings survive in the published declaration.
  const cleaned = bundled
    .split('\n')
    .filter((line) => !/^\s*\/\/#(region|endregion)\b/.test(line))
    .map(explodeSpecifierList)
    .join('\n')

  // Prepend the quickstart banner (WS-B). The dts bundler drops the module-leading
  // JSDoc from src/index.ts, but `dist/index.d.ts` is the primary documentation
  // channel for AI agents / offline adopters (the ones who never reach npmjs.com or
  // cascivo.com), so the quickstart must ride at the top of the published surface.
  // `scripts/check-styles-complete.mjs` asserts the load-bearing lines survive.
  const BANNER = `/**
 * @cascivo/react — every cascivo component, prebuilt. Full API below.
 *
 * Quickstart:
 *   pnpm add @cascivo/react @preact/signals-react
 *   // @cascivo/themes is installed with @cascivo/react. Once, in your entry file:
 *   import '@cascivo/themes/light-dark.css'   // tokens + base + light & dark — REQUIRED for color
 *   // all.css is all TWELVE themes (~2x the CSS) — use it only if you ship a theme picker
 *   // No-bundler / single-file alternative (themes bundled in): '@cascivo/react/styles.css'
 *   import { Button, Card } from '@cascivo/react'
 *
 * Skip the theme import and components render grayscale (ThemeProvider warns in dev).
 *
 * Wider family (separate installs):
 *   @cascivo/charts — LineChart, AreaChart, BarChart, Sparkline, 25 chart types
 *   @cascivo/icons  — ~440 tree-shakeable SVG icons for SideNav / IconButton / Button
 *   @cascivo/themes — 12 themes; scope any with data-theme="…" on any element
 *
 * Reactivity: components are signal-driven. Without the signals Babel transform, any
 * component reading signal.value in render must call useSignals() (from @cascivo/core) first.
 *
 * Docs: https://cascivo.com/llms.txt — or fully offline, no website needed:
 *   npx -y @cascivo/docs            (index; \`npx @cascivo/docs <component>\` for one doc)
 */
`

  writeFileSync(join(pkgRoot, 'dist', 'index.d.ts'), `${BANNER}${cleaned}`)

  // `@cascivo/react/types` — the catalog vocabulary types (Tone, SpaceStep, …), which are
  // the types of published props but live in @cascivo/core, a transitive dep a prebuilt
  // adopter is told not to install (2026-08-14 §3). They cannot ride in index.d.ts: the
  // component sources already import those names from core, so a re-export makes the dts
  // bundler emit `ToneInput as ToneInput$1` and every prop switches to the aliased name —
  // measured, and rejected by check-styles-complete's WS-F rule.
  //
  // Written directly rather than bundled: the module is nothing but re-exports of external
  // types, so a dts bundler run would emit this exact line and cost a second `vp pack`.
  // `check-types-flat.mjs` asserts it names no internal source path.
  const TYPES_DTS = `/**
 * The catalog-wide vocabulary types, importable on the prebuilt path.
 *
 * \`Status.status\` and \`Badge.variant\` are \`ToneInput\`; every layout \`gap\` is a
 * \`SpaceStep\`. These declarations are the same ones the main entry's props reference, so
 * a value typed here is assignable there.
 *
 *   import type { Tone } from '@cascivo/react/types'
 *   const TONE: Record<DeployState, Tone> = { ready: 'success', error: 'danger' }
 *   <Status status={TONE[deployment.state]} />
 */
export type {
  Tone,
  ToneAlias,
  ToneInput,
  Progress,
  ProgressAlias,
  ProgressInput,
  SpaceStep,
  RovingOrientation,
} from '@cascivo/core'
`
  writeFileSync(join(pkgRoot, 'dist', 'types.d.ts'), TYPES_DTS)
  // A types-only module still needs a runtime file: `import type` is erased, but the
  // `import` condition must resolve or publint/attw flag the subpath as broken.
  writeFileSync(join(pkgRoot, 'dist', 'types.js'), 'export {}\n')
} finally {
  rmSync(outDir, { recursive: true, force: true })
  // Remove any stale nested tree from a previous tsc-based build.
  rmSync(join(pkgRoot, 'dist', 'types'), { recursive: true, force: true })
}
