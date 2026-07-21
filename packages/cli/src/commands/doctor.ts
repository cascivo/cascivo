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

/** Runtime packages copied cascivo source needs; the last is @cascivo/core's peer. */
const REQUIRED_RUNTIME_DEPS = [
  '@cascivo/core',
  '@cascivo/tokens',
  '@cascivo/themes',
  '@preact/signals-react',
]

/** Installed on demand by `cascivo add` when a component/chart declares them. */
const ON_DEMAND_DEPS = ['@cascivo/i18n', '@cascivo/charts']

export interface DependencyFinding {
  package: string
  /** true = a runtime dep whose absence breaks the build; false = advisory. */
  required: boolean
  hint: string
}

const CONFIG_FILES = ['cascivo.config.ts', 'cascivo.config.js', 'cascivo.config.mjs']

/** Whether cwd looks like a cascivo adopter project (has a generated config). */
export function isAdopterProject(cwd: string): boolean {
  return CONFIG_FILES.some((f) => existsSync(join(cwd, f)))
}

/**
 * Advisory check that the runtime dependencies copied source needs are declared
 * in the project's package.json. Turns the opaque "cannot find module
 * '@preact/signals-react'" build failure — the report's #4, where the peer was
 * invisible — into a diagnosed condition with a fix. Adopter-only (gated on a
 * cascivo.config by the caller); `@cascivo/i18n`/`@cascivo/charts` are advisory
 * since not every project uses them.
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
  const pm = detectPackageManager(cwd)
  const findings: DependencyFinding[] = []
  for (const pkg of REQUIRED_RUNTIME_DEPS) {
    if (deps[pkg] === undefined) {
      findings.push({ package: pkg, required: true, hint: installHint(pm, [pkg]) })
    }
  }
  for (const pkg of ON_DEMAND_DEPS) {
    if (deps[pkg] === undefined) {
      findings.push({ package: pkg, required: false, hint: installHint(pm, [pkg]) })
    }
  }
  return findings
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
