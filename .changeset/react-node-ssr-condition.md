---
'@cascivo/react': minor
---

SSR now works with zero Vite config — `@cascivo/react` ships a CSS-free server build.

The published bundle shipped per-component CSS as static side-effect imports
(`import './button.css'`), which a bare server-side ESM loader (Node's native loader,
workerd) cannot resolve — so every externalized Vite SSR framework (TanStack Start,
Remix, vite-ssr) threw `Unknown file extension ".css"` on the first request unless the
adopter added `ssr: { noExternal: [/^@cascivo\//] }`. Three adopter reports hit this.

The build now also emits a CSS-free twin under `dist/node/`, selected by the `node`
export condition. A bare Node loader imports it cleanly; client bundles still reach the
CSS-bearing build via `import`/`browser`, so per-component CSS tree-shaking is unchanged.
Import `@cascivo/react/styles.css` once for the server-rendered first paint (the server
build carries no per-component CSS by design). `cascivoSsr()` / `ssr.noExternal` are no
longer required (they remain harmless, and stay documented for pinned versions < 0.10).
