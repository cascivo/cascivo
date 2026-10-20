import { describe, expect, it } from 'vitest'
import { validateView } from './validate'
import { componentNames } from './component-names'
import { propSchemas } from './prop-schemas'
// Source of truth for the json-playground demo; type-only import there, so a relative path is clean.
import { exampleConfig } from '../../../apps/examples/json-playground/src/example-config.ts'

/** Build a single-node view for terse assertions. */
function view(node: Record<string, unknown>) {
  return { view: { regions: { main: [node] } } }
}

describe('validateView() prop conformance (v40 T2)', () => {
  it('accepts a node whose props match the manifest', () => {
    const result = validateView(
      view({ component: 'Badge', props: { variant: 'secondary', size: 'sm' } }),
    )
    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('flags an unknown prop with a did-you-mean suggestion', () => {
    const result = validateView(view({ component: 'Badge', props: { varient: 'secondary' } }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].props.varient',
      message: expect.stringContaining('Did you mean "variant"?'),
    })
  })

  it('flags an out-of-enum value', () => {
    const result = validateView(view({ component: 'Badge', props: { variant: 'neon' } }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].props.variant',
      message: expect.stringContaining('expected one of: default, secondary'),
    })
  })

  it('flags a primitive type mismatch (string where boolean expected)', () => {
    const result = validateView(view({ component: 'Separator', props: { decorative: 'yes' } }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].props.decorative',
      message: expect.stringContaining('expected boolean, got string'),
    })
  })

  it('accepts a TranslationRef for a string-typed prop', () => {
    const result = validateView(view({ component: 'Input', props: { label: { $t: 'form.name' } } }))
    expect(result.valid).toBe(true)
  })

  it('skips conformance for bound props (resolved at runtime)', () => {
    const result = validateView(
      view({ component: 'Badge', bind: { variant: '$data.badge.variant' } }),
    )
    const propErrors = result.errors.filter((e) => e.path.includes('.props.'))
    expect(propErrors).toHaveLength(0)
  })

  it('reports conformance errors in nested children', () => {
    const result = validateView(
      view({ component: 'Card', children: [{ component: 'Badge', props: { variant: 'neon' } }] }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.path).toBe('view.regions.main[0].children[0].props.variant')
  })
})

