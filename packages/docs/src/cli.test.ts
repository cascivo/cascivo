import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// The CLI is dependency-free .mjs; import its exported entry points directly.
import { run, resolveContentDir } from '../bin/cli.mjs'

// A minimal fixture content/ tree so the tests never touch the network or the
// real (build-time) bundle.
let fixture: string

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), 'cascivo-docs-'))
  writeFileSync(join(fixture, 'llms.txt'), 'INDEX: the cascivo llms index\n')
  writeFileSync(join(fixture, 'llms-full.txt'), 'FULL: the entire library\n')
  writeFileSync(join(fixture, 'registry.json'), '{"version":"9.9.9"}\n')
  mkdirSync(join(fixture, 'llms'))
  writeFileSync(join(fixture, 'llms', 'button.md'), '# Button\nprops...\n')
  mkdirSync(join(fixture, 'llms', 'chart'))
  writeFileSync(join(fixture, 'llms', 'chart', 'area-chart.md'), '# AreaChart\n')
  mkdirSync(join(fixture, 'guides'))
  writeFileSync(join(fixture, 'guides', 'theming.md'), '# Theming guide\n')
})

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true })
})

function capture(argv: string[]): { code: number; out: string; err: string } {
  let out = ''
  let err = ''
  const code = run(argv, {
    env: { CASCIVO_DOCS_CONTENT: fixture },
    stdout: (s: string) => {
      out += s
    },
    stderr: (s: string) => {
      err += s
    },
  })
  return { code, out, err }
}

describe('cascivo-docs CLI', () => {
  it('resolves the content dir from the env override', () => {
    expect(resolveContentDir({ CASCIVO_DOCS_CONTENT: fixture })).toBe(fixture)
  })

  it('prints the index (llms.txt) with no args', () => {
    const r = capture([])
    expect(r.code).toBe(0)
    expect(r.out).toContain('INDEX:')
  })

  it('prints llms-full.txt with --full', () => {
    const r = capture(['--full'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('FULL:')
  })

  it('prints a flat component doc by name', () => {
    const r = capture(['button'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('# Button')
  })

  it('finds a component doc nested one level deep (chart/area-chart)', () => {
    const r = capture(['area-chart'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('# AreaChart')
  })

  it('prints a guide by slug', () => {
    const r = capture(['guide', 'theming'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('# Theming guide')
  })

  it('--dir prints the content dir path', () => {
    const r = capture(['--dir'])
    expect(r.code).toBe(0)
    expect(r.out.trim()).toBe(fixture)
  })

  it('--list enumerates docs including the guide', () => {
    const r = capture(['--list'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('button')
    expect(r.out).toContain('area-chart')
    expect(r.out).toContain('guide theming')
  })

  it('--help prints usage', () => {
    const r = capture(['--help'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('Usage:')
  })

  it('exits non-zero with a hint for an unknown component', () => {
    const r = capture(['does-not-exist'])
    expect(r.code).toBe(1)
    expect(r.err).toContain('--list')
  })

  it('exits 2 when `guide` is given no slug', () => {
    const r = capture(['guide'])
    expect(r.code).toBe(2)
  })

  it('never imports http/fetch — the CLI source is offline-only', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../bin/cli.mjs', import.meta.url), 'utf8'),
    )
    expect(src).not.toMatch(/\bfetch\s*\(|node:http|from ['"]https?:/)
  })
})
