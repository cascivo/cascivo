/**
 * Shared Vite plugin: make a single-entry package's stylesheet ride along with its JS.
 *
 * `@cascivo/react` auto-loads styling through per-component CSS side-effect imports, so a
 * consumer imports nothing. Four sibling packages — `@cascivo/charts`, `@cascivo/editor`,
 * `@cascivo/flow`, `@cascivo/ai` — declared the same `sideEffects: ["**\/*.css"]`, implying
 * the same mechanism, and never imported their own emitted stylesheet. They rendered
 * unstyled with no warning until the consumer found the `./styles.css` subpath in the
 * exports map. A 2026-07-28 adopter hit it on charts and called out the inconsistency
 * directly: "two packages in one family with opposite CSS contracts is the kind of thing
 * people lose an afternoon to" (report C11).
 *
 * That inconsistency is why this lives in one file rather than four copies. Each package's
 * vite config calls `cssImportEdge('<cssFileName>.css')` and gets the identical contract.
 *
 * The SSR twin is not optional. A bare `.css` side-effect import makes the bundle
 * unloadable by a plain Node ESM loader (`ERR_UNKNOWN_FILE_EXTENSION`) — the default state
 * of an externalized dependency in every Vite SSR framework. So the plugin also emits a
 * CSS-free `dist/node/index.js`, selected by the `node` export condition, byte-identical
 * minus the CSS edge. This mirrors `packages/react/vite.config.ts`. Fixing the styling bug
 * without the twin would just trade it for an SSR blocker.
 *
 * Enforced by `scripts/checks/css-contract.test.ts` (`pnpm css-contract:check`).
 *
 * Only correct for a **single-file** lib build: the twin is emitted as a flat copy of the
 * entry chunk, so a package that code-splits would need `@cascivo/react`'s fuller
 * whole-graph treatment instead.
 */

/** Matches a directive prologue line (`'use client';`) — these must stay at the top. */
const DIRECTIVE = /^\s*(['"])use [\w-]+\1;?\s*$/

interface Chunk {
  type: string
  code?: string
  isEntry?: boolean
}

export function cssImportEdge(cssFileName: string) {
  return {
    name: 'cascivo:css-import-edge',
    generateBundle(
      this: { emitFile(file: { type: 'asset'; fileName: string; source: string }): void },
      _options: unknown,
      bundle: Record<string, Chunk>,
    ) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry || typeof chunk.code !== 'string') continue

        // The CSS-free twin, captured before the import is injected.
        this.emitFile({ type: 'asset', fileName: `node/${fileName}`, source: chunk.code })

        const lines = chunk.code.split('\n')
        let i = 0
        while (i < lines.length && (lines[i]!.trim() === '' || DIRECTIVE.test(lines[i]!))) i++
        lines.splice(i, 0, `import './${cssFileName}';`)
        chunk.code = lines.join('\n')
      }
    },
  }
}
