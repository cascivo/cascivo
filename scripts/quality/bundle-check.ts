/**
 * JS bundle budgets for every published package.
 *
 * **This used to measure almost nothing and say so quietly.** The budget list hardcoded
 * `packages/react/dist/index.mjs` and `packages/charts/dist/index.mjs`; the real build emits
 * `dist/index.js`. So the two largest packages in the project resolved to a missing file on
 * every run — and a miss only printed `⚠ dist not found … build first` and *continued*, so
 * CI stayed green while measuring one small package. `@cascivo/editor` was configured with
 * the correct filename, which is exactly why the typo survived: the output looked plausible.
 *
 * Two structural changes stop that recurring:
 *
 * 1. **Entries are resolved from each `package.json`'s `exports`**, never hardcoded. A future
 *    entry rename moves the measurement with it instead of silently un-measuring the package.
 * 2. **An unmeasurable package is a failure, not a warning.** "Build first" is a real error:
 *    a budget check that skips what it cannot find provides no signal at all.
 *
 * Every non-private package must therefore be measured or explicitly classified in
 * `NO_JS_BUDGET` with a reason.
 *
 * Run: `pnpm audit:bundle` (needs a prior `pnpm build`).
 */
import { gzipSync } from 'node:zlib'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PACKAGES = join(ROOT, 'packages')

/**
 * Gzipped-KB ceilings, keyed by package name. Set from measured reality with headroom;
 * raise deliberately with a note, never to make a red run green.
 */
/*
 * Every published package's output is compacted, by one of two mechanisms depending on how
 * it builds: `scripts/build/minify.ts` on the rolldown output for the `vp build` packages,
 * `vp pack --minify` in the build script for the rest. The figures below are all minified
 * and comparable.
 */
const BUDGETS: Record<string, number> = {
  // Code-split barrel: the figure is the whole library in ONE environment (see measureTree —
  // it used to sum the browser tree and its `node/` twin, which no app loads together), so it
  // is what an app importing every component would pay. Real apps tree-shake to a fraction —
  // see docs/GETTING-STARTED.md.
  //
  // Measured 86.8 KB, 2026-09, after the emitted chunks started being minified properly (see
  // packages/react/vite.config.ts — they used to ship with every newline and indent intact).
  // Every earlier note on this line was wrong in the same direction: 160.6 KB was stale, the
  // 200 that replaced it was set against a double-counted number, and the 130 after that was
  // set against un-minified output.
  //
  // For reference against the next change: the 2026-09 accessibility pass on eight
  // interactive components (multi-select, combobox, color-picker, calendar, date-picker,
  // carousel, tree-view, file-uploader) cost 7.4 KB of this — keyboard models, the pure
  // helpers they are tested through, and a second copy of `option-list`/`list-nav`, which is
  // what registry folders staying self-contained under copy-paste costs.
  '@cascivo/react': 110,
  '@cascivo/charts': 55, // measured 32.5
  /*
   * Almost entirely data, not code. Twelve themes are resolved to literal palettes at build
   * time (~290 tokens each) so an email never has to carry a custom property, and that table
   * is the bulk of the module. The primitives and the renderer are a few KB.
   *
   * It is also a **server-side** package: an email is rendered where it is sent, so this
   * never reaches a browser bundle. The budget exists to catch the palettes growing
   * unnoticed, not to protect a page load.
   */
  '@cascivo/email': 30,
  '@cascivo/icons': 55, // measured 38.2 (~440 icons; consumers tree-shake per icon)
  '@cascivo/mcp': 30, // measured 13.7
  '@cascivo/editor': 20, // measured 10.4
  '@cascivo/flow': 16, // measured 7.7
  '@cascivo/core': 12, // measured 6.7
  '@cascivo/i18n': 10, // measured 5.8
  '@cascivo/registry': 10, // measured 4.1
  '@cascivo/ai': 6, // measured 1.3
  '@cascivo/storage': 5, // measured 0.4
  '@cascivo/vite-plugin': 5, // measured 0.6
  '@cascivo/eslint-config': 5, // measured 2.0 — plain config data, but still worth a ceiling
  // Lints, never ships to a browser. The ceiling is for the generated data files: a
  // near-misses list that grew to hundreds of rows would be a design problem, not a size one.
  //
  // Raised 8 → 12 when `cascivo/token-values` landed (measured 8.2 KB). The growth is two
  // rules where there was one, plus `token-catalog.json`'s 342 token names — intended, and
  // the data half is already minimal: names are stored without the shared `--cascivo-`
  // prefix, and the rule carries no value→token map (that overlaps `cascivo audit --ai`'s
  // `hardcoded-value`, which can scope by CSS property). What is left is mostly the rules'
  // own rationale comments, which this repo requires and which no adopter downloads over a
  // slow connection. Headroom is deliberately small so unbounded data growth still trips.
  '@cascivo/eslint-plugin': 12,
  // The CLI runs in Node, so its size is not an adopter's browser cost. It gets a budget
  // anyway: a measured number beats an exemption, and a runaway CLI bundle is still a
  // regression worth catching. Measured 25.0 KB.
  cascivo: 45,
}

