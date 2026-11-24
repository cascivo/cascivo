import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classes } from './index.ts'
import type { Contract } from './contract.ts'

const contract = JSON.parse(
  readFileSync(new URL('../contract.json', import.meta.url), 'utf8'),
) as Contract

describe('classes', () => {
  it('has one entry per contract unit, aliases included', () => {
    const aliases = Object.values(classes).map((c) => c.alias)
    expect(aliases.sort()).toEqual(
      Object.values(contract.units)
        .map((u) => u.alias)
        .sort(),
    )
  })

  it('points root at the anatomy root class', () => {
    expect(classes.button.root).toBe(contract.units['button']?.anatomy?.root.class)
    expect(classes.button.label).toBe('cv-button-label')
  })
})
