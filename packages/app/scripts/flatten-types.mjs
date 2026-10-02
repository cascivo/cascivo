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
const outDir = mkdtempSync(join(tmpdir(), 'cascivo-app-dts-'))

// Every published entry in package.json `exports`.
const ENTRIES = [
  { name: 'index', src: 'src/index.ts' },
  { name: 'api', src: 'src/api.ts' },
  { name: 'sync', src: 'src/sync.ts' },
  { name: 'sync-server', src: 'src/sync-server.ts' },
  { name: 'flags', src: 'src/flags.ts' },
  { name: 'jobs', src: 'src/jobs.ts' },
  { name: 'jobs-server', src: 'src/jobs-server.ts' },
  { name: 'uploads', src: 'src/uploads.ts' },
  { name: 'uploads-server', src: 'src/uploads-server.ts' },
  { name: 'export', src: 'src/export.ts' },
  { name: 'analytics', src: 'src/analytics.ts' },
  { name: 'db', src: 'src/db.ts' },
  { name: 'guard', src: 'src/guard.ts' },
  { name: 'ses', src: 'src/ses.ts' },
  { name: 'stripe', src: 'src/stripe.ts' },
  { name: 'turnstile', src: 'src/turnstile.ts' },
  { name: 'auth', src: 'src/auth.ts' },
  { name: 'auth-server', src: 'src/auth-server.ts' },
  { name: 'live', src: 'src/live.ts' },
  { name: 'live-server', src: 'src/live-server.ts' },
  { name: 'vite', src: 'src/vite.ts' },
]

/** Exit status of a process that aborted (SIGABRT, core dumped). */
const ABORTED = 134

function pack(src) {
  execFileSync(
    'pnpm',
    ['exec', 'vp', 'pack', '--out-dir', isWin ? `"${outDir}"` : outDir, '--dts', '--no-clean', src],
    // pnpm is pnpm.cmd on Windows; .cmd files require a shell on Node >= 22.
    { cwd: pkgRoot, stdio: 'inherit', shell: isWin },
  )
}

try {
  for (const entry of ENTRIES) {
    try {
      pack(entry.src)
    } catch (error) {
      // `vp pack` intermittently aborts with "thread '<unknown>' has overflowed its stack"
      // while starting up, before it reads the entry (seen on CI for jobs.ts and guard.ts,
      // locally for api.ts). This package starts it once per entry, 19 times, so it hits
      // that most. One retry for that abort only; any other failure, or a second abort,
      // still fails the build.
      if (error?.status !== ABORTED) throw error
      console.warn(`flatten-types: vp pack aborted on ${entry.src}; retrying once`)
      pack(entry.src)
    }
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
