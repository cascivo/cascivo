import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { detectPackageManager, installHint } from '../utils/config.js'
import { readInstalledPackageVersion } from '../utils/peer-versions.js'
import { compareVersions } from '../utils/semver.js'

export interface DoctorViolation {
  file: string
  rule: string
  detail: string
}

export interface DoctorResult {
  violations: DoctorViolation[]
  passed: boolean
}

/** Runtime packages **copied** cascivo source needs; the last is @cascivo/core's peer. */
const REQUIRED_RUNTIME_DEPS = [
  '@cascivo/core',
  '@cascivo/tokens',
  '@cascivo/themes',
  '@preact/signals-react',
]

/** Runtime packages a **prebuilt** (Path B) app needs. */
const REQUIRED_PREBUILT_DEPS = ['@cascivo/react', '@cascivo/themes', '@preact/signals-react']

/**
 * Packages a prebuilt app must NOT declare directly, with the rule each one breaks. They
 * are transitive there, and everything they export is re-exported from `@cascivo/react`.
 */
const FORBIDDEN_PREBUILT_DEPS: Record<string, string> = {
  '@cascivo/core':
    'AI-RULES.md: never add @cascivo/core to a prebuilt-path app — it is transitive, and everything is re-exported from @cascivo/react',
  '@cascivo/tokens':
    'GETTING-STARTED.md: @cascivo/tokens comes with @cascivo/themes as a direct dependency — never install it by hand',
}

/** Installed on demand by `cascivo add` when a component/chart declares them. */
const ON_DEMAND_DEPS = ['@cascivo/i18n', '@cascivo/charts']

export interface DependencyFinding {
  package: string
  /** true = a runtime dep whose absence breaks the build; false = advisory. */
  required: boolean
  hint: string
  /**
   * What is wrong. `'missing'` (the default) means install it; `'forbidden'` means the
   * project declares a package its install path must not. They need opposite advice, and
   * reporting both under the "not in package.json — install it" template produced a
   * self-contradicting message.
   */
  kind?: 'missing' | 'forbidden'
}

const CONFIG_FILES = ['cascivo.config.ts', 'cascivo.config.js', 'cascivo.config.mjs']

/**
 * How this project consumes cascivo.
 *
 * - `prebuilt` — Path B: depends on `@cascivo/react`, no copied source.
 * - `copied`   — Path A: has vendored component source (or no `@cascivo/react`).
 * - `hybrid`   — both: consumes the package AND copied something.
 * - `unknown`  — no evidence either way; emit no dependency advice at all.
 */
export type InstallPath = 'prebuilt' | 'copied' | 'hybrid' | 'unknown'

/**
 * Infer the install path from evidence.
 *
 * This used to be `isAdopterProject()` — "does a `cascivo.config.*` exist?" — and
 * `cascivo create` wrote that config into every scaffold, including prebuilt-path ones. So
 * every scaffolded app was judged copy-paste and told to install `@cascivo/core` and
 * `@cascivo/tokens`, which the docs explicitly forbid on that path. `doctor --ci` exited 1
 * on a correctly-installed app, which made the CI gate the docs recommend
 * (`cascivo doctor --ci && cascivo audit --ai src`) red on day one.
 *
 * A config file now only contributes evidence when it points at a directory that actually
 * contains copied source, which is what it was ever meant to signal.
 */
export function detectInstallPath(cwd: string): InstallPath {
  let deps: Record<string, unknown> = {}
  let hasPackageJson = true
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, unknown>
      devDependencies?: Record<string, unknown>
    }
    deps = { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    hasPackageJson = false
  }

  if (!hasPackageJson) return 'unknown'

  const usesPackage = deps['@cascivo/react'] !== undefined
  const copied = hasCopiedSource(cwd)

  if (usesPackage && copied) return 'hybrid'
  if (usesPackage) return 'prebuilt'
  if (copied) return 'copied'
  // No package dependency and no copied source yet. A config file alone is NOT evidence of
  // a copy-paste app — it is what `cascivo add` writes before anything has been copied, and
  // treating it as proof is precisely what broke prebuilt-path projects. Advise on nothing.
  return 'unknown'
}

/** Whether the configured output directory holds vendored component source. */
function hasCopiedSource(cwd: string): boolean {
  for (const dir of outputDirCandidates(cwd)) {
    const full = join(cwd, dir)
    if (!existsSync(full)) continue
    try {
      if (readdirSync(full).some((f) => f.endsWith('.tsx'))) return true
    } catch {
      // unreadable directory — no evidence, keep looking
    }
  }
  return false
}

