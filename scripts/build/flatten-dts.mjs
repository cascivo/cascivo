// Roll each entry's types up into one self-contained dist/<name>.d.ts, so the published
// surface never leaks the monorepo layout. Same method as packages/css/scripts/flatten-types.mjs,
// shared by packages whose JS is built by `vp build` (elements, solid).
// Usage (cwd = package root): node ../../scripts/build/flatten-dts.mjs name=src/file.ts ...
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const isWin = process.platform === 'win32'
const pkgRoot = process.cwd()
const distDir = join(pkgRoot, 'dist')
const outDir = mkdtempSync(join(tmpdir(), 'cascivo-dts-'))
const entries = process.argv.slice(2).map((a) => a.split('='))

// `vp pack` intermittently aborts at startup (stack overflow, SIGABRT); one retry for that only.
const aborted = (e) => e?.status === 134 || e?.signal === 'SIGABRT'
function pack(src) {
  execFileSync(
    'pnpm',
    ['exec', 'vp', 'pack', '--out-dir', isWin ? `"${outDir}"` : outDir, '--dts', '--no-clean', src],
    { cwd: pkgRoot, stdio: 'inherit', shell: isWin },
  )
}

try {
  for (const [name, src] of entries) {
    try {
      pack(src)
    } catch (error) {
      if (!aborted(error)) throw error
      pack(src)
    }
    // `vp pack` names the output after the source file, not the entry.
    const base = src.replace(/^.*\//, '').replace(/\.tsx?$/, '')
    const bundled = readFileSync(join(outDir, `${base}.d.mts`), 'utf8')
    const cleaned = bundled
      .split('\n')
      .filter((line) => !/^\s*\/\/#(region|endregion)\b/.test(line))
      .join('\n')
    writeFileSync(join(distDir, `${name}.d.ts`), cleaned)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
