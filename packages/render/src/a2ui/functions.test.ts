import { describe, expect, it } from 'vitest'
import { createDataModel } from './data-model'
import {
  BASIC_FUNCTIONS,
  callFunction,
  formatString,
  isSafeRegexPattern,
  resolveDynamic,
} from './functions'
import type { ResolveContext } from './functions'
import type { A2uiErrorMessage } from './messages'

function make(model: unknown = {}, extra: Partial<ResolveContext> = {}) {
  const errors: A2uiErrorMessage[] = []
  const opened: string[] = []
  const ctx: ResolveContext = {
    data: createDataModel(model),
    scope: '',
    locale: 'en',
    timeZone: 'UTC',
    surfaceId: 's1',
    openUrl: (u) => opened.push(u),
    report: (e) => errors.push(e),
    ...extra,
  }
  return { ctx, errors, opened }
}
const call = (name: string, args: Record<string, unknown>, c = make()) =>
  callFunction(name, args, c.ctx)

describe('BASIC_FUNCTIONS', () => {
  it('lists the 14 names', () => {
    expect(BASIC_FUNCTIONS).toHaveLength(14)
  })
})

describe('isSafeRegexPattern', () => {
  it('rejects nested quantifiers, repeated alternation, backreferences and long patterns', () => {
    for (const p of [
      '(a+)+$',
      '(a*)*',
      '(a|aa){2,}',
      '(\\w)\\1',
      '(?<x>a)\\k<x>',
      'a'.repeat(257),
    ]) {
      expect(isSafeRegexPattern(p)).toBe(false)
    }
  })
  it('refuses polynomial and exponential backtracking by counting every quantifier', () => {
    for (const p of [
      'a*a*a*a*a*b',
      '\\d+\\d+\\d+\\d+\\d+\\d+$',
      '(a*)(a*)(a*)(a*)(a*)(a*)b',
      '.*.*.*.*=',
      '\\d+\\d+\\d+$',
      'a*?a*?a*?b',
      'a{1,}a{2,}a{3,}b',
      'a{1,1000}a{1,1000}a{1,1000}a{1,1000}b',
      'a{0,1000}a{0,1000}a{0,1000}b',
      '\\d{1,999}\\d{1,999}\\d{1,999}x',
      '\\w{1,1000}'.repeat(5) + '$',
      '(a?)'.repeat(34) + 'a'.repeat(34),
      'a?'.repeat(34) + 'a'.repeat(34),
      '^\\d{3}-\\d{3}-\\d{4}$',
    ]) {
      expect(isSafeRegexPattern(p)).toBe(false)
    }
  })
  it('refuses repeat counts above 99', () => {
    expect(isSafeRegexPattern('a{0,1000}')).toBe(false)
    expect(isSafeRegexPattern('a{100}')).toBe(false)
    expect(isSafeRegexPattern('a{0,99}')).toBe(true)
  })
  it('documents the conservative refusals', () => {
    expect(isSafeRegexPattern('(a|b)+')).toBe(false)
    expect(isSafeRegexPattern('(\\d{3})+')).toBe(false)
  })
  it('does not count group prefixes, counts a lazy quantifier once', () => {
    expect(isSafeRegexPattern('^(?:ab)$')).toBe(true)
    expect(isSafeRegexPattern('a(?=x)b(?!y)c+d*')).toBe(true)
    expect(isSafeRegexPattern('(?<=x)a(?<!y)(?<n>b)c+d*')).toBe(true)
    expect(isSafeRegexPattern('a+?b+?')).toBe(true)
    expect(isSafeRegexPattern('a+?b+?c+?')).toBe(false)
  })
  it('accepts patterns with at most two quantifiers', () => {
    for (const p of [
      '^\\d{3}-\\d{4}$',
      '^[A-Z][a-z]*$',
      '^\\S+@\\S+$',
      '^\\+?\\d{1,15}$',
      '^(yes|no)$',
      '^[a-z]{2,5}\\d+$',
    ]) {
      expect(isSafeRegexPattern(p)).toBe(true)
    }
  })
  it('accepts ordinary patterns', () => {
    for (const p of ['^[a-z]+$', '\\d{3}-\\d{4}', '[(+*]+', '(ab)?c', '\\(a+\\)+']) {
      expect(isSafeRegexPattern(p)).toBe(true)
    }
  })
})

