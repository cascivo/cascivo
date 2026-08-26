// Ambient module declarations for the docs site.
//
// Component types are NOT declared here. They live in `src/shims/`, which
// `tsconfig.json` maps every `@cascivo/components/*` specifier to and which
// `scripts/shims/generate.ts` regenerates from the built declarations.
//
// This file previously also declared Button, Input, Card, Badge and Modal by hand, each
// ending in `[key: string]: unknown`. Those blocks were dead — a `paths` entry beats an
// ambient declaration, verified by poisoning one and observing no change — but they were a
// trap: a future `paths` edit would have silently fallen back to five stale, uncheckable
// prop bags.

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// Plain side-effect CSS imports (e.g. dynamic `import('./themes-extra.css')`).
declare module '*.css' {
  const css: string
  export default css
}
