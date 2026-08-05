# Compatibility & support matrix

What cascivo runs on, which package versions go together, and the build-tooling
baseline. If an integration surprises you, start here.

---

## Frameworks

| Framework                  | Supported | Notes                                                                                   |
| -------------------------- | --------- | --------------------------------------------------------------------------------------- |
| React 18 / 19              | ✅ Yes    | Primary target. Components ship `'use client'` preserved.                                |
| Next.js App Router (RSC)   | ✅ Yes    | Import the CSS once in a Server Component (e.g. `app/layout.tsx`); components are client. Working example: [`apps/examples/react-next`](../apps/examples/react-next/). See [`USING-WITH-NEXTJS.md`](./USING-WITH-NEXTJS.md). |
| Vite + React (CSR/SPA)     | ✅ Yes    | Reference setup. See `apps/examples/react-vite`.                                         |
| Vite SSR / TanStack Start  | ✅ Yes¹   | Requires `ssr.noExternal: [/^@cascivo\//]` (or the `cascivoSsr()` plugin). Working example: [`apps/examples/react-vite-ssr`](../apps/examples/react-vite-ssr/). See [`USING-WITH-VITE-SSR.md`](./USING-WITH-VITE-SSR.md). |
| Preact 10 (`preact/compat`) | ✅ **CSR only** | Verified on Vite CSR (`@preact/preset-vite`) — components, signals, overlays and charts all behave as on React, at roughly half the JS. **Not verified under SSR/prerender**, and known to fail under Astro's compat aliasing. See [`USING-WITH-PREACT.md`](./USING-WITH-PREACT.md). |
| Astro (React islands)      | ⚠️ **Partial** | `client:only` ✅. Under `client:load` / `client:visible` Astro drops the per-component CSS, so islands render unstyled — import the aggregate `@cascivo/react/styles.css` in a shared layout as a workaround (+308 KB). See [`USING-WITH-ASTRO.md`](./USING-WITH-ASTRO.md). |
| Vue / Svelte / Angular     | ⚠️ Tokens/themes only | `@cascivo/tokens` + `@cascivo/themes` are framework-agnostic CSS; the components are React. |

¹ The published `@cascivo/react` bundle ships per-component CSS as static
side-effect imports. Bundlers resolve these; a bare server-side ESM loader
(Node native, workerd) does not and throws `Unknown file extension ".css"`.
Marking `@cascivo/*` `ssr.noExternal` makes Vite process those imports during
SSR. The [Vite SSR guide](./USING-WITH-VITE-SSR.md) has the full recipe (one
config line + the aggregate `styles.css`). Next.js RSC never hits this because
its recipe imports the aggregate stylesheet in a Server Component.

## Browsers

cascivo targets the **last 2 versions of Chrome, Firefox, and Safari**. It relies
on modern CSS that is broadly shipped as of 2025:

| Feature                       | Min support              | Used for                                  |
| ----------------------------- | ------------------------ | ----------------------------------------- |
| `@layer`                      | Chrome 99, FF 97, Saf 15.4 | predictable cascade ordering              |
| `@container`                  | Chrome 105, FF 110, Saf 16 | slot-aware responsive components          |
| `:has()`                      | Chrome 105, FF 121, Saf 15.4 | stateful styling without JS               |
| `oklch()`                     | Chrome 111, FF 113, Saf 15.4 | the entire color system                   |
| Popover API / `@starting-style` | Chrome 114+, FF 125+, Saf 17.4+ | overlays (Sheet, Drawer, Popover)     |
| CSS `@function` / `if()`      | Chrome 133+ only         | **progressive enhancement only** (below)  |

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
  [`USING-WITH-TAILWIND.md`](./USING-WITH-TAILWIND.md) for the `@layer` order, the
  `.dark` ↔ `[data-theme]` dark-mode bridge, and the opt-in
  `@cascivo/themes/tailwind.css` that maps cascivo tokens onto Tailwind's
  `--color-*` utilities.
- **The `@import` order is spec-clean:** tokens no longer emit an `@import` after
  a `@layer`, so there's no `@import must precede all other statements` warning.

---

## Package compatibility

All `@cascivo/*` packages are 0.x and released together. Install matching minors.

This table is **generated from the packages themselves** by `pnpm regen` and verified by
CI's drift check — it cannot go stale. (It once sat thirteen minors behind, claiming
`@cascivo/react` 0.2.x while npm served 0.13.0, which is why it is no longer hand-written.)

<!-- BEGIN GENERATED: package-compatibility (scripts/compat/generate.ts) -->

| Package | Version | Peer requirements |
| ------- | ------- | ----------------- |
| `@cascivo/core` | 0.16.x | `@preact/signals-react >=3.0.0`, `@types/react >=18.0.0` _(optional)_, `react >=18.0.0`, `react-dom >=18.0.0` |
| `@cascivo/tokens` | 0.5.x | none (CSS only) |
| `@cascivo/themes` | 0.4.x | `@cascivo/tokens` (direct dep) — themes `@import` it |
| `@cascivo/react` | 0.16.x | `@preact/signals-react >=3.0.0`, `@types/react >=18.0.0` _(optional)_, `react >=18.0.0`, `react-dom >=18.0.0` |
| `@cascivo/icons` | 0.3.x | `@types/react >=18.0.0` _(optional)_, `react >=18.0.0` |
| `@cascivo/charts` | 0.16.x | `@preact/signals-react >=3.0.0`, `@types/react >=18.0.0` _(optional)_, `react >=18.0.0`, `react-dom >=18.0.0` |
| `@cascivo/i18n` | 0.16.x | `@preact/signals-react >=3.0.0` |
| `@cascivo/storage` | 0.16.x | `@preact/signals-react >=3.0.0` |
| `@cascivo/mcp` | 0.6.x | (server; run via `npx`) |

<!-- END GENERATED: package-compatibility -->

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
import '@cascivo/themes/light-dark.css' // tokens (once) + base typography + light & dark
import './my-theme.css' // optional brand overrides — always LAST
```

`@cascivo/react/styles.css` defines component structure only — it references
`var(--cascivo-*)` values that don't exist until a theme + tokens are loaded, so
importing it alone yields correctly-structured but uncolored components. See
[`THEMING.md`](./THEMING.md).
