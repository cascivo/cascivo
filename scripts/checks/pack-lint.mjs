// Packaging gate — runs publint + are-the-types-wrong (attw) over published
// packages' packed artifacts. Catches exports-map defects: non-parallel
// types/import subtrees, missing conditions, unresolved subpaths — the class a
// TanStack Start adopter hit when `@cascivo/react`'s `import` and `types`
// resolved to different dist subtrees (2026-07-20 report, #8).
//
// This is a RELEASE / CI gate, not part of `pnpm ready`: it packs tarballs and
// needs each package's build output present, so it runs after a build. Usage:
//   node scripts/checks/pack-lint.mjs                 # @cascivo/react only (the WS5 target)
//   node scripts/checks/pack-lint.mjs --all           # every published package (release)
//   node scripts/checks/pack-lint.mjs @cascivo/react @cascivo/core
//
// attw problems we intentionally accept are filtered with a documented reason;
// everything else fails the gate.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publint } from 'publint'

const REPO = fileURLToPath(new URL('../..', import.meta.url))
const PACKAGES = join(REPO, 'packages')
const ATTW_BIN = join(REPO, 'node_modules/.bin/attw')

// attw problem kinds we accept, each with the reason it is not a defect here.
const ATTW_IGNORE = {
  // Packages are ESM-only (`"type":"module"`); CJS consumers use dynamic import.
  CJSResolvesToESM: 'packages are ESM-only by design',
}
// attw can't type-check non-JS entrypoints (CSS side-effect stylesheets).
const NON_JS_ENTRYPOINT = /\.css$/

function publishedPackages() {
  const out = []
  for (const dir of readdirSync(PACKAGES)) {
    const pkgPath = join(PACKAGES, dir, 'package.json')
    let pkg
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    } catch {
      continue
    }
    if (pkg.private === true || !pkg.exports) continue
    out.push({ name: pkg.name ?? `@cascivo/${dir}`, dir: join(PACKAGES, dir), pkg })
  }
  return out
}

/** The file the `.` import condition (or `main`) points at, if declared. */
function primaryTarget(entry) {
  const dot = entry.pkg.exports?.['.']
  const rel =
    typeof dot === 'string' ? dot : (dot?.import ?? dot?.default ?? entry.pkg.main ?? null)
  return rel ? join(entry.dir, rel) : null
}

function runPublint(dir) {
  return publint({ pkgDir: dir, strict: true }).then(({ messages }) =>
    messages
      .filter((m) => m.type === 'error' || m.type === 'warning')
      .map((m) => `publint ${m.type}: ${m.code} ${JSON.stringify(m.args ?? {})}`),
  )
}

function runAttw(dir) {
  // attw exits non-zero when it finds problems, but still writes the JSON report
  // to stdout — capture it from the thrown error rather than treating exit≠0 as
  // a run failure. A genuinely broken invocation has no parseable stdout.
  let raw
  try {
    raw = execFileSync(ATTW_BIN, ['--pack', dir, '--format', 'json'], { encoding: 'utf8' })
  } catch (err) {
    raw = typeof err?.stdout === 'string' ? err.stdout : ''
    if (!raw) return [`attw failed to run: ${err instanceof Error ? err.message : String(err)}`]
  }
  const parsed = JSON.parse(raw)
  const problems = parsed.analysis?.problems ?? parsed.problems ?? []
  return problems
    .filter((p) => !(p.kind in ATTW_IGNORE))
    .filter((p) => !(p.entrypoint && NON_JS_ENTRYPOINT.test(p.entrypoint)))
    .map((p) => `attw ${p.kind} @ ${p.entrypoint ?? '?'} (${p.resolutionKind ?? '?'})`)
}

async function main() {
  const args = process.argv.slice(2)
  const all = args.includes('--all')
  const names = args.filter((a) => !a.startsWith('--'))
  const published = publishedPackages()
  const targets = all
    ? published
    : names.length > 0
      ? published.filter((p) => names.includes(p.name))
      : published.filter((p) => p.name === '@cascivo/react')

  if (targets.length === 0) {
    console.error(
      `pack-lint: no matching published packages for ${names.join(', ') || '(default)'}`,
    )
    process.exit(1)
  }

  let failed = false
  for (const entry of targets) {
    const target = primaryTarget(entry)
    if (target && !existsSync(target)) {
      console.error(`✗ ${entry.name}: build output missing (${target}) — build before pack-lint.`)
      failed = true
      continue
    }
    const problems = [...(await runPublint(entry.dir)), ...runAttw(entry.dir)]
    if (problems.length === 0) {
      console.log(`✓ ${entry.name}`)
    } else {
      failed = true
      console.error(`✗ ${entry.name}`)
      for (const p of problems) console.error(`    ${p}`)
    }
  }

  if (failed) process.exit(1)
  console.log(`pack-lint: ${targets.length} package(s) clean.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
