---
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/ai': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
---

Server-rendered islands now render styled under a plain Astro config. Astro externalizes npm
dependencies in its server build, so it never walked the CSS imports of these packages; they now
carry the `astro-component` keyword, which makes Astro inline them. `vite.resolve.noExternal` is
no longer required.
