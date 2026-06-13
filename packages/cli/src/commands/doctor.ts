import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export interface DoctorViolation {
  file: string
  rule: string
  detail: string
}

export interface DoctorResult {
  violations: DoctorViolation[]
  passed: boolean
}

const BANNED_HOOKS = ['useState', 'useEffect', 'useLayoutEffect', 'useContext', 'useReducer']

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

    for (const hook of BANNED_HOOKS) {
      if (new RegExp(`\\b${hook}\\b`).test(content)) {
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
