import { describe, expect, it } from 'vitest'
import { lintEmail } from './email-lint.js'

function spawned(status: number, stdout: string, stderr = '') {
  const calls: { args: string[]; input: string; cwd?: string }[] = []
  const spawn = (
    _: string,
    args: string[],
    options: { encoding: 'utf8'; input: string; cwd?: string },
  ) => {
    calls.push({ args, input: options.input, ...(options.cwd ? { cwd: options.cwd } : {}) })
    return { status, stdout, stderr }
  }
  return { spawn, calls }
}

describe('lintEmail', () => {
  it('pipes the HTML to `cascivo email lint -` in the given project', () => {
    const { spawn, calls } = spawned(0, '✓ (stdin)\n\n1 file, 0 blocked, 0 caveats.\n')
    const result = lintEmail({ html: '<p>hi</p>', cwd: '/app' }, spawn)
    expect(calls).toEqual([
      { args: ['-y', 'cascivo', 'email', 'lint', '-'], input: '<p>hi</p>', cwd: '/app' },
    ])
    expect(result).toEqual({ passed: true, report: '✓ (stdin)\n\n1 file, 0 blocked, 0 caveats.' })
  })

  it('passes --check-links through', () => {
    const { spawn, calls } = spawned(0, '1 file, 0 blocked, 0 caveats.')
    lintEmail({ html: '', checkLinks: true }, spawn)
    expect(calls[0]?.args).toContain('--check-links')
  })

  it('reports a failing email as a result, not an error', () => {
    const report = '✗ (stdin)\n  ✗ link  <a> "#" points at "#"\n\n1 file, 1 blocked, 0 caveats.'
    const { spawn } = spawned(1, report)
    expect(lintEmail({ html: '<a href="#">x</a>' }, spawn)).toEqual({ passed: false, report })
  })

  it('throws with the CLI’s own message when the lint could not run', () => {
    const { spawn } = spawned(
      1,
      '',
      'cascivo email lint needs @cascivo/email, which is not installed here.',
    )
    expect(() => lintEmail({ html: '' }, spawn)).toThrow(/needs @cascivo\/email/)
  })
})
