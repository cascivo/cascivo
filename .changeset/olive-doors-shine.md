---
'cascivo': minor
---

`create` gains `--framework astro`, alongside the default `react-vite`.

The Astro scaffold is shaped around what Astro is for rather than transliterating the SPA:
pages are real file routes (no client router to add later), page content is cascivo
components rendered with no client directive at all — server HTML, zero JS — and the only
island is the app shell, which needs JS for its mobile nav drawer.

It also bakes in `vite.resolve.noExternal: [/^@cascivo\//]`, which is the least
discoverable and most important line in the project: without it Vite externalizes
`@cascivo/react` in the server build, its module graph is never walked, and Astro — which
collects a page's CSS from that graph — emits none, so SSR'd islands render unstyled with
nothing warning. It must be `resolve.noExternal`, not `ssr.noExternal`, which Astro's
prerender environment does not read.

The cascade layer order ships as `src/styles/layers.css`, imported before the theme so a
`vendor` layer cannot end up outranking cascivo.
