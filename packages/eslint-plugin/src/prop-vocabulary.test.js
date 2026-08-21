/**
 * `cascivo/prop-vocabulary` — RuleTester coverage.
 *
 * Two things are being asserted, and the second matters more than the first.
 *
 * 1. Each case reports, with a message that names the prop that exists. A rule whose message
 *    is no better than TypeScript's own error has no reason to be installed.
 * 2. Each case stays QUIET where it should. This rule runs on every JSX element in an
 *    adopter's app; a false positive on `<Text>` or `<Flex>` is a warning they see hundreds
 *    of times, and the rational response is to delete `@cascivo/eslint-config` — which also
 *    takes `react-hooks/immutability` with it, the thing that config exists for.
 */
import { Linter, RuleTester } from 'eslint'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import rule from './prop-vocabulary.js'

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

describe('cascivo/prop-vocabulary', () => {
  it('runs', () => {
    ruleTester.run('prop-vocabulary', rule, {
      valid: [
        // The props that actually exist.
        '<Text muted>Secondary</Text>',
        '<DataTable rows={rows} columns={cols} />',
        '<DataList items={items} />',
        '<Badge variant="secondary">New</Badge>',
        // Numeric gap, the correct form.
        '<Flex gap={4} direction="horizontal" />',
        // A non-numeric string on a space prop is somebody else's `gap`, not ours.
        '<Grid gap="var(--x)" />',
        // Another component's `tone` is a real prop — the rule is per-component.
        '<Status tone="danger" />',
        '<Timeline tone="info" items={items} />',
        // Flex with an explicit direction says what it means.
        '<Flex direction="horizontal" justify="between" />',
        // Flex with neither is not making the mistake.
        '<Flex gap={2}><span /></Flex>',
        // A spread might carry `direction`; never guess about what cannot be seen.
        '<Flex justify="between" {...rest} />',
        // The tuple form.
        'const [theme, setTheme] = useTheme()',
        // An unrelated hook that legitimately returns an object.
        'const { data } = useQuery()',
        // Real exports, including the alias that now works.
        "import { Switch, Toggle } from '@cascivo/react'",
        // A foreign name imported from somewhere else entirely is not ours to comment on.
        "import { Dialog } from '@radix-ui/react-dialog'",
      ],
      invalid: [
        {
          code: '<Text tone="subtle">Secondary</Text>',
          errors: [{ messageId: 'wrongProp' }],
        },
        {
          code: '<DataTable items={rows} columns={cols} />',
          errors: [{ messageId: 'wrongProp' }],
        },
        {
          code: '<Badge shape="pill">New</Badge>',
          errors: [{ messageId: 'wrongProp' }],
        },
        {
          code: '<Flex gap="4" direction="horizontal" />',
          output: '<Flex gap={4} direction="horizontal" />',
          errors: [{ messageId: 'stringSpaceStep' }],
        },
        {
          code: '<Flex justify="between" />',
          errors: [{ messageId: 'defaultDirection' }],
        },
        {
          code: 'const { theme, setTheme } = useTheme()',
          errors: [{ messageId: 'tupleHook' }],
        },
        {
          code: "import { Dialog } from '@cascivo/react'",
          output: "import { Modal } from '@cascivo/react'",
          errors: [{ messageId: 'foreignImport' }],
        },
        {
          // Aliased import: reported, but NOT fixed — every use site would have to move too.
          code: "import { Dialog as D } from '@cascivo/react'",
          errors: [{ messageId: 'foreignImport' }],
        },
      ],
    })
  })
})

/**
 * The message is the product. `messageId` assertions above prove the rule fires; these prove
 * it says something an adopter can act on without opening a doc — which is the entire reason
 * this rule exists rather than leaving the type error to speak for itself.
 */
describe('the messages carry the answer, not just the complaint', () => {
  const linter = new Linter()
  const config = {
    plugins: { cascivo: { rules: { 'prop-vocabulary': rule } } },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { 'cascivo/prop-vocabulary': 'warn' },
  }
  const messageFor = (code) => linter.verify(code, config)[0]?.message ?? ''

  it('names the prop that exists, and why it is not the one you wrote', () => {
    const message = messageFor('<Text tone="subtle">x</Text>')
    assert.match(message, /has no `tone` prop/)
    assert.match(message, /it is `muted`/)
    assert.match(message, /SEVERITY vocabulary/)
  })

  it('shows the numeric form rather than just rejecting the string', () => {
    assert.match(messageFor('<Flex gap="4" />'), /gap=\{4\}/)
  })

  it("explains Flex's surprising default rather than only flagging it", () => {
    const message = messageFor('<Flex justify="between" />')
    assert.match(message, /it is VERTICAL/)
    assert.match(message, /unlike Chakra\/MUI\/Radix/)
  })

  it('names the cascivo component behind a foreign import', () => {
    assert.match(messageFor("import { Dialog } from '@cascivo/react'"), /`Dialog` is `Modal`/)
  })
})
