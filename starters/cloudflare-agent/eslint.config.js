import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import cascivo from '@cascivo/eslint-config'

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  // Registers the TypeScript parser and the .ts/.tsx `files` patterns. WITHOUT THIS ESLINT
  // LINTS NOTHING: its default `files` is **/*.{js,cjs,mjs}, so every file in this app is
  // skipped with "File ignored because no matching configuration was supplied" and the
  // `lint` script exits 0 having checked zero files.
  ...tseslint.configs.recommended,
  // NOTE the `.flat` — the plugin exports both `configs['recommended-latest']` (the legacy
  // eslintrc shape, which applies NOTHING here and reports no error) and this one.
  reactHooks.configs.flat['recommended-latest'],
  // Spread LAST — flat config is last-wins. This turns off `react-hooks/immutability`,
  // which reports cascivo's signal writes (`signal.value = next`) as errors. That rule
  // fires on the very first `signal.value = x` you write, so this is not optional wiring:
  // see https://cascivo.com/docs/using-with-strict-eslint.md
  ...cascivo,
]
