import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const componentsDir = fileURLToPath(new URL('../../packages/components/src', import.meta.url))

/** Components with open/close or enter/exit behavior — must animate via @starting-style. */
const OPEN_CLOSE = ['modal', 'dropdown', 'tooltip', 'toast', 'command-menu']

/** Layout-affecting properties that must never be transitioned (not compositor-safe). */
const FORBIDDEN =
  /transition[^;{]*\b(max-height|height|width|top|left|right|bottom|inset|margin|padding)\b/g

/** Documented exceptions: component → reason. */
const EXCEPTIONS = new Map<string, string>([
  ['accordion', 'grid-template-rows 0fr→1fr trick — the documented height-animation exception'],
])

const failures: string[] = []

for (const name of readdirSync(componentsDir)) {
  const css = join(componentsDir, name, `${name}.module.css`)
  if (!existsSync(css)) continue
  // Strip block comments before scanning so comment text doesn't trigger false positives.
  const content = readFileSync(css, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

  if (OPEN_CLOSE.includes(name) && !content.includes('@starting-style')) {
    failures.push(`${name}: open/close component without @starting-style`)
  }
  if (!EXCEPTIONS.has(name)) {
    for (const match of content.matchAll(FORBIDDEN)) {
      failures.push(`${name}: transitions layout property — "${match[0].trim()}"`)
    }
  }
}

if (failures.length > 0) {
  console.error('Animation audit failed:\n' + failures.map((f) => `  - ${f}`).join('\n'))
  process.exit(1)
}
console.log('Animation audit passed')
