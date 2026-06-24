// Release guard (v48 T1): fail if the publish tarball would ship without dist/.
// The published @cascivo/editor@0.1.1 contained only package.json/README/LICENSE
// (no dist/), so every entry point resolved to a missing file and the package
// was unimportable. Run `npm pack --dry-run --json`, collect the listed paths,
// and assert the three dist/ entry points the package's `exports` map points at
// are all present.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const pkgRoot = fileURLToPath(new URL('..', import.meta.url))

const REQUIRED = ['dist/index.js', 'dist/index.d.ts', 'dist/editor.css']

let files
try {
  // --ignore-scripts: inspect the current built tree without re-triggering the
  // package's own prepack (which would recurse into this script).
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: pkgRoot,
    encoding: 'utf8',
  })
  const parsed = JSON.parse(out)
  files = (parsed[0]?.files ?? []).map((f) => f.path.replace(/\\/g, '/'))
} catch (err) {
  console.error('✗ check-pack: failed to run `npm pack --dry-run --json`')
  console.error(err.message)
  process.exit(1)
}

const missing = REQUIRED.filter((entry) => !files.includes(entry))

if (missing.length > 0) {
  console.error('✗ check-pack: the publish tarball is missing required entry points:\n')
  for (const m of missing) console.error(`  - ${m}`)
  console.error(
    '\nThe package was built without dist/. Run `pnpm build` before packing/publishing.',
  )
  process.exit(1)
}

console.log('✓ check-pack: tarball contains dist/index.js, dist/index.d.ts, dist/editor.css')
