/**
 * Builds `@cascivo/css`'s stylesheets from `contract.json` + the component CSS modules:
 * `dist/<unit>.css` per unit and `dist/cascivo.css` with every unit. Same lightningcss compile
 * (`cv-<unit>-<local>`) as the React build's scoped names and the cascivo-html assets, plus the
 * `cv-<unit>` root alias (owner decision Q1), which only this package emits.
 *
 * Tokens and themes are not included: adopters import `@cascivo/tokens` / `@cascivo/themes` first.
 * Run by `packages/css`'s build (`node ../../scripts/contract/dist-css.ts`). Deterministic.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { layerOrderStatement } from '../build/layer-order.ts'
import { compileModule } from './css.ts'
import { COMPONENTS_DIR, REPO_ROOT, rootClass, type Contract } from './generate.ts'

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Widens every `.root` selector to `:is(.root,.alias)`. `:is()` takes its most specific
 * argument, and both are one class, so specificity and the cascade are unchanged.
 */
export function addRootAlias(css: string, root: string, alias: string): string {
  return css.replace(new RegExp(`\\.${escape(root)}(?![\\w-])`, 'g'), `:is(.${root},.${alias})`)
}

/** Every stylesheet as `file name -> content`, `cascivo.css` last. */
export function buildDistCss(contract: Contract, dir = COMPONENTS_DIR): Map<string, string> {
  const order = layerOrderStatement()
  const out = new Map<string, string>()
  const bodies: string[] = []
  for (const [unit, u] of Object.entries(contract.units)) {
    const unitDir = join(dir, unit)
    if (!existsSync(unitDir)) continue
    const modules = readdirSync(unitDir)
      .filter((f) => f.endsWith('.module.css'))
      .sort()
    if (!modules.length) continue
    let body = modules.map((f) => compileModule(join(unitDir, f), unit).code).join('\n')
    const root = rootClass(unit, u)
    if (root) body = addRootAlias(body, root, u.alias)
    bodies.push(body)
    out.set(`${unit}.css`, `${order}\n${body}\n`)
  }
  out.set('cascivo.css', `${order}\n${bodies.map((b) => `${b}\n`).join('')}`)
  return out
}

if (import.meta.main) {
  const { readFileSync } = await import('node:fs')
  const { CONTRACT_JSON } = await import('./generate.ts')
  const contract = JSON.parse(readFileSync(join(REPO_ROOT, CONTRACT_JSON), 'utf8')) as Contract
  const outDir = join(REPO_ROOT, 'packages/css/dist')
  mkdirSync(outDir, { recursive: true })
  for (const [file, css] of buildDistCss(contract)) writeFileSync(join(outDir, file), css)
}
