---
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/ai': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
---

Fix SSR'd Astro islands rendering unstyled, and the same latent bug in every Vite-based SSR
framework.

Export conditions match in declaration order, and these packages listed their CSS-free
`node` twin ahead of `import`. A Vite-based SSR framework (Astro, Nuxt, SvelteKit) resolves
with `node` active and `react-server` inactive, so its **server** module graph got the
CSS-free build — and a framework that collects a page's CSS by walking that graph emits
none. That is why Astro's `client:load` / `client:visible` islands rendered with hashed
class names and no matching rules for two majors, while `client:only` (client graph only)
worked, and why it read as an upstream Astro bug.

A `module` condition now sits ahead of `node`. Bundlers match it and get the CSS-bearing
build; Node's ESM resolver does not implement `module`, so bare Node still falls through to
the twin and the `ERR_UNKNOWN_FILE_EXTENSION` guarantee that twin exists for is unchanged.

Astro now works with a vanilla `astro.config.mjs` on every client directive — no aggregate
`styles.css`, no `ssr.noExternal` (which never helped here). `apps/examples/astro-islands`
asserts this per-directive in CI and now fails on regression; `pnpm css-contract:check`
enforces the ordering across every package shipping a `node` twin.