/** `outputDir` from the config if it declares one, plus the documented default. */
function outputDirCandidates(cwd: string): string[] {
  const dirs = new Set<string>(['src/components/ui'])
  for (const file of CONFIG_FILES) {
    const full = join(cwd, file)
    if (!existsSync(full)) continue
    try {
      const declared = /outputDir\s*:\s*['"]([^'"]+)['"]/.exec(readFileSync(full, 'utf8'))?.[1]
      if (declared !== undefined) dirs.add(declared)
    } catch {
      // unreadable config — fall back to the default candidate
    }
  }
  return [...dirs]
}

/** Whether cwd looks like a cascivo adopter project (has a generated config). */
export function isAdopterProject(cwd: string): boolean {
  return CONFIG_FILES.some((f) => existsSync(join(cwd, f)))
}

/**
 * Check that the runtime dependencies this project's install path needs are declared in its
 * package.json — and, on the prebuilt path, that it declares none it must not.
 *
 * Turns the opaque "cannot find module '@preact/signals-react'" build failure into a
 * diagnosed condition with a fix. What it demands depends on `detectInstallPath`: requiring
 * `@cascivo/core` of a prebuilt app is not merely unhelpful, it is the opposite of what the
 * docs say, and following the advice makes a correct project wrong.
 *
 * `@cascivo/i18n`/`@cascivo/charts` stay advisory since not every project uses them, and an
 * `unknown` path emits nothing at all rather than guessing.
 */
export function checkProjectDependencies(cwd: string): DependencyFinding[] {
  let deps: Record<string, unknown> = {}
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, unknown>
      devDependencies?: Record<string, unknown>
    }
    deps = { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    return [] // No readable package.json — nothing reliable to advise on.
  }
  const path = detectInstallPath(cwd)
  if (path === 'unknown') return []

  const pm = detectPackageManager(cwd)
  const findings: DependencyFinding[] = []

  const required = path === 'prebuilt' ? REQUIRED_PREBUILT_DEPS : REQUIRED_RUNTIME_DEPS
  for (const pkg of required) {
    if (deps[pkg] === undefined) {
      findings.push({
        package: pkg,
        required: true,
        hint: `detected ${path} install path — ${installHint(pm, [pkg])}`,
      })
    }
  }

  // Only meaningful on a pure prebuilt app. A hybrid legitimately needs `@cascivo/core`
  // for its copied source, so flagging it there would recreate the bug in mirror image.
  if (path === 'prebuilt') {
    for (const [pkg, reason] of Object.entries(FORBIDDEN_PREBUILT_DEPS)) {
      if (deps[pkg] !== undefined) {
        findings.push({ package: pkg, required: true, kind: 'forbidden', hint: reason })
      }
    }
  }

  for (const pkg of ON_DEMAND_DEPS) {
    if (deps[pkg] === undefined) {
      findings.push({ package: pkg, required: false, hint: installHint(pm, [pkg]) })
    }
  }
  return findings
}

/**
 * Two copies of `@cascivo/core` in one install.
 *
 * `@cascivo/react` and `@cascivo/charts` each depend on `@cascivo/core`, and the family
 * versions independently on 0.x. If their ranges do not overlap, the package manager
 * resolves a nested second copy — and because cascivo's reactivity is a module-level signal
 * registry, two copies means two registries: a signal written through one is invisible to
 * components subscribed through the other. Nothing errors. Handlers fire and the UI does
 * not move, which is the single hardest cascivo symptom to diagnose.
 *
 * Turning that into a named finding is the cheap half of the version-sprawl problem
 * (lockstep versioning is the expensive half, and is a policy decision).
 */
export interface DuplicateCoreFinding {
  /** Version at the install root, if any. */
  root: string | null
  /** Nested copies, as `<owner> → <version>`. */
  nested: string[]
  hint: string
}

/** Packages that carry their own `@cascivo/core` dependency. */
const CORE_DEPENDENTS = ['@cascivo/react', '@cascivo/charts', '@cascivo/flow', '@cascivo/editor']

