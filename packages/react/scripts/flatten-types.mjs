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
 *   import '@cascivo/themes/all.css'   // tokens + base + light & dark — REQUIRED for color
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
} finally {
  rmSync(outDir, { recursive: true, force: true })
  // Remove any stale nested tree from a previous tsc-based build.
  rmSync(join(pkgRoot, 'dist', 'types'), { recursive: true, force: true })
}
