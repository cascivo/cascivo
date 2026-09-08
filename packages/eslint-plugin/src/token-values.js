/**
 * `cascivo/token-values` — a `--cascivo-*` name that does not exist, reported where it is
 * written.
 *
 * ## Why a lint rule, when there is already a token type and a token catalog
 *
 * There were three token surfaces before this rule and none of them could reject anything.
 * `CascivoToken` was a generated union with no internal call site — an autocomplete aid an
 * adopter had to opt into. `tokens.catalog.json` was data for the docs page. `cascivo audit`
 * knew the token values but only ever looked for *literals that should be tokens*, never for
 * *tokens that do not exist*.
 *
 * That left the single most expensive class of styling mistake completely unreported.
 * **CSS silently drops an unknown custom property.** `style={{ '--cascivo-color-acent':
 * 'red' }}` does not warn, does not fail the build, does not appear in DevTools, and does
 * not throw — it has no effect, and the search for the cause starts in the component. Our
 * own token docs say this in as many words about the `--cascivo-text-*` / `--cascivo-font-*`
 * split, which is precisely the pair an agent gets wrong because it types from memory.
 *
 * TypeScript cannot cover this on its own: React's `CSSProperties` has no index signature
 * for `--*` keys, so every custom property in a `style` prop reaches the DOM through a cast
 * the adopter wrote, and a cast launders a typo by definition. `CascivoTokenStyle` +
 * `satisfies` closes it for people who adopt the pattern; this rule closes it for everyone
 * else, in the editor, before the build.
 *
 * ## Why `warn`, not `error`
 *
 * Same reasoning as `prop-vocabulary`, and it has not changed: a rule that fails somebody's
 * build gets the whole config deleted, and that takes `react-hooks/immutability` with it.
 * `cascivo audit --ai` reports the same finding at **error** level, because there it is an
 * explicit gate somebody chose to run rather than something that appeared in their editor.
 *
 * ## Why the data is generated
 *
 * `token-catalog.json` comes from `scripts/style-contract/generate.ts`, which reads the same
 * catalog the docs site and the CLI audit read. A token renamed in CSS updates this rule on
 * the next `pnpm regen`; a hand-maintained list would eventually report a name that is
 * correct, which is worse than reporting nothing.
 *
 * ## Why this rule does only one thing
 *
 * It does not also report "`#3b82f6` should be `var(--cascivo-blue-500)`". That is
 * `cascivo audit --ai`'s `hardcoded-value`, which scopes by CSS property and reads CSS
 * files — neither of which a lint rule looking at a custom-property key can do. Carrying a
 * second, weaker copy here bought overlap and a false-positive surface, not coverage.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
/**
 * Names are stored without the shared `--cascivo-` prefix — 339 copies of a constant is most
 * of this package's 8 KB bundle budget. Restored here, once.
 *
 * @type {{ tokens: string[] }}
 */
const catalog = require('./token-catalog.json')

const PREFIX = '--cascivo-'
const TOKENS = new Set(catalog.tokens.map((name) => PREFIX + name))

/** Levenshtein distance, capped — only used to pick a suggestion, never in a hot path. */
function distance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
    }
  }
  return rows[a.length][b.length]
}

/**
 * Tokens keyed by their segments in sorted order, so a name written with the words in the
 * wrong order finds its token.
 *
 * This is not a hypothetical shape. `docs/TOKENS.md` documents `--cascivo-text-color` vs
 * `--cascivo-color-text` as a standing trap, and word-order swaps are exactly what an agent
 * produces when it types a token from memory — but they are four or five edits apart, so
 * plain edit distance never finds them.
 */
const BY_SORTED_SEGMENTS = new Map()
for (const name of catalog.tokens) {
  const key = name.split('-').sort().join('-')
  if (!BY_SORTED_SEGMENTS.has(key)) BY_SORTED_SEGMENTS.set(key, PREFIX + name)
}

/**
 * The shipped token closest to what was written, or null when nothing is close enough.
 *
 * The threshold scales with name length so `--cascivo-color-acent` finds its token while a
 * genuinely bespoke `--cascivo-my-app-thing` is left alone: guessing at a name the adopter
 * invented on purpose is noise, and noise is how a rule gets switched off.
 */
function nearest(name) {
  const reordered = BY_SORTED_SEGMENTS.get(name.replace(PREFIX, '').split('-').sort().join('-'))
  if (reordered) return reordered

  const budget = Math.min(4, Math.max(2, Math.floor(name.length / 8)))
  let best = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const token of TOKENS) {
    const d = distance(name, token)
    if (d < bestDistance) {
      bestDistance = d
      best = token
    }
  }
  return bestDistance <= budget ? best : null
}

/** Every `--cascivo-*` name referenced by a `var()` inside a string value. */
function varReferences(value) {
  return [...value.matchAll(/var\(\s*(--cascivo-[a-z0-9-]+)/gi)].map((m) => m[1])
}

/** The object literal a `style={…}` attribute carries, looking through a cast. */
function styleObject(attribute) {
  if (attribute.value?.type !== 'JSXExpressionContainer') return null
  let expression = attribute.value.expression
  // `style={{ … } as CSSProperties}` — the cast every adopter writes, because
  // `CSSProperties` has no index signature for custom properties.
  while (expression?.type === 'TSAsExpression' || expression?.type === 'TSSatisfiesExpression') {
    expression = expression.expression
  }
  return expression?.type === 'ObjectExpression' ? expression : null
}

/** The literal text of a property key, whether written quoted or computed-with-a-string. */
function keyName(property) {
  const key = property.key
  if (!key) return null
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value
  if (property.computed && key.type === 'Literal' && typeof key.value === 'string') return key.value
  return null
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Report a --cascivo-* custom property that does not exist',
      url: 'https://github.com/cascivo/cascivo/tree/main/packages/eslint-plugin#readme',
    },
    schema: [],
    messages: {
      unknownToken:
        '`{{wrote}}` is not a cascivo token — CSS drops an unknown custom property silently, so this has no effect. Did you mean `{{suggestion}}`?',
      unknownTokenNoGuess:
        '`{{wrote}}` is not a cascivo token — CSS drops an unknown custom property silently, so this has no effect. The shipped names are in `@cascivo/tokens/tokens.json`.',
    },
  },

  create(context) {
    /** @param {import('estree').Node} node @param {string} name */
    function checkTokenName(node, name) {
      if (TOKENS.has(name)) return
      const suggestion = nearest(name)
      context.report({
        node,
        messageId: suggestion ? 'unknownToken' : 'unknownTokenNoGuess',
        data: { wrote: name, suggestion: suggestion ?? '' },
      })
    }

    return {
      JSXAttribute(node) {
        if (node.name?.type !== 'JSXIdentifier' || node.name.name !== 'style') return
        const object = styleObject(node)
        if (!object) return

        for (const property of object.properties) {
          if (property.type !== 'Property') continue

          const key = keyName(property)
          if (key?.startsWith('--cascivo-')) checkTokenName(property.key, key)

          const value = property.value
          if (value?.type !== 'Literal' || typeof value.value !== 'string') continue

          for (const referenced of varReferences(value.value)) {
            checkTokenName(value, referenced)
          }
        }
      },
    }
  },
}

export default rule
