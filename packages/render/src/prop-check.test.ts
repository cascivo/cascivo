import { describe, expect, it } from 'vitest'
import { checkPropValue, isSafeUrl, type ValidationError } from './prop-check'

describe('isSafeUrl', () => {
  it('accepts relative and http(s) URLs', () => {
    expect(isSafeUrl('/a')).toBe(true)
    expect(isSafeUrl('https://x')).toBe(true)
  })

  it('rejects script-capable schemes, even disguised with whitespace', () => {
    expect(isSafeUrl(' java\tscript:x')).toBe(false)
    expect(isSafeUrl('data:text/html,x')).toBe(false)
  })
})

describe('checkPropValue', () => {
  it('reports one error for an out-of-enum value', () => {
    const errors: ValidationError[] = []
    checkPropValue(
      { name: 'size', required: false, enum: ['sm', 'lg'] },
      'xl',
      'p.props.size',
      'size',
      errors,
    )
    expect(errors).toHaveLength(1)
    expect(errors[0]?.path).toBe('p.props.size')
  })
})
