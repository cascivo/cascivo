---
'@cascivo/astro': minor
---

New package: `@cascivo/astro`, the Astro integration. `integrations: [react(), cascivo()]` in
`astro.config` sets up three things on every page. First comes the cascade-layer order, with
`vendor` at the bottom, so third-party CSS cannot beat cascivo. Then the theme stylesheet. Last,
an inline no-flash theme script that re-applies the persisted theme after each `<ClientRouter />`
swap. It also keeps `@cascivo/*` in the Vite graph (`vite.resolve.noExternal`), so
server-rendered islands keep their CSS. `npx astro add @cascivo/astro` installs it.
