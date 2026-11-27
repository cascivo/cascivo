<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-htmx-solid.md
  registry v1.12.0 · generated 2026-11-27
-->

# Using cascivo with htmx and Solid (no React)

The no-React stack is four layers; take only what you need. Reasoning and a measured React comparison:
[COMPARE-REACT-VS-HTMX-SOLID.md](/docs/compare-react-vs-htmx-solid.md).

| Layer     | Package                                 | What it gives you                                                                                                                                                                                                                                                                                                                         |
| --------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markup    | `@cascivo/css`                          | Unhashed `cv-*` classes + `data-*` attributes, the typed `classes` map, `cascivo.css`. Guide: [CONTRACT.md](/docs/contract.md).                                                                                                                                                                                                           |
| Behaviour | `@cascivo/elements`                     | Light-DOM custom elements (`cv-menu`, `cv-tabs`, `cv-form`, `cv-combobox`, `cv-date-picker`, `cv-dialog`, `cv-toaster`, `cv-data-table`, `cv-drawer`, `cv-command-menu`, `cv-theme`, `cv-tooltip`, `cv-multi-select`, `cv-tags-input`) plus the `/htmx` glue. One import per element; `custom-elements.json` lists attributes and events. |
| Islands   | `@cascivo/solid`                        | `defineIsland` (htmx-safe mount/dispose), typed `cv-*` wrappers, `createForm`/`createI18n`/`createTheme`, `cv-*` JSX typings (`/elements`), Vite preset (`/vite`), test helper (`/testing`).                                                                                                                                              |
| Server    | `cascivo-server` / `cascivo-web` (Rust) | Fragments, forms, sessions, CSRF, SSE. Guide: [USING-CASCIVO-SERVER.md](/docs/using-cascivo-server.md).                                                                                                                                                                                                                                   |

## Install

These are npm packages, not registry items: `npx cascivo add` does not apply.

```sh
pnpm add @cascivo/css @cascivo/elements   # markup + behaviour
pnpm add @cascivo/solid solid-js          # only if you write islands
```

`@cascivo/solid` peers: `solid-js >= 1.9`, optional `vite` and `vite-plugin-solid`.

## Wire up

Load `@cascivo/css`'s `cascivo.css` and the elements' `elements.css`, call each element module's idempotent
`define()` (one module per element, no barrel), and load the `/htmx` module for the htmx glue. See the
package READMEs and `apps/examples/track-lite-htmx/src/elements.ts`.

Budgets (enforced by `pnpm elements:check`, `pnpm audit:bundle` and `packages/solid` tests): each element
≤ 3 KB gzip, a page of elements ≤ 15 KB, each Solid island ≤ 10 KB, `@cascivo/solid` itself ≤ its
`audit:bundle` ceiling.
