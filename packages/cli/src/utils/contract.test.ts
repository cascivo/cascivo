import { describe, expect, it } from 'vitest'
import { buildContract, normalizeValue } from './contract.js'

const fixture = {
  catalog: {
    tokens: [
      { name: '--cascivo-color-accent', resolvedDefault: 'oklch(0.623 0.214 250)' },
      { name: '--cascivo-color-brand', resolvedDefault: 'oklch(0.623 0.214 250)' },
      { name: '--cascivo-color-fg', resolvedDefault: '#111111' },
      { name: '--cascivo-space-2', resolvedDefault: '8px' },
      { name: '--cascivo-color-themed', resolvedDefault: null },
    ],
  },
  registry: {
    components: [
      {
        meta: {
          name: 'Button',
          props: [
            { name: 'variant', type: "'primary' | 'secondary'", required: false },
            { name: 'onClick', type: 'fn' },
          ],
        },
      },
      {
        meta: {
          name: 'Avatar',
          props: [{ name: 'alt', type: 'string', required: true }],
        },
      },
      { meta: { name: 'NoProps' } },
    ],
  },
  context: {
    components: [
      { name: 'Button', intent: { content: { tone: 'imperative' } } },
      { name: 'Avatar', intent: {} },
    ],
  },
}

describe('normalizeValue', () => {
  it('lowercases and strips spaces', () => {
    expect(normalizeValue('OKLCH(0.623 0.214 250)')).toBe('oklch(0.6230.214250)')
    expect(normalizeValue('#3B82F6')).toBe('#3b82f6')
  })
})

describe('buildContract — tokensByValue', () => {
  const contract = buildContract(fixture)

  it('maps a normalized value to its token name(s)', () => {
    expect(contract.tokensByValue.get(normalizeValue('oklch(0.623 0.214 250)'))).toEqual([
      '--cascivo-color-accent',
      '--cascivo-color-brand',
    ])
  })

  it('maps a hex value', () => {
    expect(contract.tokensByValue.get('#111111')).toEqual(['--cascivo-color-fg'])
  })

  it('skips tokens with null resolvedDefault', () => {
    const all = [...contract.tokensByValue.values()].flat()
    expect(all).not.toContain('--cascivo-color-themed')
  })
})

describe('buildContract — components', () => {
  const contract = buildContract(fixture)

  it('indexes Button props', () => {
    const button = contract.components.get('Button')
    expect(button?.props).toContainEqual({
      name: 'variant',
      type: "'primary' | 'secondary'",
      required: false,
    })
  })

  it('Button has no required props', () => {
    expect(contract.components.get('Button')?.requiredProps).toEqual([])
    expect(contract.components.get('Button')?.hasRequiredProps).toBe(false)
  })

  it('Avatar has a required prop', () => {
    expect(contract.components.get('Avatar')?.requiredProps).toEqual(['alt'])
    expect(contract.components.get('Avatar')?.hasRequiredProps).toBe(true)
  })

  it('marks components with intent.content', () => {
    expect(contract.components.get('Button')?.hasContent).toBe(true)
    expect(contract.components.get('Avatar')?.hasContent).toBe(false)
  })

  it('handles components without props', () => {
    expect(contract.components.get('NoProps')?.props).toEqual([])
  })
})

describe('loadContract — resolution tiers (2026-07-25 plan, WS-5)', () => {
  // The bug: the only resolution path walked up looking for `apps/site/public/`, a directory
  // that exists solely inside the cascivo monorepo, so `cascivo audit --ai` died with
  // "token catalog not found" in every consumer project — a documented, working feature
  // nobody outside this repo could run.

  it('an explicit --contract path is used verbatim', async () => {
    const { loadContract } = await import('./contract.js')
    const { mkdtempSync, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')

    const dir = mkdtempSync(join(tmpdir(), 'cascivo-contract-'))
    const file = join(dir, 'audit-contract.json')
    writeFileSync(
      file,
      JSON.stringify({
        version: '9.9.9',
        tokens: [{ name: '--cascivo-color-test', resolvedDefault: '#abcdef' }],
        components: [
          { name: 'Widget', props: [{ name: 'tone', type: 'string', required: false }] },
        ],
        content: ['Widget'],
      }),
    )

    const sources: string[] = []
    const contract = await loadContract({ contractPath: file, onResolve: (s) => sources.push(s) })

    expect(sources[0]).toContain('explicit')
    expect(contract.tokensByValue.get('#abcdef')).toEqual(['--cascivo-color-test'])
    expect(contract.components.get('Widget')?.props.map((p) => p.name)).toEqual(['tone'])
    expect(contract.components.get('Widget')?.hasContent).toBe(true)
  })

  it('a missing --contract path fails with an actionable message', async () => {
    const { loadContract } = await import('./contract.js')
    await expect(loadContract({ contractPath: '/nope/audit-contract.json' })).rejects.toThrow(
      /contract file not found/,
    )
  })

  it('the bundled contract exists and satisfies buildContract', async () => {
    // This is the tier that makes `audit` work in a real project. If the generator or the
    // build's copy step regresses, the CLI silently falls back to the network — or fails.
    const { readFileSync, existsSync } = await import('node:fs')
    const { join, dirname } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const here = dirname(fileURLToPath(import.meta.url))
    // Same two candidates the runtime tries: `dist/generated` once bundled, and
    // `src/generated` when running from source in this repo.
    const bundled = [
      join(here, 'generated', 'audit-contract.json'),
      join(here, '..', 'generated', 'audit-contract.json'),
    ].find((c) => existsSync(c))
    expect(bundled, 'no bundled audit-contract.json found').toBeDefined()

    const parsed = JSON.parse(readFileSync(bundled!, 'utf8')) as {
      version: string
      tokens: { name: string; resolvedDefault: string | null }[]
      components: { name: string; props: { name: string }[] }[]
      content: string[]
    }
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(parsed.tokens.length).toBeGreaterThan(100)
    expect(parsed.components.length).toBeGreaterThan(100)
    // Small enough to ship: the three source artifacts total ~2.3 MB.
    expect(readFileSync(bundled!, 'utf8').length).toBeLessThan(200 * 1024)

    const contract = buildContract({
      catalog: { tokens: parsed.tokens },
      registry: { components: parsed.components.map((c) => ({ meta: c })) },
      context: { components: parsed.content.map((name) => ({ name, intent: { content: true } })) },
    })
    expect(contract.components.get('Button')).toBeDefined()
  })
})
