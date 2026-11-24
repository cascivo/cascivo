import { describe, expect, it } from 'vitest'
import { inlineClasses } from './inline-classes.ts'

const map = {
  card: { card: 'cv-card-card', root: 'cv-card-card' },
  button: { label: 'cv-button-label' },
}
const head = "import { classes as c } from '@cascivo/css'\n"

describe('inlineClasses', () => {
  it('replaces static chains with literals', () => {
    expect(inlineClasses(`${head}x(c.card.card, c.button.label)`, map)).toBe(
      `${head}x("cv-card-card", "cv-button-label")`,
    )
  })
  it('honours a different or default local name', () => {
    expect(
      inlineClasses('import { classes } from "@cascivo/css"\nclasses.card.root', map),
    ).toContain('"cv-card-card"')
  })
  it('leaves unknown keys, dynamic access and foreign identifiers alone', () => {
    expect(
      inlineClasses(`${head}c.button.lable; c[u].x; c.card; other.c.card.card; d.card.card`, map),
    ).toBeUndefined()
  })
  it('does nothing without the import', () => {
    expect(inlineClasses('c.card.card', map)).toBeUndefined()
  })
})
