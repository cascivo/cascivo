import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildComponentMarkdown,
  buildContextIndex,
  buildContextPrompt,
  type RegistryEntry,
  type Registry,
} from './generate.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BUTTON: RegistryEntry = {
  name: 'button',
  type: 'component',
  description: 'Triggers an action or event',
  category: 'inputs',
  meta: {
    name: 'Button',
    description: 'Triggers an action or event',
    category: 'inputs',
    props: [
      { name: 'variant', type: "'primary' | 'secondary'", required: false, default: 'primary' },
    ],
    tokens: ['--cascivo-color-accent', '--cascivo-radius-button'],
    examples: [{ title: 'Primary', code: '<Button>Click me</Button>' }],
    intent: {
      whenToUse: ['Triggering an action the user initiates', 'Submitting a form'],
      whenNotToUse: ['Navigation — use an anchor instead'],
      antiPatterns: [
        {
          bad: '<Button onClick={() => navigate("/x")}>Home</Button>',
          good: '<a href="/x">Home</a>',
          why: 'Buttons are for actions, links for navigation',
        },
      ],
      related: [
        { name: 'Toggle', relationship: 'alternative', reason: 'Use for binary on/off state' },
      ],
      a11yRationale: 'Renders a native <button> so Enter/Space activation comes from the platform',
      flexibility: [
        { area: 'token names', level: 'strict', note: 'Must resolve to --cascivo-button-* tokens' },
        { area: 'label copy', level: 'flexible', note: 'Free, within tone guidance' },
      ],
    },
  },
}

const BADGE: RegistryEntry = {
  name: 'badge',
  type: 'component',
  description: 'Compact status label',
  category: 'display',
  meta: {
    name: 'Badge',
    description: 'Compact status label',
    category: 'display',
    props: [],
    tokens: ['--cascivo-color-accent'],
    examples: [],
    intent: {
      whenToUse: ['Showing a count or status on a container'],
      whenNotToUse: ['Replacing full alert messages'],
    },
  },
}

const NO_INTENT: RegistryEntry = {
  name: 'spinner',
  type: 'component',
  description: 'Loading indicator',
  category: 'feedback',
  meta: {
    name: 'Spinner',
    description: 'Loading indicator',
    category: 'feedback',
    intent: null,
  },
}

const FIXTURE_REGISTRY: Registry = {
  version: '2.0.0',
  generatedAt: '2026-01-01T00:00:00.000Z',
  components: [BUTTON, BADGE, NO_INTENT],
}

// ---------------------------------------------------------------------------
// buildContextIndex tests
// ---------------------------------------------------------------------------

describe('buildContextIndex', () => {
  it('includes only the provided entries', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON, BADGE, NO_INTENT])
    assert.equal(index.components.length, 3)
  })

  it('sorts components alphabetically by name', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON, BADGE, NO_INTENT])
    const names = index.components.map((c) => c.name)
    assert.deepEqual(names, ['Badge', 'Button', 'Spinner'])
  })

  it('sets generatedAt to an ISO string', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    assert.match(index.generatedAt, /^\d{4}-\d{2}-\d{2}T/)
  })

  it('defaults boundaries and exceptions to null and specs to []', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    assert.equal(index.boundaries, null)
    assert.equal(index.exceptions, null)
    assert.deepEqual(index.specs, [])
  })

  it('folds in specs, boundaries, and exceptions extras', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON], {
      specs: [{ id: 'spec-spacing', title: 'Spacing', path: '/docs/specs/spacing.md' }],
      boundaries: { global: { strict: [], flexible: [] } },
      exceptions: { exceptions: [{ id: 'EXC-001' }] },
    })
    assert.deepEqual(index.specs, [
      { id: 'spec-spacing', title: 'Spacing', path: '/docs/specs/spacing.md' },
    ])
    assert.deepEqual(index.boundaries, { global: { strict: [], flexible: [] } })
    assert.deepEqual(index.exceptions, { exceptions: [{ id: 'EXC-001' }] })
  })

  it('sets contextUrl as /context/<name>.md using registry entry name', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    const entry = index.components.find((c) => c.name === 'Button')!
    assert.equal(entry.contextUrl, '/context/button.md')
  })

  it('preserves intent on entries that have it', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    const entry = index.components.find((c) => c.name === 'Button')!
    assert.ok(entry.intent !== null)
    assert.deepEqual(entry.intent?.whenToUse, [
      'Triggering an action the user initiates',
      'Submitting a form',
    ])
  })

  it('sets intent to null for entries without intent', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [NO_INTENT])
    const entry = index.components.find((c) => c.name === 'Spinner')!
    assert.equal(entry.intent, null)
  })

  it('includes authoringRules array with expected content', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    assert.ok(Array.isArray(index.authoringRules))
    assert.ok(index.authoringRules.length > 0)
    assert.ok(index.authoringRules.some((r) => r.includes('useSignal')))
  })

  it('sets tokenCatalogUrl', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    assert.equal(index.tokenCatalogUrl, '/tokens.catalog.json')
  })

  it('sets variantMatrixUrl', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON])
    assert.equal(index.variantMatrixUrl, '/tokens.variants.json')
  })
})

