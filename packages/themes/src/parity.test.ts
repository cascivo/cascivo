import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname)
const themeFiles = [
  'dark',
  'flat',
  'light',
  'minimal',
  'warm',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
].map((n) => `${n}.css`)

function tokenKeys(file: string): Set<string> {
  const css = readFileSync(join(SRC, file), 'utf8')
  return new Set([...css.matchAll(/^\s*(--cascivo-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]!))
}

describe('theme token parity', () => {
  it('every theme defines the identical set of semantic tokens', () => {
    const [first, ...rest] = themeFiles
    const reference = tokenKeys(first!)
    for (const file of rest) {
      const keys = tokenKeys(file)
      const missing = [...reference].filter((k) => !keys.has(k))
      const extra = [...keys].filter((k) => !reference.has(k))
      expect(missing, `${file} is missing tokens defined in ${first}`).toEqual([])
      expect(extra, `${file} defines tokens missing from ${first}`).toEqual([])
    }
  })

  it('every theme declares the interaction-state opacity tokens', () => {
    for (const file of themeFiles) {
      const keys = tokenKeys(file)
      expect(
        keys.has('--cascivo-disabled-opacity'),
        `${file} missing --cascivo-disabled-opacity`,
      ).toBe(true)
      expect(keys.has('--cascivo-hover-opacity'), `${file} missing --cascivo-hover-opacity`).toBe(
        true,
      )
    }
  })
})
