import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

export interface FallbackViolation {
  file: string
  line: number
  property: string
  value: string
  reason: string
}

// Detect @function calls: value contains --cascade-*(... or a custom @function name pattern
function isFunctionCall(value: string): boolean {
  return /--[\w-]+\(/.test(value)
}

// Detect if() expressions
function isIfExpression(value: string): boolean {
  return /\bif\s*\(/.test(value)
}

export function auditFallbacks(cssSource: string, filename: string): FallbackViolation[] {
  const violations: FallbackViolation[] = []
  const lines = cssSource.split('\n')

  // Track whether we're inside @supports block
  let inSupports = false
  let supportsDepth = 0
  let baseSupportsDepth = 0

  // Track property values seen in current rule block (property -> last static value line)
  // We use a stack of rule blocks
  interface RuleBlock {
    properties: Map<string, { line: number; value: string; isStatic: boolean }>
    inSupports: boolean
  }
  const blockStack: RuleBlock[] = []

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const line = lines[i].trim()

    // Track @supports
    if (/^@supports\b/.test(line)) {
      inSupports = true
      baseSupportsDepth = supportsDepth
    }

    // Track braces for block depth
    const opens = (line.match(/\{/g) ?? []).length
    const closes = (line.match(/\}/g) ?? []).length

    for (let j = 0; j < opens; j++) {
      blockStack.push({ properties: new Map(), inSupports })
      supportsDepth++
    }
    for (let j = 0; j < closes; j++) {
      if (blockStack.length > 0) blockStack.pop()
      supportsDepth--
      if (supportsDepth <= baseSupportsDepth) inSupports = false
    }

    // Match CSS declarations: property: value;
    const declMatch = line.match(/^([\w-]+)\s*:\s*(.+?)\s*;?\s*$/)
    if (!declMatch) continue

    const [, property, value] = declMatch

    if (isFunctionCall(value) || isIfExpression(value)) {
      // Check if current or parent block has a preceding static declaration for this property
      let hasFallback = false

      // Check all blocks in stack for a prior static value for this property
      for (const block of blockStack) {
        const prev = block.properties.get(property)
        if (prev?.isStatic) {
          hasFallback = true
          break
        }
      }

      // Also accept if we're inside an @supports block (the base rules outside provide fallback)
      if (inSupports) hasFallback = true

      if (!hasFallback) {
        violations.push({
          file: filename,
          line: lineNum,
          property,
          value,
          reason: `No static fallback for '${property}' before @function/@if() call`,
        })
      }
    } else {
      // Static value — record it in the current block
      if (blockStack.length > 0) {
        const currentBlock = blockStack[blockStack.length - 1]
        currentBlock!.properties.set(property, { line: lineNum, value, isStatic: true })
      }
    }
  }

  return violations
}

export function auditFiles(files: string[]): FallbackViolation[] {
  return files.flatMap((file) => {
    const source = readFileSync(file, 'utf8')
    return auditFallbacks(source, file)
  })
}

function collectCssFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...collectCssFiles(full))
    } else if (extname(entry) === '.css') {
      results.push(full)
    }
  }
  return results
}

// CLI entry
if (process.argv[1] && process.argv[1].endsWith('css-fallback.ts')) {
  const dirs = process.argv.slice(2)
  if (dirs.length === 0) {
    console.error('Usage: node scripts/checks/css-fallback.ts <dir> [<dir>...]')
    process.exit(1)
  }
  const cssFiles = dirs.flatMap(collectCssFiles)
  const violations = auditFiles(cssFiles)
  if (violations.length === 0) {
    console.log('css-fallback: OK')
    process.exit(0)
  }
  for (const v of violations) {
    console.error(`${v.file}:${v.line}  ${v.property}: ${v.value}\n  → ${v.reason}`)
  }
  process.exit(1)
}