// ---------------------------------------------------------------------------
// buildComponentMarkdown tests
// ---------------------------------------------------------------------------

describe('buildComponentMarkdown', () => {
  it('starts with the display name as h1', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.startsWith('# Button'))
  })

  it('includes whenToUse entries', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('Triggering an action the user initiates'))
    assert.ok(md.includes('Submitting a form'))
  })

  it('includes whenNotToUse entries', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## When NOT to use'))
    assert.ok(md.includes('Navigation — use an anchor instead'))
  })

  it('includes anti-patterns section', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Anti-patterns'))
    assert.ok(md.includes('Buttons are for actions, links for navigation'))
  })

  it('includes related components', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Related components'))
    assert.ok(md.includes('Toggle'))
  })

  it('includes a11y rationale', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Accessibility rationale'))
    assert.ok(md.includes('native <button>'))
  })

  it('includes props table', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Props'))
    assert.ok(md.includes('| `variant`'))
  })

  it('includes tokens section', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Tokens'))
    assert.ok(md.includes('--cascivo-color-accent'))
  })

  it('includes examples section', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Examples'))
    assert.ok(md.includes('<Button>Click me</Button>'))
  })

  it('includes flexibility/boundaries table', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## Boundaries'))
    assert.ok(md.includes('token names'))
    assert.ok(md.includes('strict'))
  })

  it('writes a placeholder for components with null intent', () => {
    const md = buildComponentMarkdown(NO_INTENT)
    assert.ok(md.includes('Intent not yet documented'))
    assert.ok(!md.includes('## When to use'))
  })

  it('includes the AI context prompt section', () => {
    const md = buildComponentMarkdown(BUTTON)
    assert.ok(md.includes('## AI context prompt'))
    assert.ok(md.includes('I am modifying the cascivo Button component'))
  })
})

// ---------------------------------------------------------------------------
// buildContextPrompt tests
// ---------------------------------------------------------------------------

describe('buildContextPrompt', () => {
  it('names the component and category', () => {
    const prompt = buildContextPrompt(BUTTON)
    assert.ok(prompt.startsWith('I am modifying the cascivo Button component (inputs).'))
  })

  it('lists the bound tokens and forbids inventing new ones', () => {
    const prompt = buildContextPrompt(BUTTON)
    assert.ok(prompt.includes('--cascivo-color-accent'))
    assert.ok(prompt.includes('do not invent token names'))
  })

  it('pins the architecture rules (signals, container queries)', () => {
    const prompt = buildContextPrompt(BUTTON)
    assert.ok(prompt.includes('Signals only'))
    assert.ok(prompt.includes('@container'))
    assert.ok(prompt.includes('Do not use global viewport @media'))
  })

  it('surfaces strict boundaries', () => {
    const prompt = buildContextPrompt(BUTTON)
    assert.ok(prompt.includes('Do not change (strict): token names'))
  })

  it('handles components with no intent or accessibility', () => {
    const prompt = buildContextPrompt(NO_INTENT)
    assert.ok(prompt.includes('Spinner'))
    assert.ok(prompt.includes('none declared'))
  })
})

// ---------------------------------------------------------------------------
// buildContextIndex — aiPrompt
// ---------------------------------------------------------------------------

describe('buildContextIndex aiPrompt', () => {
  it('attaches an aiPrompt to every component entry', () => {
    const index = buildContextIndex(FIXTURE_REGISTRY, [BUTTON, BADGE, NO_INTENT])
    assert.ok(
      index.components.every((c) => typeof c.aiPrompt === 'string' && c.aiPrompt.length > 0),
    )
  })
})
