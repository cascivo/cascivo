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

This is **necessary but not sufficient** for Astro. Vite also externalizes `node_modules`
packages in its server build, so an adopter installing from npm additionally needs
`vite.resolve.noExternal: [/^@cascivo\//]` in `astro.config.mjs` (note `resolve.`, not
`ssr.` — Astro's prerender environment does not read `ssr.*`). With both in place every
client directive server-renders and styles correctly, verified against packed tarballs
outside the monorepo. `cascivo create --framework astro` emits that config wired up.

`pnpm css-contract:check` enforces the condition ordering across every package shipping a
`node` twin, and `apps/examples/astro-islands` now fails on regression rather than
reporting and exiting 0 — though note that fixture uses a `workspace:*` link and so covers
only the export-condition half.
