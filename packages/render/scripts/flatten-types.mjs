// Roll the published types up into one self-contained dist/<entry>.d.ts per entry, so the
// published surface never leaks the monorepo layout or a hashed shared-types chunk (which would
// also churn api-surface.json on every rebuild). Same shape as
// packages/text/scripts/flatten-types.mjs.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const isWin = process.platform === 'win32'
const pkgRoot = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(pkgRoot, 'dist')
const outDir = mkdtempSync(join(tmpdir(), 'cascivo-render-dts-'))

// Every published entry in package.json `exports`.
const ENTRIES = [
  { name: 'index', src: 'src/index.ts' },
  { name: 'view-text', src: 'src/view-text.ts' },
]

try {
  for (const entry of ENTRIES) {
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
        entry.src,
      ],
      // pnpm is pnpm.cmd on Windows; .cmd files require a shell on Node >= 22.
      { cwd: pkgRoot, stdio: 'inherit', shell: isWin },
    )
    const bundled = readFileSync(join(outDir, `${entry.name}.d.mts`), 'utf8')
    // Drop vp's `//#region <source path>` comments so no source paths reach the package.
    const cleaned = bundled
      .split('\n')
      .filter((line) => !/^\s*\/\/#(region|endregion)\b/.test(line))
      .join('\n')
    writeFileSync(join(distDir, `${entry.name}.d.ts`), cleaned)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
  rmSync(join(distDir, 'types'), { recursive: true, force: true })
}