export async function checkDuplicateCore(cwd: string): Promise<DuplicateCoreFinding | null> {
  const root = await readInstalledPackageVersion(cwd, '@cascivo/core')
  const nested: string[] = []
  for (const owner of CORE_DEPENDENTS) {
    const ownerRoot = join(cwd, 'node_modules', owner)
    if (!existsSync(ownerRoot)) continue
    const version = await readInstalledPackageVersion(ownerRoot, '@cascivo/core')
    // A nested copy only matters when it differs from the hoisted one.
    if (version !== null && version !== root) nested.push(`${owner} → ${version}`)
  }
  if (nested.length === 0) return null
  return {
    root,
    nested,
    hint:
      'Align the @cascivo/* versions (they are released together — see breaking-changes.json) ' +
      'and reinstall. Two copies of @cascivo/core means two signal registries: writes through ' +
      'one are invisible to components subscribed through the other, with no error.',
  }
}

export interface SignalsCompatFinding {
  /** 'error' = a runtime break (React 19 + signals <3); 'warning' = works but upgrade advised. */
  severity: 'error' | 'warning'
  detail: string
  hint: string
}

/**
 * Checks the installed `@preact/signals-react` against the installed React.
 * React 19 removed the `__SECRET_INTERNALS…` export that signals-react 2.x
 * imports, so a 2.x runtime on React 19 dies with a `SyntaxError` at module
 * evaluation (the 2026-07-20 report's blocker #2). cascivo peer-depends on
 * `>=3.0.0`, but a lockfile carried over from an earlier install can still pin
 * 2.x — this turns that into a diagnosed condition with a fix. Returns null when
 * either package is absent/unreadable (nothing reliable to advise on) or the
 * pairing is fine.
 */
export async function checkSignalsCompat(cwd: string): Promise<SignalsCompatFinding | null> {
  const [signals, react] = await Promise.all([
    readInstalledPackageVersion(cwd, '@preact/signals-react'),
    readInstalledPackageVersion(cwd, 'react'),
  ])
  if (signals === null) return null
  let signalsBelow3: boolean
  try {
    signalsBelow3 = compareVersions(signals, '3.0.0') < 0
  } catch {
    return null // unparsable installed signals version — don't advise on it
  }
  if (!signalsBelow3) return null
  const pm = detectPackageManager(cwd)
  const hint = installHint(pm, ['@preact/signals-react@^3'])
  let reactMajor: number | null = null
  if (react !== null) {
    const m = /^(\d+)\./.exec(react.trim())
    reactMajor = m ? Number(m[1]) : null
  }
  if (reactMajor !== null && reactMajor >= 19) {
    return {
      severity: 'error',
      detail: `@preact/signals-react ${signals} cannot run on React ${react} — React 19 removed an internal signals 2.x imports, so it fails at module load. Upgrade to signals-react 3.x.`,
      hint,
    }
  }
  return {
    severity: 'warning',
    detail: `@preact/signals-react ${signals} is below the required 3.x floor. It works on React 18 today but breaks the moment you move to React 19; upgrade now.`,
    hint,
  }
}

/** Vite SSR frameworks whose default setup needs `ssr.noExternal` for cascivo. */
const VITE_SSR_MARKERS = ['@tanstack/react-start', 'vite-ssr', '@remix-run/dev']
const VITE_CONFIG_FILES = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts']

/**
 * Advisory: on a Vite SSR framework, cascivo's per-component `.css` side-effect
 * imports crash a bare server-side ESM loader unless the packages are marked
 * `ssr.noExternal` (or the `cascivoSsr()` plugin is used). This warns when a known
 * Vite SSR framework is present but no vite config mentions either — the exact
 * cliff the 2026-07-20 report hit (blocker #1). A text match, not a gate. Returns
 * null when there's no Vite SSR framework or the config already handles it.
 */
/**
 * Warn when the vendored components dir is not excluded from the project's formatter.
 *
 * Owning the code means your formatter rewrites it, and `cascivo update` then reports drift
 * on files you never edited. `cascivo init` writes the exclusion for you, but a project that
 * adopted cascivo before that existed — or that added Prettier afterwards — never got it.
 */
export function checkFormatterIgnore(cwd: string, outputDir: string): string | null {
  const pairs = [
    {
      configs: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
      ignore: '.prettierignore',
    },
    { configs: ['.oxfmtrc', '.oxfmtrc.json'], ignore: '.oxfmtignore' },
  ]
  const dir = outputDir.replace(/\/+$/, '')
  for (const { configs, ignore } of pairs) {
    if (!configs.some((f) => existsSync(join(cwd, f)))) continue
    let content = ''
    try {
      content = readFileSync(join(cwd, ignore), 'utf8')
    } catch {
      /* no ignore file at all */
    }
    if (content.split('\n').some((l) => l.trim().replace(/\/+$/, '') === dir)) continue
    return (
      `"${dir}/" is not excluded from your formatter. Running it will rewrite code you own, ` +
      `and \`cascivo update\` will then report drift on files you never edited. ` +
      `Add "${dir}/" to ${ignore}.`
    )
  }
  return null
}

