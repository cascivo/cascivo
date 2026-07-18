import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { detectPackageManager, installHint } from '../utils/config.js'

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
