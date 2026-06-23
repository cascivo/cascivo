/**
 * Enforces CLAUDE.md's reactivity rules across the flow package: no
 * `useState`/`useContext`/`useEffect`/`useLayoutEffect`/`useReducer` anywhere in
 * source. Signal hooks (`useSignal*`) and `useRef` are the only allowed state.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_DIR = join(import.meta.dirname)

const BANNED = ['useState', 'useContext', 'useEffect', 'useLayoutEffect', 'useReducer']

function collectFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full))
    } else if (
      entry.isFile() &&
      /\.tsx?$/.test(entry.name) &&
      !entry.name.includes('.test.') &&
      // Manifests are documentation data — their prose may name banned hooks.
      !entry.name.endsWith('.meta.ts')
    ) {
      results.push(full)
    }
  }
  return results
}

const files = collectFiles(SRC_DIR)

describe('flow — no banned React hooks', () => {
  for (const file of files) {
    it(`${file.replace(SRC_DIR + '/', '')} uses no banned hooks`, () => {
      // Strip comments so prose documenting the rules ("No `useState`…") is ignored.
      const src = readFileSync(file, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
      for (const banned of BANNED) {
        // Word-boundary match so `useEffect` doesn't trip on `useSignalEffect`.
        const re = new RegExp(`\\b${banned}\\b`)
        expect(re.test(src), `${banned} found in ${file}`).toBe(false)
      }
    })
  }
})