export function checkSsrConfig(cwd: string): string | null {
  let deps: Record<string, unknown> = {}
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, unknown>
      devDependencies?: Record<string, unknown>
    }
    deps = { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    return null
  }
  const framework = VITE_SSR_MARKERS.find((m) => deps[m] !== undefined)
  if (framework === undefined) return null

  for (const file of VITE_CONFIG_FILES) {
    const path = join(cwd, file)
    if (!existsSync(path)) continue
    const config = readFileSync(path, 'utf8')
    // Either the manual noExternal entry or the cascivoSsr() plugin counts.
    if (/noExternal/.test(config) && /@cascivo/.test(config)) return null
    if (/cascivoSsr/.test(config)) return null
  }
  return (
    `${framework} is a Vite SSR framework, but no vite config marks the cascivo ` +
    `packages ssr.noExternal — an unconfigured SSR build crashes with ` +
    `\`Unknown file extension ".css"\`. Add \`ssr: { noExternal: [/^@cascivo\\//] }\` ` +
    `(or the cascivoSsr() plugin from @cascivo/vite-plugin). ` +
    `Recipe: https://cascivo.com/docs/using-with-vite-ssr.md`
  )
}

const BANNED_HOOKS = ['useState', 'useEffect', 'useLayoutEffect', 'useContext', 'useReducer']

/**
 * Blank out comments and string/template-literal contents so identifier scans
 * only match real code. A mention of `useEffect` in a comment must not trip
 * the no-react-hooks rule. Single pass — a `//` inside a string (URLs) is not
 * treated as a comment.
 */
export function stripCommentsAndStrings(source: string): string {
  let out = ''
  let i = 0
  const n = source.length
  while (i < n) {
    const c = source[i]!
    const next = source[i + 1]
    if (c === '/' && next === '/') {
      while (i < n && source[i] !== '\n') i++
    } else if (c === '/' && next === '*') {
      i += 2
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i++
      i += 2
    } else if (c === "'" || c === '"') {
      i++
      while (i < n && source[i] !== c) {
        if (source[i] === '\\') i++
        i++
      }
      i++
      out += c + c
    } else if (c === '`') {
      i++
      while (i < n && source[i] !== '`') {
        if (source[i] === '\\') i++
        i++
      }
      i++
      out += '``'
    } else {
      out += c
      i++
    }
  }
  return out
}

export async function runDoctor(root: string): Promise<DoctorResult> {
  const violations: DoctorViolation[] = []
  const componentsDir = join(root, 'packages', 'components', 'src')
  if (!existsSync(componentsDir)) return { violations: [], passed: true }

  const components = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const reactIndex = join(root, 'packages', 'react', 'src', 'index.ts')
  const indexContent = existsSync(reactIndex) ? readFileSync(reactIndex, 'utf8') : ''

  for (const name of components) {
    const tsxPath = join(componentsDir, name, `${name}.tsx`)
    if (!existsSync(tsxPath)) continue
    const content = readFileSync(tsxPath, 'utf8')
    // Hook scan runs on code only; the aria-label scan below needs the
    // original source because it matches inside JSX string attributes.
    const code = stripCommentsAndStrings(content)

    for (const hook of BANNED_HOOKS) {
      if (new RegExp(`\\b${hook}\\b`).test(code)) {
        violations.push({
          file: tsxPath,
          rule: 'no-react-hooks',
          detail: `Banned hook '${hook}' in ${name}.tsx`,
        })
      }
    }

    if (/aria-label="[A-Z]/.test(content)) {
      violations.push({
        file: tsxPath,
        rule: 'no-hardcoded-strings',
        detail: `Hardcoded aria-label in ${name}.tsx — use t(builtin.*)`,
      })
    }

    if (!new RegExp(`from.*components/src/${name}`).test(indexContent)) {
      violations.push({
        file: tsxPath,
        rule: 'missing-react-export',
        detail: `${name} not exported from @cascivo/react`,
      })
    }
  }

  return { violations, passed: violations.length === 0 }
}
