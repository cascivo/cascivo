---
'@cascivo/react': minor
---

Fix: server-rendered components lost their CSS under RSC, forcing every SSR app onto the
328 KB aggregate stylesheet.

`@cascivo/react` ships two copies of the module graph: `dist/` with a `.css` side-effect
import beside each component, and a CSS-free `dist/node/` twin behind the `node` export
condition so a bare Node/workerd ESM loader can import the package at all. React Server
Components resolve `react-server` and then `node` — and there was no `react-server` entry,
so RSC got the CSS-free build. Components carrying `'use client'` were fine (the client
bundler re-resolves them under browser conditions), but every component **without** the
directive — exactly the `clientJs: 'none'` ones — rendered on the server from a build with
no CSS edges, and its stylesheet was never collected.

The symptom was size, not breakage, because the docs worked around it by telling every SSR
adopter to import the full-catalog aggregate. Measured on the repo's own examples:

| Example                           | CSS before | CSS after |
| --------------------------------- | ---------- | --------- |
| `react-next` (Next 16 App Router) | 384 KB     | 34 KB     |
| `react-vite-ssr` (Vite SSR)       | 357 KB     | 29 KB     |

Adding a `react-server` condition ahead of `node`, pointing at the CSS-bearing build, makes
per-component CSS tree-shaking work under SSR and RSC exactly as it does in an SPA. RSC
always runs through a bundler, so the `.css` imports are processed; bare-Node and workerd
SSR still resolve `node` and still get the CSS-free twin.

**If you followed the old SSR recipe, delete `import '@cascivo/react/styles.css'` from your
root layout/route and keep only your theme import.** The aggregate remains correct and
supported for setups where no bundler walks the module graph (CDN `<link>`, Astro islands).

Also in this release: `Spinner`, `Breadcrumb`, `Header`, `QrCode` and `Switcher` now declare
`clientJs: 'enhancement'` — their markup is fully server-rendered and the client boundary
only re-resolves the default label on a locale change.
