/**
 * Verifies that all section components remain static (zero state, signals, effects).
 * Sections are slot components: props in, markup out — no runtime behaviour.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SECTIONS_DIR = join(import.meta.dirname)

const BANNED = [
  'useState',
  'useSignal',
  'useMachine',
  'useSignalEffect',
  'useEffect',
  'useReducer',
  'useContext',
]

function collectTsxFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(full))
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
      results.push(full)
    }
  }
  return results
}

const files = collectTsxFiles(SECTIONS_DIR).filter((f) => !f.includes('.purity.test'))

describe('section purity — zero state/signals/effects', () => {
  for (const file of files) {
    it(`${file.replace(SECTIONS_DIR + '/', '')} is static`, () => {
      const src = readFileSync(file, 'utf-8')
      for (const banned of BANNED) {
        expect(src, `${banned} found in ${file}`).not.toContain(banned)
      }
    })
  }
})
