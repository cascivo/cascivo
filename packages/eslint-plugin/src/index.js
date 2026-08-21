/**
 * `@cascivo/eslint-plugin` — see `prop-vocabulary.js` for why this exists.
 *
 * Shipped as a plugin rather than folded into `@cascivo/eslint-config` because that package
 * deliberately contains no rules and no `eslint` dependency; it is pure flat-config data.
 * `@cascivo/eslint-config` depends on this one and enables the rule at `warn`, so an adopter
 * who already installed the config gets the messages without changing anything.
 */
import propVocabulary from './prop-vocabulary.js'

export default {
  meta: { name: '@cascivo/eslint-plugin', version: '0.1.0' },
  rules: { 'prop-vocabulary': propVocabulary },
}
