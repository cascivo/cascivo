import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import cascivo, { cascivoPropVocabulary, cascivoSignals, cascivoVendoredSource } from './index.js'

describe('@cascivo/eslint-config', () => {
  it('turns off react-hooks/immutability', () => {
    // The rule that makes `signal.value = next` — the idiom AI-RULES.md mandates — an
    // error under eslint-plugin-react-hooks@7 recommended-latest.
    assert.equal(cascivoSignals.rules['react-hooks/immutability'], 'off')
  })

  it('applies the signals fragment to all files, not a vendored subdirectory', () => {
    // A `files` glob here would reproduce the bug this package exists to fix: the old
    // recipe scoped rules to `src/components/ui/**`, which does not exist on the prebuilt
    // path and would not cover page code anyway.
    assert.equal(cascivoSignals.files, undefined)
  })

  it('scopes vendored-source rules to the output directory', () => {
    assert.deepEqual(cascivoVendoredSource().files, ['src/components/ui/**'])
    assert.deepEqual(cascivoVendoredSource('app/ui/**').files, ['app/ui/**'])
  })

  it('default export is a spreadable array containing every fragment', () => {
    assert.ok(Array.isArray(cascivo))
    assert.deepEqual(
      cascivo.map((c) => c.name),
      ['cascivo/signals', 'cascivo/prop-vocabulary', 'cascivo/vendored-source'],
    )
  })

  /*
   * The rule ships at `warn` and must stay there. A lint rule that fails somebody's build
   * over a naming opinion gets the whole config deleted — which also takes
   * `react-hooks/immutability` with it, the thing this package exists for.
   */
  it('prop-vocabulary is enabled at warn, with the plugin it needs', () => {
    assert.equal(cascivoPropVocabulary.rules['cascivo/prop-vocabulary'], 'warn')
    assert.ok(cascivoPropVocabulary.plugins?.cascivo?.rules?.['prop-vocabulary'])
  })

  it('every fragment is a plain object ESLint can consume', () => {
    for (const fragment of cascivo) {
      assert.equal(typeof fragment, 'object')
      assert.ok(typeof fragment.name === 'string' && fragment.name.startsWith('cascivo/'))
    }
  })
})