/**
 * Gzipped-KB ceilings for the LARGEST single stylesheet a package exports — the sheet an
 * adopter pays for on the "one import" path.
 *
 * CSS had no ceiling anywhere in CI until 2026-08-14, which is how `@cascivo/react`'s
 * 328 KB aggregate came to be the documented SSR recipe: a one-card page shipped ~384 KB of
 * CSS and nothing objected. Every package that exports a `.css` subpath must appear here.
 * The largest sheet is measured rather than the sum, because the exported sheets overlap
 * (the aggregate is a concatenation of the per-component ones) and a consumer imports one.
 */
const CSS_BUDGETS: Record<string, number> = {
  // The full-catalog aggregate: every component's CSS plus tokens and the light/dark themes.
  // For no-bundler / CDN setups only — bundled apps get per-component CSS through the module
  // graph and tree-shake it. Measured 47.0 KB gzip (328 KB raw).
  '@cascivo/react': 60,
  '@cascivo/charts': 30,
  '@cascivo/editor': 15,
  '@cascivo/flow': 15,
  // Source stylesheets, so the largest single file is one theme, not the bundle: `all.css`
  // and `light-dark.css` are @import manifests a few hundred bytes long.
  '@cascivo/themes': 6,
  '@cascivo/tokens': 8,
  '@cascivo/platform': 8,
  '@cascivo/icons': 4, // glyphs.css — the optional icon-font sheet. Measured 1.3 KB gzip.
}

/** Published packages that ship no JS entry, with why. Anything else must be measured. */
const NO_JS_BUDGET: Record<string, string> = {
  '@cascivo/tokens': 'CSS-only — exports src/index.css, no JS entry',
  '@cascivo/themes': 'CSS-only — twelve theme stylesheets, no JS entry',
  '@cascivo/platform': 'CSS-only — platform geometry/motion stylesheets, no JS entry',
  '@cascivo/docs': 'content-only — markdown + JSON reference bundle, no JS entry',
  '@cascivo/docspack':
    'content-only — .llms/ chunk markdown + manifest for the docspack indexer, no JS entry',
}

interface PackageJson {
  name?: string
  private?: boolean
  main?: string
  exports?: Record<string, unknown>
}

function readPackages(): Array<{ dir: string; pkg: PackageJson }> {
  const out: Array<{ dir: string; pkg: PackageJson }> = []
  for (const entry of readdirSync(PACKAGES)) {
    const file = join(PACKAGES, entry, 'package.json')
    if (!existsSync(file)) continue
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as PackageJson
    if (pkg.name === undefined || pkg.private === true) continue
    out.push({ dir: join(PACKAGES, entry), pkg })
  }
  return out
}

