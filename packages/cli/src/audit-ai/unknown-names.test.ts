import { describe, expect, it } from 'vitest'
import type { Contract } from '../utils/contract-pure.js'
import { findUnknownNameViolations } from './unknown-names.js'

function contract(overrides: Partial<Contract> = {}): Contract {
  return {
    tokensByValue: new Map(),
    components: new Map(),
    domAttributes: new Set(),
    tokenNames: new Set([
      '--cascivo-color-accent',
      '--cascivo-color-text',
      '--cascivo-space-4',
      '--cascivo-flash-tint',
    ]),
    styleHooks: new Set(['data-cascivo-modal-body', 'data-cascivo-appshell-nav']),
    ...overrides,
  }
}

describe('unknown-token', () => {
  it('reports a token that does not exist, with the token that does', () => {
    const [finding, ...rest] = findUnknownNameViolations(
      '.a { color: var(--cascivo-color-acent); }',
      'a.css',
      contract(),
    )
    expect(rest).toEqual([])
    expect(finding).toMatchObject({
      rule: 'unknown-token',
      level: 'error',
      name: '--cascivo-color-acent',
      suggestion: '--cascivo-color-accent',
      line: 1,
    })
  })

  it('finds a segments-swapped name, which edit distance alone never would', () => {
    // The trap docs/TOKENS.md documents: `--cascivo-text-*` is the SIZE scale, so
    // `--cascivo-text-color` reads like a colour token and resolves to nothing.
    const [finding] = findUnknownNameViolations(
      '.a { color: var(--cascivo-text-color); }',
      'a.css',
      contract(),
    )
    expect(finding).toMatchObject({ suggestion: '--cascivo-color-text' })
  })

  it('accepts a knob that is only ever read, never declared', () => {
    // `--cascivo-flash-tint` is documented as settable but appears in no declaration, so a
    // catalog built from declarations cannot see it. Reporting it would be a false positive
    // on code the guides tell people to write.
    expect(
      findUnknownNameViolations('.a { --cascivo-flash-tint: red; }', 'a.css', contract()),
    ).toEqual([])
  })

  it('stays quiet on real tokens and on somebody else’s namespace', () => {
    const source = `.a {
      --cascivo-color-accent: red;
      padding: var(--cascivo-space-4);
      gap: var(--my-app-gap);
      color: var(--shadcn-primary);
    }`
    expect(findUnknownNameViolations(source, 'a.css', contract())).toEqual([])
  })

  it('cannot check against a contract that predates the field', () => {
    // An empty set means the shipped contract is older than this rule — NOT that no token
    // exists. Reporting every name in the file would be the worst possible failure mode.
    expect(
      findUnknownNameViolations(
        '.a { color: var(--cascivo-anything); }',
        'a.css',
        contract({ tokenNames: new Set(), styleHooks: new Set() }),
      ),
    ).toEqual([])
  })
})

describe('unknown-style-hook', () => {
  it('reports a hook selector that matches nothing', () => {
    const [finding] = findUnknownNameViolations(
      '@layer cascivo.override {\n  [data-cascivo-modl-body] { padding: 0; }\n}',
      'a.css',
      contract(),
    )
    expect(finding).toMatchObject({
      rule: 'unknown-style-hook',
      level: 'error',
      name: 'data-cascivo-modl-body',
      suggestion: 'data-cascivo-modal-body',
      line: 2,
    })
  })

  it('accepts a shipped hook', () => {
    expect(
      findUnknownNameViolations(
        '[data-cascivo-appshell-nav] { inline-size: 22rem; }',
        'a.css',
        contract(),
      ),
    ).toEqual([])
  })
})
