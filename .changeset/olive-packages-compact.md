---
'@cascivo/charts': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
'@cascivo/core': patch
'@cascivo/i18n': patch
'@cascivo/icons': patch
'@cascivo/ai': patch
'@cascivo/storage': patch
---

The remaining browser packages get the same output minification `@cascivo/react` just did —
their chunks shipped mangled but with every newline and indent intact.

```
charts   39.8 → 32.5 KB gzip
icons    39.5 → 38.2
editor   12.0 → 10.4
flow      9.0 →  7.7
core      7.6 →  6.7
i18n      6.2 →  5.8
ai        1.6 →  1.3
storage   0.5 →  0.4
```

With `@cascivo/react`'s 15.6 KB that is 28.8 KB gzip off the published surface, from build
configuration alone.

The setting lives in one place now (`scripts/build/minify.ts`) rather than as a boolean in
each config, because two things about it are easy to get wrong: `build.minify: true` is
already the default and does not reach codegen, and `vp pack` ignores `rollupOptions`
entirely. The `vp pack` packages — `cascivo`, `@cascivo/mcp`, `@cascivo/registry`,
`@cascivo/vite-plugin` — are left un-minified on purpose: all four run in Node, none is
browser payload, and readable identifiers in a CLI stack trace beat the install bytes.

**Fixed on the way, and the more important half of this change:** removing the whitespace
broke three separate directive scanners that all assumed `'use client'` would be alone on a
line. The single-entry CSS plugin then spliced `import './charts.css';` _ahead_ of the
directive in charts, editor, flow and ai — and a `'use client'` that is not a module's first
statement is not a directive, so those four silently stopped being client modules. The RSC
guard that exists to catch exactly this had the same line-based assumption, concluded nothing
in the library was a client module, and passed with nothing left to check.

All three now scan the code as a string (`scripts/lib/directives.ts`, unit-tested), and
`rsc-boundary` gained the counter-assertion that would have caught it: that it still
recognises client modules at all.