/**
 * The package's runtime JS entry, resolved from `exports["."]` (browser conditions first,
 * so a `node` twin is not measured in place of the shipped bundle) and falling back to
 * `main`. Returns null when the entry is not JS — a CSS-only package.
 */
function jsEntry(pkg: PackageJson): string | null {
  const dot = pkg.exports?.['.']
  const candidates: unknown[] =
    typeof dot === 'object' && dot !== null
      ? [
          (dot as Record<string, unknown>)['import'],
          (dot as Record<string, unknown>)['default'],
          (dot as Record<string, unknown>)['require'],
        ]
      : [dot, pkg.main]
  for (const c of candidates) {
    if (typeof c !== 'string') continue
    if (/\.(m?js|cjs)$/.test(c)) return c
    if (c.endsWith('.css')) return null
  }
  return null
}

/**
 * Every distinct stylesheet reachable through the package's `exports` map. Resolved from
 * `exports` for the same reason `jsEntry` is: a renamed sheet moves the measurement with it
 * instead of silently un-measuring the package.
 */
function cssEntries(pkg: PackageJson): string[] {
  const out = new Set<string>()
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      if (value.endsWith('.css')) out.add(value)
      return
    }
    if (typeof value === 'object' && value !== null) {
      for (const v of Object.values(value as Record<string, unknown>)) visit(v)
    }
  }
  visit(pkg.exports)
  return [...out]
}

/** Every `.js`/`.mjs` under a directory — for a code-split barrel whose entry is a stub. */
function allJs(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...allJs(full))
    else if (/\.m?js$/.test(entry) && !entry.endsWith('.d.js')) out.push(full)
  }
  return out
}

function gzipKB(files: string[]): number {
  const joined = Buffer.concat(files.map((f) => readFileSync(f)))
  return gzipSync(joined).length / 1024
}

/**
 * The size of a code-split tree, counting each byte once per *environment*.
 *
 * A CSS-shipping package ships its browser chunks plus a CSS-free `node/` twin of every one
 * of them, selected by the `node` export condition. No app ever loads both: a browser
 * resolves `import`/`default` to the browser tree, an SSR/RSC render resolves `node` to the
 * twin, on the server, where browser bytes are not the cost anyway. Summing the two budgeted
 * a payload nobody receives — and, being roughly 2x the truth, it read as a plausible number
 * rather than an obviously wrong one for as long as it existed. It first bit in 2026-09, when
 * a 7.5 KB change presented as 15 KB and blew a ceiling it was nowhere near.
 *
 * Take the larger of the two, so the ceiling still binds whichever tree grows.
 */
function measureTree(distDir: string, treeFiles: string[]): { kb: number; scope: string } {
  const twinPrefix = join(distDir, 'node') + sep
  const twin = treeFiles.filter((f) => f.startsWith(twinPrefix))
  if (twin.length === 0) {
    return { kb: gzipKB(treeFiles), scope: `whole tree, ${treeFiles.length} chunks` }
  }
  const browser = treeFiles.filter((f) => !f.startsWith(twinPrefix))
  const browserKB = gzipKB(browser)
  const twinKB = gzipKB(twin)
  return {
    kb: Math.max(browserKB, twinKB),
    scope:
      `larger tree of ${browser.length} browser / ${twin.length} node chunks — ` +
      `browser ${browserKB.toFixed(1)} KB, node ${twinKB.toFixed(1)} KB`,
  }
}

const failures: string[] = []
const measured: string[] = []

