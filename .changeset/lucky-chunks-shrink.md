---
'@cascivo/react': patch
---

The published chunks are actually minified now, which takes the whole library from 102.4 KB
to 86.8 KB gzip — 15% off every consumer's bundle, with no source change.

They were mangled but still carried every newline, every level of indentation and rolldown's
own `//#region` markers: `data-table.js` alone was 38.6 KB of which 12 KB was whitespace.
Gzip hides most of that, not all of it. `DataTable`, the largest component in the library,
drops from 10.8 → 9.2 KB, and its full dependency closure from 17.9 → 15.2 KB.

The knob is `rollupOptions.output.minify.codegen.removeWhitespace` on the rolldown output.
`build.minify: true` is already the default and does not reach codegen — setting it produces
a byte-identical build.

The one thing this gives up is the `@__PURE__` annotations, which oxc cannot place without
whitespace. Of the 1093 in the previous output, 1088 sat inside function bodies (`jsx(...)`
calls), where a purity annotation buys a downstream bundler nothing; the 5 at module scope
were `new Map()`/`new Set()` caches that every consumer of those files uses anyway.
