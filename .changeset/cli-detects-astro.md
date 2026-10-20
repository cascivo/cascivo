---
'cascivo': patch
---

`cascivo init` prints Astro-shaped next steps when an `astro.config.*` exists
(`npx astro add @cascivo/astro`, compose compound components in a `.tsx` island, hydrate only the
interactive islands). `cascivo doctor` warns on an Astro project that has neither the
`@cascivo/astro` integration, `vite.resolve.noExternal`, nor an installed `@cascivo/react` that
declares `astro-component`. It no longer accepts `ssr.noExternal` there, which Astro ignores.
