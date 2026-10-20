---
'cascivo': patch
---

`cascivo create --framework astro` wires `@cascivo/astro` into `astro.config.mjs`. The
integration injects the layer order and the chosen theme ahead of any other CSS on every page,
and inlines a no-flash theme script that survives `<ClientRouter />` swaps. The scaffold passes
its theme to both the stylesheet and the script, so a `midnight` app is not repainted light or
dark. `src/layouts/Layout.astro` no longer imports the theme itself.
