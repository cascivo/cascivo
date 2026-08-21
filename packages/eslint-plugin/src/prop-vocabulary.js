/**
 * `cascivo/prop-vocabulary` — say what the prop actually is.
 *
 * ## Why a lint rule and not more documentation
 *
 * The 2026-08-21 adopter report's sharpest finding was not any of its eleven defects. It was
 * this: "a fresh adopter's success is currently load-bearing on the docs staying this good —
 * the API itself still has the sharp edges. **The docs are doing work the API should
 * eventually do itself.**"
 *
 * Most of that work moved into the type system: `label` and `ariaLabel` both compile now,
 * `Switch` is exported, `Field` takes `hint`. What is left is the class TypeScript
 * structurally cannot help with. `<Text tone="subtle">` is a correct type error whose message
 * — "Property 'tone' does not exist on type 'TextProps'" — names the mistake and teaches
 * nothing, so the adopter goes looking for the docs anyway, which is exactly the dependency
 * the report flagged. TypeScript has no mechanism for a custom message on an unknown prop;
 * a runtime warning cannot tell a typo from a legitimate DOM passthrough and fires after the
 * build you are trying to fix. A lint rule is the one layer that can carry the sentence.
 *
 * ## Why `warn`, not `error`
 *
 * `@cascivo/eslint-config` enables this at `warn`. A lint rule that fails somebody's build
 * over a naming opinion gets the whole config deleted, and then the adopter loses
 * `react-hooks/immutability` too — which is the thing that config actually exists for.
 *
 * ## Why the data is generated
 *
 * Every case lives in `prop-vocabulary.json`, generated from
 * `packages/eslint-plugin/near-misses.json` and validated against `registry.json` at build
 * time (see `scripts/eslint-vocabulary/generate.ts`). The next friction report costs a row in
 * a JSON file rather than a paragraph in a guide, and a row that stops being true fails
 * `pnpm regen` instead of shipping a rule that lies.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
/** @type {import('./types.js').Vocabulary} */
const vocabulary = require('./prop-vocabulary.json')

/** The element name as written, e.g. `Text` in `<Text>` and `Card.Header` in `<Card.Header>`. */
function elementName(node) {
  const name = node.name
  if (!name) return null
  if (name.type === 'JSXIdentifier') return name.name
  return null
}

/** Names of the plain attributes on this element (spreads are unknowable, and skipped). */
function attributeNames(node) {
  return new Set(
    node.attributes
      .filter((a) => a.type === 'JSXAttribute' && a.name?.type === 'JSXIdentifier')
      .map((a) => a.name.name),
  )
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Report cascivo props an adopter is likely to guess wrong, naming the prop that exists',
      url: 'https://github.com/cascivo/cascivo/tree/main/packages/eslint-plugin#readme',
    },
    fixable: 'code',
    schema: [],
    messages: {
      wrongProp: '`{{component}}` has no `{{wrote}}` prop — it is `{{is}}`. {{note}}',
      stringSpaceStep:
        '`{{prop}}` takes a NUMBER, not a string: write `{{prop}}={{{value}}}`. The space scale is a numeric SpaceStep, so `{{prop}}="7"` cannot type-check into a token that does not exist.',
      foreignImport:
        '`{{wrote}}` is `{{is}}` in cascivo. Import `{{is}}` — same component, the name this system uses.',
      tupleHook:
        '`{{hook}}()` returns a TUPLE — write `const [value, setValue] = {{hook}}()`. {{note}}',
      defaultDirection: '`{{component}}` has no `direction`, so it is VERTICAL. {{note}}',
    },
  },

  create(context) {
    const source = context.sourceCode ?? context.getSourceCode?.()
    const numeric = new Set(vocabulary.numericProps)
    const byComponent = new Map()
    for (const row of vocabulary.props) {
      if (!byComponent.has(row.component)) byComponent.set(row.component, [])
      byComponent.get(row.component).push(row)
    }
    const defaultDirection = new Map(vocabulary.defaultDirection.map((row) => [row.component, row]))
    const tupleHooks = new Map(vocabulary.tupleHooks.map((row) => [row.hook, row]))

    return {
      JSXOpeningElement(node) {
        const component = elementName(node)
        if (!component) return
        const present = attributeNames(node)

        for (const row of byComponent.get(component) ?? []) {
          if (!present.has(row.wrote)) continue
          const attribute = node.attributes.find(
            (a) => a.type === 'JSXAttribute' && a.name?.name === row.wrote,
          )
          context.report({
            node: attribute ?? node,
            messageId: 'wrongProp',
            data: { component, wrote: row.wrote, is: row.is, note: row.note },
          })
        }

        // `<Flex justify="between">` with no `direction` is a centred column, not a row.
        const dir = defaultDirection.get(component)
        if (
          dir &&
          !present.has('direction') &&
          (present.has('justify') || present.has('align')) &&
          // A spread may carry `direction`; do not guess about what we cannot see.
          !node.attributes.some((a) => a.type === 'JSXSpreadAttribute')
        ) {
          context.report({
            node,
            messageId: 'defaultDirection',
            data: { component, note: dir.note },
          })
        }
      },

      JSXAttribute(node) {
        if (node.name?.type !== 'JSXIdentifier' || !numeric.has(node.name.name)) return
        const value = node.value
        if (value?.type !== 'Literal' || typeof value.value !== 'string') return
        if (!/^\d+$/.test(value.value)) return
        const prop = node.name.name
        context.report({
          node,
          messageId: 'stringSpaceStep',
          data: { prop, value: value.value },
          fix: (fixer) => fixer.replaceText(value, `{${value.value}}`),
        })
      },

      ImportDeclaration(node) {
        const from = node.source?.value
        if (from !== '@cascivo/react' && from !== '@cascivo/charts') return
        for (const spec of node.specifiers) {
          if (spec.type !== 'ImportSpecifier' || spec.imported?.type !== 'Identifier') continue
          const real = vocabulary.imports[spec.imported.name]
          if (!real) continue
          context.report({
            node: spec,
            messageId: 'foreignImport',
            data: { wrote: spec.imported.name, is: real },
            // Only safe when the local name is not aliased — `{ Dialog as D }` would need
            // every use site rewritten, which a fixer must not attempt.
            fix:
              spec.local?.name === spec.imported.name && source
                ? (fixer) => fixer.replaceText(spec, real)
                : null,
          })
        }
      },

      VariableDeclarator(node) {
        if (node.id?.type !== 'ObjectPattern') return
        const init = node.init
        if (init?.type !== 'CallExpression' || init.callee?.type !== 'Identifier') return
        const row = tupleHooks.get(init.callee.name)
        if (!row) return
        context.report({
          node: node.id,
          messageId: 'tupleHook',
          data: { hook: row.hook, note: row.note },
        })
      },
    }
  },
}

export default rule