for (const { dir, pkg } of readPackages()) {
  const name = pkg.name!
  const skipReason = NO_JS_BUDGET[name]
  const entry = jsEntry(pkg)

  if (entry === null) {
    if (skipReason === undefined) {
      failures.push(
        `${name}: no JS entry resolved from package.json exports, and no NO_JS_BUDGET reason. ` +
          `Either it ships JS (fix its exports) or it does not (add a reason).`,
      )
    } else {
      measured.push(`– ${name}: no JS budget (${skipReason})`)
    }
    continue
  }

  if (skipReason !== undefined) {
    failures.push(
      `${name}: listed in NO_JS_BUDGET ("${skipReason}") but its exports resolve a JS entry ` +
        `(${entry}). Remove the entry from NO_JS_BUDGET, or give it a budget.`,
    )
    continue
  }

  const entryPath = join(dir, entry)
  if (!existsSync(entryPath)) {
    // Previously a `⚠ … build first` that let the run pass. It is the failure mode that hid
    // the filename typo for as long as it existed.
    failures.push(
      `${name}: entry ${entry} does not exist (resolved from package.json exports). ` +
        `Run \`pnpm build\` first — a budget check that skips a package measures nothing.`,
    )
    continue
  }

  const budget = BUDGETS[name]
  if (budget === undefined) {
    failures.push(`${name}: ships a JS entry (${entry}) but has no budget. Add one to BUDGETS.`)
    continue
  }

  // A barrel that re-exports per-component chunks gzips to ~100 bytes on its own, which is a
  // meaningless number to budget. When the entry is that small next to its own directory,
  // measure the tree instead.
  const distDir = dirname(entryPath)
  const entryKB = gzipKB([entryPath])
  const treeFiles = allJs(distDir)
  const codeSplit = entryKB < 1 && treeFiles.length > 1
  const { kb, scope } = codeSplit ? measureTree(distDir, treeFiles) : { kb: entryKB, scope: entry }

  if (kb > budget) {
    failures.push(`${name}: ${kb.toFixed(1)} KB gzip > budget ${budget} KB (${scope})`)
  } else {
    measured.push(`✓ ${name}: ${kb.toFixed(1)} KB gzip (budget ${budget} KB — ${scope})`)
  }
}

for (const { dir, pkg } of readPackages()) {
  const name = pkg.name!
  const sheets = cssEntries(pkg)
  const budget = CSS_BUDGETS[name]

  if (sheets.length === 0) {
    if (budget !== undefined) {
      failures.push(`${name}: has a CSS budget but exports no .css subpath. Remove the budget.`)
    }
    continue
  }
  if (budget === undefined) {
    failures.push(
      `${name}: exports ${sheets.length} stylesheet(s) but has no budget. Add one to CSS_BUDGETS.`,
    )
    continue
  }

  const missing = sheets.filter((s) => !existsSync(join(dir, s)))
  if (missing.length > 0) {
    failures.push(
      `${name}: exported stylesheet(s) missing — ${missing.join(', ')}. Run \`pnpm build\` first; ` +
        'a budget check that skips a package measures nothing.',
    )
    continue
  }

  let largest = sheets[0]!
  let largestKB = 0
  for (const sheet of sheets) {
    const kb = gzipKB([join(dir, sheet)])
    if (kb > largestKB) {
      largestKB = kb
      largest = sheet
    }
  }

  if (largestKB > budget) {
    failures.push(`${name}: CSS ${largestKB.toFixed(1)} KB gzip > budget ${budget} KB (${largest})`)
  } else {
    measured.push(
      `✓ ${name}: CSS ${largestKB.toFixed(1)} KB gzip (budget ${budget} KB — largest of ` +
        `${sheets.length} exported sheet(s), ${largest})`,
    )
  }
}

for (const line of measured.sort()) console.log(line)

/** A budget for a package that no longer exists is a stale ceiling nobody is checking. */
const known = new Set(readPackages().map(({ pkg }) => pkg.name))
const stale = [...Object.keys(BUDGETS), ...Object.keys(NO_JS_BUDGET)].filter((n) => !known.has(n))
if (stale.length > 0) {
  failures.push(`Stale entries for packages that no longer exist: ${stale.join(', ')}`)
}

if (failures.length > 0) {
  console.error(`\nBundle budget failures:\n${failures.map((f) => `  ✗ ${f}`).join('\n')}`)
  process.exit(1)
}
console.log(`\nAll ${measured.length} published package(s) accounted for, within budget.`)
