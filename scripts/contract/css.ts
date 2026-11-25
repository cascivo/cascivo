/**
 * One CSS-module compile shared by the contract generator and the cascivo-html asset build, so
 * React's scoped names, `contract.json` and the Rust CSS all come from the same pattern.
 */
import { readFileSync } from 'node:fs'
import { transform } from 'lightningcss'

export interface CompiledModule {
  /** Minified CSS with `cv-<unit>-<local>` class names. */
  code: string
  /** CSS-module local class names, sorted. */
  locals: string[]
}

/** The contract class for a CSS-module local: `cv-<unit>-<local>`. */
export const contractClass = (unit: string, local: string): string => `cv-${unit}-${local}`

export function compileModule(file: string, unit: string): CompiledModule {
  const { code, exports } = transform({
    filename: file,
    code: readFileSync(file),
    minify: true,
    // Keep keyframe / grid / custom-ident names global: motion.css owns the keyframes.
    cssModules: {
      pattern: `cv-${unit}-[local]`,
      animation: false,
      grid: false,
      customIdents: false,
    },
  })
  return { code: code.toString(), locals: Object.keys(exports ?? {}).sort() }
}