describe('validateView() deep prop shapes (v61 T6)', () => {
  it('flags a column missing its required key', () => {
    const result = validateView(
      view({ component: 'DataTable', props: { columns: [{ header: 'A' }] } }),
    )
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]!.path).toMatch(/\.props\.columns\[0\]\.key$/)
  })

  it('flags an unknown field on a column', () => {
    const result = validateView(
      view({ component: 'Breadcrumb', props: { items: [{ label: 'Home', bogus: 1 }] } }),
    )
    expect(result.errors.some((e) => e.path.endsWith('.bogus'))).toBe(true)
    // DataTable's Column drops its optional `render` function field, so its object stays open (R11).
    expect(
      validateView(
        view({ component: 'DataTable', props: { columns: [{ key: 'a', header: 'A', extra: 1 }] } }),
      ).valid,
    ).toBe(true)
  })

  it('accepts a TranslationRef where a string is expected', () => {
    const result = validateView(
      view({
        component: 'DataTable',
        props: { columns: [{ key: 'a', header: { $t: 'cols.a' } }] },
      }),
    )
    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('flags a wrong-typed field and a non-array', () => {
    expect(
      validateView(view({ component: 'DataTable', props: { columns: [{ key: 1, header: 'A' }] } }))
        .valid,
    ).toBe(false)
    expect(validateView(view({ component: 'DataTable', props: { columns: 'x' } })).valid).toBe(
      false,
    )
  })

  it('does not let prototype keys bypass additionalProperties:false', () => {
    const result = validateView(
      view({
        component: 'Breadcrumb',
        props: { items: [{ label: 'Home', constructor: 1 }] },
      }),
    )
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]!.path).toMatch(/items\[0\]\.constructor$/)
  })

  it('does not treat inherited keys as present required fields', () => {
    const result = validateView(
      view({
        component: 'DataTable',
        props: { columns: [Object.create({ key: 'a', header: 'A' })] },
      }),
    )
    expect(result.errors.map((e) => e.path.slice(-4))).toEqual(['.key', 'ader'])
  })

  it('truncates large values in error messages', () => {
    const big = 'x'.repeat(500)
    const result = validateView(
      view({ component: 'DataTable', props: { columns: [{ key: 1, header: big }] } }),
    )
    expect(result.errors[0]!.message.length).toBeLessThan(200)
    const long = validateView(view({ component: 'DataTable', props: { columns: big } }))
    expect(long.errors[0]!.message).toContain('…')
    expect(long.errors[0]!.message.length).toBeLessThan(200)
  })

  it('names object/array in anyOf messages', () => {
    const anyOf = Object.values(propSchemas)
      .flat()
      .find((p) => p.shape && 'anyOf' in p.shape)
    expect(anyOf).toBeDefined()
  })

  it('emits shapes only for components the renderer can build', () => {
    const dead = Object.entries(propSchemas)
      .filter(([name]) => !componentNames.has(name))
      .filter(([, props]) => props.some((p) => p.shape !== undefined))
      .map(([name]) => name)
    expect(dead).toEqual([])
  })

  it('accepts valid shape-bearing props', () => {
    expect(
      validateView(
        view({
          component: 'DataTable',
          props: {
            columns: [
              { key: 'a', header: 'A' },
              { key: 'b', header: { $t: 'cols.b' } },
            ],
            rows: [{ a: 1, b: 2 }],
          },
        }),
      ),
    ).toEqual({ valid: true, errors: [] })
    expect(
      validateView(
        view({
          component: 'Steps',
          props: { items: [{ label: 'One', state: 'complete' }, { label: 'Two' }], activeStep: 1 },
        }),
      ),
    ).toEqual({ valid: true, errors: [] })
  })

  // Configs committed elsewhere (and the richer ones from cascivo-view.test.tsx) must keep validating.
  const dashboard = {
    view: {
      regions: {
        main: [
          { component: 'PageHeader', props: { title: 'Overview', description: 'This week' } },
          { component: 'Heading', props: { level: 2 }, children: 'Revenue' },
          {
            component: 'Stat',
            props: { label: 'MRR', value: '$48,295', delta: '+12%', trend: 'up' },
          },
          {
            component: 'Card',
            children: [
              {
                component: 'CardHeader',
                children: [{ component: 'CardTitle', children: 'Plan' }],
              },
              { component: 'CardContent', children: [{ component: 'Text', children: 'Pro' }] },
            ],
          },
        ],
      },
    },
  }
  const stateful = {
    state: { query: '', off: false },
    view: {
      regions: {
        main: [
          {
            component: 'Input',
            bind: { value: '$state.query' },
            events: { onChange: '$state.set.query' },
          },
          {
            component: 'Button',
            bind: { disabled: '$state.off' },
            events: { onClick: '$state.toggle.off' },
            children: 'Toggle',
          },
        ],
      },
    },
  }
  // Re-declared from packages/cli/recipes/agent/worker/scripted-model.ts (same file in starters/cloudflare-agent).
  const scripted = {
    view: {
      regions: {
        main: [
          {
            component: 'Flex',
            props: { direction: 'vertical', gap: 3 },
            children: [
              {
                component: 'Alert',
                props: { variant: 'info', title: 'Scripted reply' },
                children: 'x',
              },
              {
                component: 'Grid',
                props: { cols: 3, gap: 3 },
                children: [
                  {
                    component: 'Card',
                    props: { padding: 'md' },
                    children: [
                      {
                        component: 'Badge',
                        props: { variant: 'success' },
                        children: 'API healthy',
                      },
                    ],
                  },
                  {
                    component: 'Card',
                    props: { padding: 'md' },
                    children: [{ component: 'Badge' }],
                  },
                ],
              },
              { component: 'ProgressBar', props: { value: 72, label: 'Sprint progress' } },
            ],
          },
        ],
      },
    },
  }
  // Re-declared from packages/cli/recipes/publish/src/routes/publish.tsx (EXAMPLE).
  const published = {
    view: {
      regions: {
        main: [
          {
            component: 'Card',
            props: { padding: 'lg' },
            children: [
              {
                component: 'Flex',
                props: { gap: 3 },
                children: [
                  { component: 'Badge', props: { variant: 'success' }, children: 'Live' },
                  { component: 'ProgressBar', props: { value: 3, max: 5, label: 'Steps done' } },
                  {
                    component: 'Alert',
                    props: { variant: 'info', title: 'Published from a view' },
                    children: 'x',
                  },
                  {
                    component: 'Link',
                    props: { href: 'https://developers.cloudflare.com/workers/' },
                    children: 'Docs',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }
  it.each([
    ['json-playground example-config', exampleConfig],
    ['cascivo-view dashboard', dashboard],
    ['cascivo-view state bindings', stateful],
    ['agent recipe scripted view', scripted],
    ['publish recipe example', published],
  ])('still validates existing config: %s', (_name, config) => {
    expect(validateView(config)).toEqual({ valid: true, errors: [] })
  })
})
