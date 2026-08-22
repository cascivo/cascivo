import { describe, it, expect, vi, afterEach } from 'vitest'
import { warnEpochMilliseconds, warnNonFinite, __resetChartWarnings } from './dev-warn'

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

describe('warnEpochMilliseconds', () => {
  it('warns when x returns epoch milliseconds as a plain number', () => {
    __resetChartWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnEpochMilliseconds('AreaChart', 1_787_250_000_000, false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('looks like epoch milliseconds'))
    warn.mockRestore()
  })

  it('stays silent for a Date, an ordinary number, and when `format` is supplied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    __resetChartWarnings()
    warnEpochMilliseconds('AreaChart', new Date(), false)
    __resetChartWarnings()
    warnEpochMilliseconds('AreaChart', 42, false)
    __resetChartWarnings()
    warnEpochMilliseconds('AreaChart', 1_787_250_000_000, true)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('warns once per chart, not once per render', () => {
    __resetChartWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnEpochMilliseconds('LineChart', 1_787_250_000_000, false)
    warnEpochMilliseconds('LineChart', 1_787_250_000_000, false)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
