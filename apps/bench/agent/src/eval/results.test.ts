import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, classify, parseEvalRun } from './results.ts'
import { record, run } from './fixtures.ts'

describe('classify', () => {
  const ok = { infra: false, build: true, types: true, eval: true }

  it('follows precedence', () => {
    expect(classify({ infra: true, build: false, types: false, eval: false })).toBe('infra-error')
    expect(classify({ ...ok, build: false, types: false })).toBe('fail-build')
    expect(classify({ ...ok, types: false, eval: false })).toBe('fail-types')
    expect(classify({ ...ok, eval: false })).toBe('fail-eval')
    expect(classify(ok)).toBe('pass')
  })
})

describe('parseEvalRun', () => {
  const parse = (value: unknown) => parseEvalRun(JSON.parse(JSON.stringify(value)))

  it('exports the schema version', () => {
    expect(SCHEMA_VERSION).toBe(1)
  })

  it('accepts a valid run, including null measurements', () => {
    const full = run({
      records: [
        record(),
        record({
          attempt: 2,
          status: 'infra-error',
          detail: 'timeout',
          usage: null,
          tscErrors: null,
          axe: null,
          auditErrors: null,
          auditWarnings: null,
        }),
      ],
      attempts: 2,
    })
    expect(parse(full)).toEqual(full)
  })

  it('rejects schemaVersion 2', () => {
    expect(() => parse({ ...run(), schemaVersion: 2 })).toThrow(/schemaVersion/)
  })

  it('rejects an unknown status and names the record', () => {
    const bad = run({ records: [record(), record({ status: 'maybe' as never })] })
    expect(() => parse(bad)).toThrow(/records\[1\]\.status/)
  })

  it('rejects a negative spentUsd', () => {
    expect(() => parse(run({ spentUsd: -1 }))).toThrow(/spentUsd/)
  })

  it('rejects non-array records', () => {
    expect(() => parse({ ...run(), records: {} })).toThrow(/records/)
  })

  it('rejects non-objects and missing fields', () => {
    expect(() => parseEvalRun(null)).toThrow(/eval results/)
    const { commit: _commit, ...rest } = run()
    expect(() => parse(rest)).toThrow(/commit/)
  })

  it('names nested fields', () => {
    expect(() => parse(run({ records: [record({ axe: { critical: -1 } as never })] }))).toThrow(
      /records\[0\]\.axe\.critical/,
    )
    expect(() => parse(run({ records: [record({ attempt: 0 })] }))).toThrow(/records\[0\]\.attempt/)
    expect(() => parse(run({ records: [record({ usage: { costUsd: 1 } as never })] }))).toThrow(
      /records\[0\]\.usage\./,
    )
  })

  it('truncates nothing but rejects an over-long detail', () => {
    expect(() => parse(run({ records: [record({ detail: 'x'.repeat(501) })] }))).toThrow(
      /records\[0\]\.detail/,
    )
  })
})
