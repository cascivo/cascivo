// Roll the published types up into a single, self-contained dist/index.d.ts so
// the published surface never leaks the internal monorepo layout (no
// `packages/.../src` re-exports in consumers' "Go to definition").
//
// vp pack's dts bundler inlines every declaration into one file whose only
// remaining imports are the externals (@cascivo/core, @cascivo/i18n, react) —
// i.e. the published surface. We run it for types only (the runtime js/css come
// from the preceding `vp build`, which keeps the correct charts.css name +
// 'use client' banner), strip vp's cosmetic //#region source-path comments, and
// write the result to dist/index.d.ts.
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

  writeFileSync(join(pkgRoot, 'dist', 'index.d.ts'), cleaned)
} finally {
  rmSync(outDir, { recursive: true, force: true })
  // Remove any stale nested tree from a previous tsc-based build.
  rmSync(join(pkgRoot, 'dist', 'types'), { recursive: true, force: true })
}
