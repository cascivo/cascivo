import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { LiteralFinding } from '../audit-ai/css-literals.js'
import { findCssLiteralViolations } from '../audit-ai/css-literals.js'
import type { PropFinding } from '../audit-ai/jsx-props.js'
import { findJsxPropViolations } from '../audit-ai/jsx-props.js'
import type { RawStringFinding } from '../audit-ai/raw-strings.js'
import { findRawStringViolations } from '../audit-ai/raw-strings.js'
import type { RequiredPropFinding } from '../audit-ai/required-props.js'
import { findRequiredPropViolations } from '../audit-ai/required-props.js'
import type { CascadeConfig } from '../utils/config.js'
import type { Contract } from '../utils/contract.js'
import { loadContract } from '../utils/contract.js'

export type Finding = LiteralFinding | PropFinding | RequiredPropFinding | RawStringFinding

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'build', '.next', 'coverage'])

function collectFiles(paths: string[]): string[] {
  const out: string[] = []
  const walk = (p: string) => {
    if (!existsSync(p)) return
    const s = statSync(p)
    if (s.isDirectory()) {
      const base = p.split('/').pop() ?? ''
      if (SKIP_DIRS.has(base)) return
      for (const entry of readdirSync(p)) walk(join(p, entry))
      return
    }
    const ext = extname(p)
    if (ext === '.css' || ext === '.tsx' || ext === '.ts') out.push(p)
  }
  for (const p of paths) walk(p)
  return out
}

function findingsFor(file: string, source: string, contract: Contract): Finding[] {
  const ext = extname(file)
  const findings: Finding[] = []
  if (ext === '.css') {
    findings.push(...findCssLiteralViolations(source, file, contract))
  } else if (ext === '.tsx' || ext === '.ts') {
    findings.push(...findCssLiteralViolations(source, file, contract))
    findings.push(...findJsxPropViolations(source, file, contract))
    findings.push(...findRequiredPropViolations(source, file, contract))
    findings.push(...findRawStringViolations(source, file, contract))
  }
  return findings
}

function detail(f: Finding): string {
  switch (f.rule) {
    case 'hardcoded-value':
      if (f.suggestedToken) return `${f.value} → var(${f.suggestedToken})`
      return `${f.value} → ${f.allMatches?.join(' | ') ?? '(ambiguous)'}`
    case 'unknown-prop':
      return `<${f.component} ${f.prop}>`
    case 'spread-suppressed':
      return `<${f.component} {...}> (props not checked)`
    case 'missing-prop':
      return `<${f.component}> requires "${f.prop}"`
    case 'raw-string':
      return `"${f.text}" → use labels prop / i18n`
  }
}

function levelLabel(level: Finding['level']): string {
  return level === 'warn' ? 'warn' : level
}

function renderFindings(findings: Finding[]): void {
  if (findings.length === 0) {
    console.log('cascade audit --ai: no findings.')
    return
  }
  const rows = findings.map((f) => ({
    loc: `${f.file}:${f.line}`,
    level: levelLabel(f.level),
    rule: f.rule,
    detail: detail(f),
  }))
  const locW = Math.max(...rows.map((r) => r.loc.length), 8)
  const lvlW = Math.max(...rows.map((r) => r.level.length), 5)
  const ruleW = Math.max(...rows.map((r) => r.rule.length), 4)
  for (const r of rows) {
    console.log(
      `${r.loc.padEnd(locW)}  ${r.level.padEnd(lvlW)}  ${r.rule.padEnd(ruleW)}  ${r.detail}`,
    )
  }
  console.log('---')
  const errors = findings.filter((f) => f.level === 'error').length
  const warnings = findings.filter((f) => f.level === 'warn').length
  const infos = findings.filter((f) => f.level === 'info').length
  const parts = [
    `${errors} error${errors === 1 ? '' : 's'}`,
    `${warnings} warning${warnings === 1 ? '' : 's'}`,
  ]
  if (infos) parts.push(`${infos} info`)
  console.log(parts.join(', '))
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Pure literal→token rewrite. Only rewrites simple `property: #hex;` style
 * declarations where exactly one token matches. Returns the new source and how
 * many findings were resolved (verified by re-running the checker).
 */
export function fixCssLiterals(
  source: string,
  file: string,
  contract: Contract,
): { source: string; fixed: number } {
  const fixable = findCssLiteralViolations(source, file, contract).filter(
    (f) => f.level === 'error' && f.suggestedToken && /^#[0-9a-fA-F]{3,8}$/.test(f.value),
  )
  let next = source
  for (const f of fixable) {
    // Only rewrite a full-value declaration: `prop: #hex;` (or end of block).
    const re = new RegExp(`(${escapeRe(f.property)}\\s*:\\s*)${escapeRe(f.value)}(\\s*[;}])`, 'gi')
    next = next.replace(re, `$1var(${f.suggestedToken})$2`)
  }
  if (next === source) return { source, fixed: 0 }
  const remaining = findCssLiteralViolations(next, file, contract).filter(
    (f) => f.level === 'error' && f.suggestedToken,
  ).length
  return { source: next, fixed: fixable.length - remaining }
}

/** Apply {@link fixCssLiterals} to each .css file on disk. */
function applyFixes(files: string[], contract: Contract): number {
  let fixed = 0
  for (const file of files) {
    if (extname(file) !== '.css') continue
    const { source, fixed: n } = fixCssLiterals(readFileSync(file, 'utf8'), file, contract)
    if (n > 0) {
      writeFileSync(file, source)
      fixed += n
    }
  }
  return fixed
}

export async function audit(args: string[], _config: CascadeConfig): Promise<void> {
  if (!args.includes('--ai')) {
    console.log('cascivo audit: use --ai to audit AI-generated code against the cascivo contract')
    return
  }

  const jsonOutput = args.includes('--json')
  const fixMode = args.includes('--fix')
  const levelIdx = args.indexOf('--level')
  const minLevel = levelIdx >= 0 ? (args[levelIdx + 1] ?? 'error') : 'error'

  const paths = args.filter((a, i) => {
    if (a.startsWith('--')) return false
    if (levelIdx >= 0 && i === levelIdx + 1) return false
    return true
  })

  let contract: Contract
  try {
    contract = await loadContract()
  } catch (e) {
    console.error(`Contract unavailable: ${e instanceof Error ? e.message : String(e)}`)
    process.exitCode = 2
    return
  }

  const files = collectFiles(paths.length ? paths : [process.cwd()])

  if (fixMode) {
    const n = applyFixes(files, contract)
    console.log(`cascade audit --ai --fix: rewrote ${n} literal${n === 1 ? '' : 's'} to tokens.`)
  }

  const allFindings: Finding[] = []
  for (const file of files) {
    allFindings.push(...findingsFor(file, readFileSync(file, 'utf8'), contract))
  }

  if (jsonOutput) {
    console.log(JSON.stringify(allFindings, null, 2))
  } else {
    renderFindings(allFindings)
  }

  const hasErrors = allFindings.some((f) => f.level === 'error')
  if (minLevel === 'error' && hasErrors) process.exitCode = 1
  if (minLevel === 'warn' && allFindings.some((f) => f.level !== 'info')) process.exitCode = 1
}
