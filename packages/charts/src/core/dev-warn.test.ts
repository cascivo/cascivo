import { describe, it, expect, vi, afterEach } from 'vitest'
import { warnNonFinite, __resetChartWarnings } from './dev-warn'

afterEach(() => {
  __resetChartWarnings()
  vi.restoreAllMocks()
})

describe('warnNonFinite', () => {
  it('warns once when series data contains non-finite values', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnNonFinite('LineChart', () => [1, 2, Number.NaN, 4, Number.POSITIVE_INFINITY])
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0]?.[0]).toContain('LineChart')
    expect(spy.mock.calls[0]?.[0]).toContain('2 non-finite')
  })

  it('does not warn when all values are finite', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnNonFinite('AreaChart', () => [1, 2, 3])
    expect(spy).not.toHaveBeenCalled()
  })

  it('dedupes repeated warnings for the same chart key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnNonFinite('LineChart', () => [Number.NaN])
    warnNonFinite('LineChart', () => [Number.NaN])
    expect(spy).toHaveBeenCalledOnce()
  })
})
