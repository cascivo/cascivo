/**
 * Verifies that all section/primitive CSS uses logical properties only.
 * Physical left/right/top/bottom margin and padding are banned.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const LAYOUTS_SRC = join(import.meta.dirname, '..')

const NEW_V8_DIRS = [
  join(LAYOUTS_SRC, 'sections'),
  join(LAYOUTS_SRC, 'masonry'),
  join(LAYOUTS_SRC, 'auto-grid'),
  join(LAYOUTS_SRC, 'section'),
]

const PHYSICAL_PROPERTY_RE =
  /(?:^|[^-])\b(?:left|right)\s*:|margin-(?:top|bottom|left|right)|padding-(?:top|bottom|left|right)|text-align\s*:\s*(?:left|right)/m

function collectCssFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectCssFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      results.push(full)
    }
  }
  return results
}

const cssFiles = NEW_V8_DIRS.flatMap((d) => {
  try {
    return collectCssFiles(d)
  } catch {
    return []
  }
})

describe('logical properties — no physical left/right/top/bottom in v8 CSS', () => {
  for (const file of cssFiles) {
    it(`${file.replace(LAYOUTS_SRC + '/', '')} uses logical properties`, () => {
      const src = readFileSync(file, 'utf-8')
      expect(PHYSICAL_PROPERTY_RE.test(src), `Physical property found in ${file}`).toBe(false)
    })
  }
})
