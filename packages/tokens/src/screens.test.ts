import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SCREEN, minWidth, maxWidth } from './screens.ts'

describe('SCREEN constants', () => {
  it('sm: rem and px agree at 16px root', () => {
    assert.equal(SCREEN.sm.px, parseFloat(SCREEN.sm.rem) * 16)
  })
  it('md: rem and px agree at 16px root', () => {
    assert.equal(SCREEN.md.px, parseFloat(SCREEN.md.rem) * 16)
  })
  it('lg: rem and px agree at 16px root', () => {
    assert.equal(SCREEN.lg.px, parseFloat(SCREEN.lg.rem) * 16)
  })
  it('xl: rem and px agree at 16px root', () => {
    assert.equal(SCREEN.xl.px, parseFloat(SCREEN.xl.rem) * 16)
  })
  it('minWidth returns correct format', () => {
    assert.equal(minWidth('lg'), '(min-width: 64rem)')
  })
  it('maxWidth returns correct format', () => {
    assert.equal(maxWidth('md'), '(max-width: 40rem)')
  })
})
