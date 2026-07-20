The documentation site for cascivo — component API references, live interactive examples, accessibility tables, and theming guides. Every page is **generated from the `component.meta.ts` manifests**, so the docs can never drift from the components. Built with Vite + Preact (signals are natively reactive there) and deployed to [cascivo.com](https://cascivo.com).

## Develop

```sh
pnpm dev:docs       # from the repo root
# or
pnpm exec vp run @cascivo/docs#dev
```

Content is sourced from `registry.json` and the manifests — to change what the docs show, edit the component, not the docs. The site is rebuilt mobile-first (fluid type, off-canvas nav, container queries, zero overflow at 320–414px).
