---
'@cascivo/core': minor
'@cascivo/react': minor
'@cascivo/charts': patch
'@cascivo/flow': patch
'@cascivo/editor': patch
'@cascivo/ai': patch
---

Add `@cascivo/core/pure`, and stop stamping `'use client'` on every `@cascivo/react` chunk.

`@cascivo/react` previously applied a blanket `'use client'` banner to **every** emitted
chunk, and hardcoded it into both flat entries. All 272 chunks carried it, `badge.js`
included, and `dist/index.js` was `'use client'; export * from …` — so
`import { Badge } from '@cascivo/react'` inside a Server Component crossed a client boundary
at the barrel, no matter what the source said. The banner is now gone and the entries are
bare re-exports: 86 of 272 chunks carry the directive, and the components that need no
client JS render on the server without hydrating.

That change was attempted once and reverted, because removing the banner broke RSC
prerendering outright:

```
Attempted to call cn() from the server but cn is on the client.
```

`@cascivo/core` builds as a **single bundled chunk** whose own `'use client'` banner is
load-bearing — the bundler collapses its 23 directive-carrying modules into one file and
drops their per-module directives, so without it Next.js treats every hook and
`Portal`/`Presence` as a Server Component. The side effect is that *everything* in
`@cascivo/core` sits behind a client boundary, including helpers that need no browser at all.

**`@cascivo/core/pure`** is the fix: the same sources built without the banner, exporting
exactly the transitively-pure surface — `cn`, `composeRefs`, `mergeProps`, `Slot`,
`normalizeTone`, `normalizeProgress`, `sentimentOf`, `useId`, and their types. The subpath is
small because it was measured, not guessed: the components that need it import only a
handful of distinct symbols between them.

```tsx
import { cn, Slot, normalizeTone } from '@cascivo/core/pure'
```

**Nothing existing breaks.** `@cascivo/core` still exports every one of these, so client
components keep their single import and no API is removed. Reach for `/pure` only from a
component that must render on the server — exactly the set `clientJs: 'none'` names.
**Type-only imports never need it**: they are erased at compile time, so they create no
runtime edge, and routing a type through both specifiers makes the published `.d.ts` alias it.

`packages/core`'s banner is untouched and must stay. Only `@cascivo/react`'s was redundant,
because `preserveModules` keeps its chunks one-to-one with sources.

`@cascivo/charts`, `@cascivo/flow`, `@cascivo/editor` and `@cascivo/ai` get subpath-aware
externals (`/^@cascivo\/core($|\/)/` instead of the exact string). An exact string does not
match `@cascivo/core/pure`, which silently bundles a second copy of `cn`/`Slot` into each
package and duplicates their types in the published declarations — the same class of bug
`@cascivo/core`'s own externals comment already warned about.
