/**
 * `cascivo/token-values` — RuleTester coverage.
 *
 * The valid cases carry the weight here. This rule reads every `style` prop in an adopter's
 * app, and the namespace it polices is one adopters also write into (`--cascivo-button-bg`
 * on their own element is the documented way to re-point a component token). A rule that
 * warns on a correct override is a rule that gets switched off, which costs more than it
 * ever caught.
 */
import * as tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { describe, it } from 'node:test'
import rule from './token-values.js'

/**
 * The TypeScript parser, not espree — `style={{ … } as CSSProperties}` is the shape this
 * rule exists to see through, and espree cannot parse `as` at all. Testing the rule on
 * JS-only syntax would leave the one branch that matters uncovered.
 */
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2023,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

describe('cascivo/token-values', () => {
  it('runs', () => {
    ruleTester.run('token-values', rule, {
      valid: [
        // Real semantic token, as a key and as a var() reference.
        `<div style={{ '--cascivo-color-accent': 'red' }} />`,
        `<div style={{ color: 'var(--cascivo-color-accent)' }} />`,
        // Real component-layer token — rung 1 of the override ladder.
        `<Button style={{ '--cascivo-button-radius': '0' }}>Save</Button>`,
        // Through the cast every adopter writes, because CSSProperties has no `--*` index.
        `<div style={{ '--cascivo-color-accent': 'red' } as CSSProperties} />`,
        // Somebody else's custom property is none of this rule's business.
        `<div style={{ '--my-app-gap': '4px' }} />`,
        `<div style={{ color: 'var(--shadcn-primary)' }} />`,
        // A plain style prop with no custom properties and no literal that maps to a token.
        `<div style={{ display: 'flex' }} />`,
        // Not a style prop.
        `<div data-x={{ '--cascivo-nope': 1 }} />`,
        // Literal→token suggestions are `cascivo audit --ai`'s job, not this rule's: it
        // scopes by CSS property and reads CSS files, neither of which ESLint can do here.
        `<div style={{ color: 'oklch(1 0 0)' }} />`,
        `<div style={{ background: '#3b82f6' }} />`,
        // `satisfies CascivoTokenStyle` is the documented pattern; it must not double-report.
        `<div style={{ '--cascivo-color-accent': 'red' } satisfies CascivoTokenStyle} />`,
      ],
      invalid: [
        {
          // The canonical failure: silently dropped, no error anywhere else in the stack.
          code: `<div style={{ '--cascivo-color-acent': 'red' }} />`,
          errors: [{ messageId: 'unknownToken' }],
        },
        {
          // The `--cascivo-text-*` (size) vs `--cascivo-font-*` (weight/family) trap.
          code: `<div style={{ '--cascivo-text-color': 'red' }} />`,
          errors: [{ messageId: 'unknownToken' }],
        },
        {
          // A cast does not launder the typo any more.
          code: `<div style={{ '--cascivo-color-acent': 'red' } as CSSProperties} />`,
          errors: [{ messageId: 'unknownToken' }],
        },
        {
          // A var() reference to a name that does not exist resolves to nothing.
          code: `<div style={{ color: 'var(--cascivo-color-acent)' }} />`,
          errors: [{ messageId: 'unknownToken' }],
        },
        {
          // Far enough from every shipped name that guessing would be noise — still wrong.
          code: `<div style={{ '--cascivo-zzzzzzzzzzzzzzzz': 'red' }} />`,
          errors: [{ messageId: 'unknownTokenNoGuess' }],
        },
      ],
    })
  })
})