describe('validators', () => {
  it('required', () => {
    for (const v of [null, undefined, '', []]) expect(call('required', { value: v })).toBe(false)
    for (const v of ['a', 0, false, [1]]) expect(call('required', { value: v })).toBe(true)
  })
  it('regex', () => {
    expect(call('regex', { value: 'abc', pattern: '^[a-z]+$' })).toBe(true)
    expect(call('regex', { value: 'ab1', pattern: '^[a-z]+$' })).toBe(false)
  })
  it('regex refuses a catastrophic pattern without running it', () => {
    const c = make()
    const started = Date.now()
    expect(call('regex', { value: `${'a'.repeat(30)}!`, pattern: '(a+)+$' }, c)).toBe(false)
    expect(Date.now() - started).toBeLessThan(100)
    expect(c.errors[0]?.error).toMatchObject({ code: 'VALIDATION_FAILED', path: '/args/pattern' })
  })
  it('regex stays fast on the worst accepted shape', () => {
    const started = Date.now()
    expect(call('regex', { value: `${'1'.repeat(1000)}x`, pattern: '^\\d+\\d+$' })).toBe(false)
    expect(Date.now() - started).toBeLessThan(200)
  })
  it('regex stays fast on bounded-quantifier worst shapes', () => {
    const started = Date.now()
    expect(call('regex', { value: `${'a'.repeat(1000)}`, pattern: '^a{0,1000}a{0,1000}b' })).toBe(
      false,
    )
    expect(call('regex', { value: `${'a'.repeat(999)}c`, pattern: 'a{0,1000}a{0,1000}b' })).toBe(
      false,
    )
    expect(Date.now() - started).toBeLessThan(200)
  })
  it('regex refuses long patterns, long values and invalid patterns', () => {
    const c = make()
    expect(call('regex', { value: 'a', pattern: 'a'.repeat(300) }, c)).toBe(false)
    expect(call('regex', { value: 'a'.repeat(1_001), pattern: 'a' }, c)).toBe(false)
    expect(call('regex', { value: 'a', pattern: '[' }, c)).toBe(false)
    expect(c.errors).toHaveLength(3)
  })
  it('length', () => {
    expect(call('length', { value: 'abc', min: 2, max: 3 })).toBe(true)
    expect(call('length', { value: 'abcd', max: 3 })).toBe(false)
    expect(call('length', { value: 'a', min: 2 })).toBe(false)
    expect(call('length', { value: 'a' })).toBe(false)
  })
  it('numeric', () => {
    expect(call('numeric', { value: 5, min: 1, max: 5 })).toBe(true)
    expect(call('numeric', { value: 6, max: 5 })).toBe(false)
    expect(call('numeric', { value: Number.NaN })).toBe(false)
    expect(call('numeric', { value: '5' })).toBe(false)
  })
  it('email', () => {
    expect(call('email', { value: 'a@b.co' })).toBe(true)
    expect(call('email', { value: 'a@' })).toBe(false)
    expect(call('email', { value: 7 })).toBe(false)
  })
  it('and / or / not', () => {
    expect(call('and', { values: [true, true] })).toBe(true)
    expect(call('and', { values: [true, false] })).toBe(false)
    expect(call('or', { values: [false, true] })).toBe(true)
    expect(call('or', { values: [false, false] })).toBe(false)
    expect(call('not', { value: true })).toBe(false)
    expect(call('not', { value: false })).toBe(true)
  })
})

describe('formatters', () => {
  it('formatNumber', () => {
    expect(call('formatNumber', { value: 1234.5, decimals: 2 })).toBe('1,234.50')
    expect(call('formatNumber', { value: 1234, grouping: false })).toBe('1234')
    expect(call('formatNumber', { value: 'x' })).toBe('')
  })
  it('formatCurrency', () => {
    expect(call('formatCurrency', { value: 5, currency: 'USD' })).toBe('$5.00')
    expect(call('formatCurrency', { value: 1234, currency: 'USD', decimals: 0 })).toBe('$1,234')
  })
  it('formatDate', () => {
    const iso = '2026-01-16T14:30:00Z'
    expect(call('formatDate', { value: iso, format: 'MMM dd, yyyy' })).toBe('Jan 16, 2026')
    expect(call('formatDate', { value: iso, format: 'h:mm a' })).toBe('2:30 PM')
    expect(call('formatDate', { value: iso, format: 'EEEE, MMMM d, yy HH:mm:ss' })).toBe(
      'Friday, January 16, 26 14:30:00',
    )
    expect(call('formatDate', { value: iso, format: "E M/MM 'at' hh 'o''clock' q" })).toBe(
      "Fri 1/01 at 02 o'clock q",
    )
    expect(call('formatDate', { value: 'nope', format: 'yyyy' })).toBe('')
  })
  it('pluralize', () => {
    expect(call('pluralize', { value: 1, one: 'item', other: 'items' })).toBe('item')
    expect(call('pluralize', { value: 2, one: 'item', other: 'items' })).toBe('items')
    expect(call('pluralize', { value: 2, one: 'item' })).toBe('')
  })
  it('openUrl only opens safe urls', () => {
    const c = make()
    expect(call('openUrl', { url: 'https://a.test' }, c)).toBeUndefined()
    call('openUrl', { url: 'javascript:alert(1)' }, c)
    expect(c.opened).toEqual(['https://a.test'])
    expect(c.errors[0]?.error).toMatchObject({ code: 'VALIDATION_FAILED', path: '/args/url' })
  })
  it('unknown function reports and resolves undefined', () => {
    const c = make()
    expect(call('nope', {}, c)).toBeUndefined()
    expect(c.errors[0]?.error.code).toBe('UNKNOWN_FUNCTION')
  })
})

