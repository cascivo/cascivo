<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/compatibility.md
  registry v0.9.0 · generated 2026-07-22
-->

# Compatibility & support matrix

What cascivo runs on, which package versions go together, and the build-tooling
baseline. If an integration surprises you, start here.

---

## Frameworks

| Framework                   | Supported             | Notes                                                                                                                                                                                                                                                                  |
| --------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React 18 / 19               | ✅ Yes                | Primary target. Components ship `'use client'` preserved.                                                                                                                                                                                                              |
| Next.js App Router (RSC)    | ✅ Yes                | Import the CSS once in a Server Component (e.g. `app/layout.tsx`); components are client.                                                                                                                                                                              |
| Vite + React (CSR/SPA)      | ✅ Yes                | Reference setup. See `apps/examples/react-vite`.                                                                                                                                                                                                                       |
| Vite SSR / TanStack Start   | ✅ Yes¹               | Requires `ssr.noExternal: [/^@cascivo\//]` (or the `cascivoSsr()` plugin). Working example: [`apps/examples/react-vite-ssr`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-vite-ssr). See [`USING-WITH-VITE-SSR.md`](/docs/using-with-vite-ssr.md). |
| Preact 10 (`preact/compat`) | ✅ Yes                | Verified in production. See [`USING-WITH-PREACT.md`](/docs/using-with-preact.md).                                                                                                                                                                                      |
| Astro (React islands)       | ✅ Yes                | Works as a React island; import CSS in a shared layout.                                                                                                                                                                                                                |
| Vue / Svelte / Angular      | ⚠️ Tokens/themes only | `@cascivo/tokens` + `@cascivo/themes` are framework-agnostic CSS; the components are React.                                                                                                                                                                            |

¹ The published `@cascivo/react` bundle ships per-component CSS as static
side-effect imports. Bundlers resolve these; a bare server-side ESM loader
(Node native, workerd) does not and throws `Unknown file extension ".css"`.
Marking `@cascivo/*` `ssr.noExternal` makes Vite process those imports during
SSR. The [Vite SSR guide](/docs/using-with-vite-ssr.md) has the full recipe (one
config line + the aggregate `styles.css`). Next.js RSC never hits this because
its recipe imports the aggregate stylesheet in a Server Component.

## Browsers

cascivo targets the **last 2 versions of Chrome, Firefox, and Safari**. It relies
on modern CSS that is broadly shipped as of 2025:

| Feature                         | Min support                     | Used for                                 |
| ------------------------------- | ------------------------------- | ---------------------------------------- |
| `@layer`                        | Chrome 99, FF 97, Saf 15.4      | predictable cascade ordering             |
| `@container`                    | Chrome 105, FF 110, Saf 16      | slot-aware responsive components         |
| `:has()`                        | Chrome 105, FF 121, Saf 15.4    | stateful styling without JS              |
| `oklch()`                       | Chrome 111, FF 113, Saf 15.4    | the entire color system                  |
| Popover API / `@starting-style` | Chrome 114+, FF 125+, Saf 17.4+ | overlays (Sheet, Drawer, Popover)        |
| CSS `@function` / `if()`        | Chrome 133+ only                | **progressive enhancement only** (below) |

### CSS `@function` is opt-in

`--cascivo-step` / `--cascivo-scale` live in `@cascivo/tokens/functions.css` and
are **not** auto-imported, because current CSS minifiers (lightningcss, used by
Tailwind v4) cannot parse `@function` and silently drop the rule. Every call site
in cascivo ships a static fallback for the same property, so omitting functions is
always visually correct. Opt in only if your pipeline supports `@function`:

```ts
import '@cascivo/tokens/functions.css' // Chrome 133+ progressive enhancement
```

## Build tooling

- **Bundlers:** Vite/Rolldown, webpack, esbuild, and any bundler that honors the
  package `exports` map. Always import the `@cascivo/react/styles.css` specifier —
  never the underlying `dist/cascivo.css` path (strict `exports` blocks it).
- **CSS minifiers:** cssnano and esbuild handle the shipped CSS as-is.
  lightningcss (Tailwind v4) works too **as long as you don't opt into**
  `@cascivo/tokens/functions.css` (see above).
- **Using Tailwind v4 alongside cascivo?** See
  [`USING-WITH-TAILWIND.md`](/docs/using-with-tailwind.md) for the `@layer` order, the
  `.dark` ↔ `[data-theme]` dark-mode bridge, and the opt-in
  `@cascivo/themes/tailwind.css` that maps cascivo tokens onto Tailwind's
  `--color-*` utilities.
- **The `@import` order is spec-clean:** tokens no longer emit an `@import` after
  a `@layer`, so there's no `@import must precede all other statements` warning.

---

## Package compatibility

All `@cascivo/*` packages are 0.x and released together. Install matching minors;
the set verified by the integration migrations is:

| Package            | Version | Peer requirements                                           |
| ------------------ | ------- | ----------------------------------------------------------- |
| `@cascivo/core`    | 0.1.x   | `react >=18`, `react-dom >=18`, `@preact/signals-react >=3` |
| `@cascivo/tokens`  | 0.2.x   | none (CSS only)                                             |
| `@cascivo/themes`  | 0.2.x   | `@cascivo/tokens` (direct dep) — themes `@import` it        |
| `@cascivo/react`   | 0.2.x   | `react >=18`, `react-dom >=18`, `@preact/signals-react >=3` |
| `@cascivo/icons`   | 0.1.x   | `react >=18`                                                |
| `@cascivo/charts`  | 0.1.x   | `react >=18`, `@cascivo/core`                               |
| `@cascivo/i18n`    | 0.1.x   | `@preact/signals-react`                                     |
| `@cascivo/storage` | 0.1.x   | `@preact/signals-react`                                     |
| `@cascivo/mcp`     | 0.1.x   | (server; run via `npx`)                                     |

> **React 19 requires `@preact/signals-react` 3.x.** React 19 removed the internal
> that signals-react 2.x imports, so a 2.x runtime fails to load under React 19
> (`SyntaxError: … does not provide an export named '__SECRET_INTERNALS…'`). The
> peer range (`>=3`) enforces this; signals-react 3.x still supports React 16.14+/17/18,
> so the floor costs React-18 users nothing. If a lockfile from an earlier install
> pins 2.x, run `cascivo doctor` — it flags the mismatch with the upgrade command.

### Minimal install

```sh
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

`@cascivo/tokens` arrives transitively through `@cascivo/themes` — it is a direct
dependency of themes (the theme CSS `@import`s it), so it installs automatically on
every package manager, with or without `auto-install-peers`.

### Required CSS import order

```ts
import '@cascivo/react/styles.css' // components (no tokens/colors on their own)
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark
import './my-theme.css' // optional brand overrides — always LAST
```

`@cascivo/react/styles.css` defines component structure only — it references
`var(--cascivo-*)` values that don't exist until a theme + tokens are loaded, so
importing it alone yields correctly-structured but uncolored components. See
[`THEMING.md`](/docs/theming.md).
