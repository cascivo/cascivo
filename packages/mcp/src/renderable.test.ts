import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RENDERABLE } from './grammar.js'

describe('RENDERABLE', () => {
  it('equals the names <CascivoView> renders', () => {
    const source = readFileSync(
      join(import.meta.dirname, '../../render/src/component-names.ts'),
      'utf8',
    )
    const rendered = [...source.matchAll(/^\s+'(\w+)',$/gm)].map((m) => m[1]!)
    expect(rendered.length).toBeGreaterThan(40)
    expect([...RENDERABLE].sort()).toEqual(rendered.sort())
  })
})