describe('resolveDynamic', () => {
  it('passes literals through', () => {
    const { ctx } = make()
    expect(resolveDynamic('a', ctx)).toBe('a')
    expect(resolveDynamic(3, ctx)).toBe(3)
  })
  it('resolves absolute and scoped paths', () => {
    const { ctx } = make({ a: 1, list: [{ n: 'x' }] })
    expect(resolveDynamic({ path: '/a' }, ctx)).toBe(1)
    expect(resolveDynamic({ path: 'n' }, { ...ctx, scope: '/list/0' })).toBe('x')
  })
  it('a relative path outside a scope is INVALID_PATH, reported once', () => {
    const { ctx, errors } = make({ a: 1 })
    expect(resolveDynamic({ path: 'a' }, ctx)).toBeUndefined()
    expect(errors).toHaveLength(1)
    expect(errors[0]?.error.code).toBe('INVALID_PATH')
  })
  it('resolves call args as dynamic values', () => {
    const { ctx } = make({ flag: false })
    expect(resolveDynamic({ call: 'not', args: { value: { path: '/flag' } } }, ctx)).toBe(true)
    expect(
      resolveDynamic(
        { call: 'and', args: { values: [true, { call: 'not', args: { value: false } }] } },
        ctx,
      ),
    ).toBe(true)
  })
})

describe('formatString', () => {
  it('interpolates paths', () => {
    const { ctx } = make({ user: { name: 'Ada' } })
    expect(formatString('Hi ${/user/name}!', ctx)).toBe('Hi Ada!')
    expect(formatString('Hi ${name}!', { ...ctx, scope: '/user' })).toBe('Hi Ada!')
  })
  it('calls functions with nested interpolation', () => {
    const { ctx } = make({ n: 3 })
    expect(formatString('${formatNumber(value:${/n}, decimals:2)}', ctx)).toBe('3.00')
    expect(formatString('${pluralize(value:${/n}, one:\'item\', other:"items")}', ctx)).toBe(
      'items',
    )
    expect(formatString('${not(value:true)}', ctx)).toBe('false')
  })
  it('keeps escaped and unbalanced openers literal', () => {
    const { ctx } = make()
    expect(formatString('\\${x}', ctx)).toBe('${x}')
    expect(formatString('${unclosed', ctx)).toBe('${unclosed')
    expect(formatString('${f(a:1', ctx)).toBe('${f(a:1')
  })
  it('renders null as empty and objects as JSON', () => {
    const { ctx } = make({ o: { a: 1 }, l: [1] })
    expect(formatString('[${/missing}]', ctx)).toBe('[]')
    expect(formatString('${/o} ${/l}', ctx)).toBe('{"a":1} [1]')
  })
  it('reports an unknown function', () => {
    const { ctx, errors } = make()
    expect(formatString('${nope(a:1)}', ctx)).toBe('')
    expect(errors[0]?.error.code).toBe('UNKNOWN_FUNCTION')
  })
  it('formats a 10,000-char hostile template to itself, quickly', () => {
    const { ctx } = make()
    const t = '${'.repeat(5000)
    const started = Date.now()
    expect(formatString(t, ctx)).toBe(t)
    expect(Date.now() - started).toBeLessThan(100)
  })
  it('returns a 10,001-char template verbatim and reports it', () => {
    const { ctx, errors } = make({ a: 1 })
    const t = 'x'.repeat(9_991) + '${/a}' + '!!!!!'
    expect(t.length).toBe(10_001)
    expect(formatString(t, ctx)).toBe(t)
    expect(errors[0]?.error).toMatchObject({ code: 'VALIDATION_FAILED', path: '/args/value' })
  })
  it('stays fast on hostile nesting', () => {
    const { ctx } = make()
    const started = Date.now()
    formatString('${'.repeat(5000), ctx)
    formatString('${f('.repeat(5000), ctx)
    expect(Date.now() - started).toBeLessThan(1000)
  })
  it('falls back to the current locale when locale is empty', () => {
    const { ctx } = make({}, { locale: '' })
    expect(formatString('${formatNumber(value:1234)}', ctx)).toMatch(/1.234|1,234/)
  })
})
