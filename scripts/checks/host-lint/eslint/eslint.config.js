/**
 * The adopter's config, verbatim.
 *
 * This file is the SINGLE OWNER of the flat-config snippet cascivo publishes. The
 * `<!-- host-lint:eslint-config -->` fenced block in docs/USING-WITH-STRICT-ESLINT.md and
 * the one in scripts/llms/generate.ts are generated from the marked region below, and
 * scripts/checks/host-lint/eslint/config-snippet.test.js fails if they drift.
 *
 * Why that matters: before this fixture existed, the same fact was stated in three places
 * and wrong in two. Both docs named the rule set `recommended-latest`, which resolves to
 * the LEGACY eslintrc shape — `eslint-plugin-react-hooks` exports `recommended-latest` AND
 * `flat['recommended-latest']`, and only the latter is a flat config. An adopter following
 * the doc got a config that silently did not apply the rules the doc was about.
 *
 * Do not "tidy" this file. It is a fixture of what an adopter actually writes.
 */
// host-lint:snippet-start
import { tanstackConfig } from '@tanstack/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'
import { cascivoSignals, cascivoVendoredSource } from '@cascivo/eslint-config'

export default [
  ...tanstackConfig,
  // NOTE the `.flat` — `reactHooks.configs['recommended-latest']` is the legacy
  // eslintrc shape and does nothing in a flat config.
  reactHooks.configs.flat['recommended-latest'],
  // Spread LAST — flat config is last-wins.
  cascivoSignals,
  // Pass YOUR `outputDir` from cascivo.config.ts. The no-argument default is
  // 'src/components/ui/**'; if your outputDir differs and you rely on the default,
  // every rule this fragment scopes off silently stays on.
  cascivoVendoredSource('packages/components/src/**'),
]
// host-lint:snippet-end
