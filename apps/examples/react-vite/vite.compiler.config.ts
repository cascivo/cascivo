/**
 * The React Compiler leg: the same app and tests, with this app's source compiled by
 * babel-plugin-react-compiler 1.x exactly as an adopter who turns the compiler on would have it.
 *
 * `panicThreshold: 'all_errors'` makes the compiler fail the run instead of silently skipping a
 * component it cannot compile — a skipped component would pass the tests without having been
 * compiled, and prove nothing. The transform also refuses to finish if App.tsx came out without
 * the compiler runtime import, for the same reason.
 *
 * Run: pnpm --filter @cascivo/example-react-vite test:compiler (root: pnpm compiler:check).
 */
import { transformAsync } from '@babel/core'
import { defineConfig, mergeConfig } from 'vite-plus'
import base from './vite.config'

const SOURCE = /\/apps\/examples\/react-vite\/src\/.*\.tsx$/

export default mergeConfig(
  base,
  defineConfig({
    plugins: [
      {
        name: 'react-compiler',
        enforce: 'pre',
        async transform(code, id) {
          if (!SOURCE.test(id)) return null
          const result = await transformAsync(code, {
            filename: id,
            babelrc: false,
            configFile: false,
            parserOpts: { plugins: ['jsx', 'typescript'] },
            plugins: [['babel-plugin-react-compiler', { panicThreshold: 'all_errors' }]],
            sourceMaps: true,
          })
          if (!result?.code) throw new Error(`react-compiler: no output for ${id}`)
          if (id.endsWith('/App.tsx') && !result.code.includes('react/compiler-runtime')) {
            throw new Error(
              'react-compiler: App.tsx was not compiled — the leg would prove nothing',
            )
          }
          return { code: result.code, map: result.map ?? null }
        },
      },
    ],
  }),
)
