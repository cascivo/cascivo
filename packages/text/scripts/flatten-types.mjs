// Roll the published types up into self-contained dist/<entry>.d.ts files so the published
// surface never leaks the internal monorepo layout (no `packages/.../src` re-exports in
// consumers' "Go to definition"). Same shape as packages/core/scripts/flatten-types.mjs —
// see that file for the full rationale.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const isWin = process.platform === 'win32'
const pkgRoot = fileURLToPath(new URL('..', import.meta.url))
const outDir = mkdtempSync(join(tmpdir(), 'cascivo-text-dts-'))

// Every published entry in package.json `exports`. `react` needs its own declaration or
// `@cascivo/text/react` resolves to nothing and <TextView> fails to type-check.
const ENTRIES = [
  { name: 'index', src: 'src/index.ts' },
  { name: 'react', src: 'src/react.tsx' },
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
      {
        cwd: pkgRoot,
        stdio: 'inherit',
        // pnpm is pnpm.cmd on Windows; .cmd files require a shell on Node >= 22.
        shell: isWin,
      },
    )

    const bundled = readFileSync(join(outDir, `${entry.name}.d.mts`), 'utf8')
    // Drop vp's `//#region <source path>` / `//#endregion` navigation comments so no
    // internal source path strings survive in the published declaration.
    const cleaned = bundled
      .split('\n')
      .filter((line) => !/^\s*\/\/#(region|endregion)\b/.test(line))
      .join('\n')

    writeFileSync(join(pkgRoot, 'dist', `${entry.name}.d.ts`), cleaned)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
  rmSync(join(pkgRoot, 'dist', 'types'), { recursive: true, force: true })
}
