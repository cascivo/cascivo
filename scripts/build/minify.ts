/**
 * Shared rolldown output minification for every published package.
 *
 * The emitted chunks used to be mangled but not compacted: every newline, every level of
 * indentation and rolldown's own `//#region` markers shipped to npm. `@cascivo/react`'s
 * `data-table.js` was 38.6 KB of which 12 KB was whitespace. Gzip hides most of that, not
 * all of it — the react tree measured 102.4 KB gzip and is 86.8 KB with the whitespace
 * gone, a 15% cut for every consumer, from no source change at all.
 *
 * Two things make this easy to miss, which is why it lives in one named constant rather
 * than a boolean sprinkled across thirteen configs:
 *
 *  1. `build.minify: true` is already the default and does NOT reach codegen. Setting it
 *     produces a byte-identical build, so the box reads as ticked when it is not. The knob
 *     is here, on the rolldown *output*.
 *  2. It only applies to packages built with `vp build`. `vp pack` ignores `rollupOptions`
 *     entirely — the same warning the subpath-external comments in these configs carry — so
 *     the packages on that path (cascivo, mcp, registry, vite-plugin) take `vp pack
 *     --minify` in their build script instead. Keep the two in step: a package that moves
 *     between `vp build` and `vp pack` silently loses this otherwise.
 *
 * What it gives up is the `@__PURE__` annotations, which oxc cannot place without
 * whitespace. Measured before enabling, on the react tree: of 1093 annotations, 1088 sat
 * inside function bodies (`jsx(...)` calls), where a purity annotation buys a downstream
 * bundler nothing, and the 5 at module scope were `new Map()`/`new Set()` caches that every
 * consumer of those files uses anyway.
 *
 * `'use client'` survives — both the per-chunk directive `preserveModules` keeps and the
 * `banner` the single-entry client packages prepend. `scripts/checks/rsc-boundary.test.ts`
 * is the guard.
 */
export const MINIFY = {
  mangle: true,
  compress: true,
  codegen: { removeWhitespace: true },
} as const
