import { describe, expect, it, vi } from 'vitest'
import { chordOf, createIndentCommands, dispatch, mergeKeymap, type Command } from './keymap.ts'

describe('chordOf', () => {
  it('encodes the primary modifier as Mod (Ctrl on non-mac)', () => {
    expect(chordOf({ key: 'z', ctrlKey: true })).toBe('Mod-z')
    expect(chordOf({ key: 'Z', ctrlKey: true, shiftKey: true })).toBe('Mod-Shift-z')
    expect(chordOf({ key: 'f', ctrlKey: true, altKey: true })).toBe('Mod-Alt-f')
  })

  it('keeps named keys and lowercases single characters', () => {
    expect(chordOf({ key: 'Tab' })).toBe('Tab')
    expect(chordOf({ key: 'Tab', shiftKey: true })).toBe('Shift-Tab')
    expect(chordOf({ key: 'Escape' })).toBe('Escape')
    expect(chordOf({ key: 'A' })).toBe('a')
  })
})

describe('dispatch / mergeKeymap', () => {
  it('runs the matching command and reports handled', () => {
    const cmd = vi.fn<Command>(() => true)
    const map = mergeKeymap({ 'Mod-s': cmd })
    const ctx = {
      textarea: {} as HTMLTextAreaElement,
      event: { key: 's', ctrlKey: true } as never,
      setText: () => {},
    }
    expect(dispatch(map, ctx)).toBe(true)
    expect(cmd).toHaveBeenCalledOnce()
  })

  it('returns false for an unbound chord', () => {
    const map = mergeKeymap({ 'Mod-s': () => true })
    const ctx = {
      textarea: {} as HTMLTextAreaElement,
      event: { key: 'q', ctrlKey: true } as never,
      setText: () => {},
    }
    expect(dispatch(map, ctx)).toBe(false)
  })

  it('lets user bindings override built-ins on the same chord', () => {
    const builtin = vi.fn<Command>(() => true)
    const user = vi.fn<Command>(() => true)
    const map = mergeKeymap({ 'Mod-s': builtin }, { 'Mod-s': user })
    dispatch(map, {
      textarea: {} as HTMLTextAreaElement,
      event: { key: 's', ctrlKey: true } as never,
      setText: () => {},
    })
    expect(user).toHaveBeenCalledOnce()
    expect(builtin).not.toHaveBeenCalled()
  })
})

describe('createIndentCommands', () => {
  it('inserts spaces at the caret', () => {
    const ta = document.createElement('textarea')
    ta.value = ''
    document.body.append(ta)
    ta.setSelectionRange(0, 0)
    const { indent } = createIndentCommands({ tabSize: 2, insertSpaces: true })
    let committed = ''
    indent({ textarea: ta, event: {} as never, setText: (v) => (committed = v) })
    expect(ta.value).toBe('  ')
    expect(committed).toBe('  ')
    ta.remove()
  })

  it('dedents a selected block', () => {
    const ta = document.createElement('textarea')
    ta.value = '    a\n    b'
    document.body.append(ta)
    ta.setSelectionRange(0, ta.value.length)
    const { dedent } = createIndentCommands({ tabSize: 2, insertSpaces: true })
    dedent({ textarea: ta, event: {} as never, setText: () => {} })
    expect(ta.value).toBe('  a\n  b')
    ta.remove()
  })
})
