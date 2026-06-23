import { describe, expect, it } from 'vitest'
import { diff, rebaseSelection } from './sync.ts'

describe('diff', () => {
  it('finds a minimal insertion span', () => {
    expect(diff('abc', 'aXbc')).toEqual({ from: 1, to: 1, insert: 'X' })
  })
  it('finds a minimal deletion span', () => {
    expect(diff('aXbc', 'abc')).toEqual({ from: 1, to: 2, insert: '' })
  })
  it('finds a minimal replacement span', () => {
    expect(diff('abcd', 'aZd')).toEqual({ from: 1, to: 3, insert: 'Z' })
  })
  it('reports no change as an empty span', () => {
    expect(diff('abc', 'abc')).toEqual({ from: 3, to: 3, insert: '' })
  })
})

describe('rebaseSelection', () => {
  it('shifts a caret right when text is inserted before it', () => {
    const change = diff('abc', 'aXbc')
    expect(rebaseSelection(2, 2, change)).toEqual({ start: 3, end: 3 })
  })
  it('shifts a caret left when text is deleted before it', () => {
    const change = diff('aXbc', 'abc')
    expect(rebaseSelection(3, 3, change)).toEqual({ start: 2, end: 2 })
  })
  it('clamps a caret that sits inside the replaced span', () => {
    const change = diff('abcd', 'aZd')
    expect(rebaseSelection(2, 2, change)).toEqual({ start: 2, end: 2 })
  })
  it('leaves a caret untouched when the change is after it', () => {
    const change = diff('abcd', 'abcdX')
    expect(rebaseSelection(2, 2, change)).toEqual({ start: 2, end: 2 })
  })
})
