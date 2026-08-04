# cascivo documentation

The curated index for everything under `docs/`. Start here, then follow the path
that matches what you're doing. The full, interactive docs live at
[cascivo.com](https://cascivo.com); this directory holds the adopter
guides, references, cookbooks, and specs that ship with the source.

## Where the documentation lives

Four surfaces, and each is authoritative for something different. Two hands-on
reports independently reached a working model only after reading all four, so it
is worth 30 seconds to know which to open.

| Surface | Authoritative for | Reach it |
| --- | --- | --- |
| **The shipped `.d.ts`** | **Props — always check here first.** Every prop carries its type, `@defaultValue`, the rationale, and ⚠ warnings for the mistakes previous adopters made (`Flex` defaults to `vertical`; a chart's `title` renders nothing visible; `useToast()` returns `{ toast }`, not a callable). Both reports rated it the single best artefact in the project. | Ctrl-click any import in your editor, or `node_modules/@cascivo/react/dist/index.d.ts` |
| **`llms.txt` + `/llms/<name>.md`** | Agent-facing reference: the component index with distribution channel, per-component pages (props → object types → examples → tokens → a11y), and the machine-readable catalogs (`registry.json`, `tokens.catalog.json`, `icons.catalog.json`). | <https://cascivo.com/llms.txt>, or offline via `npx @cascivo/docs` |
| **The guides (`docs/*.md`)** | Cross-cutting concerns no single component owns: install paths, SSR, routers, theming, layers, lint config, the dashboard recipe. | This directory, <https://cascivo.com/docs>, or `npx @cascivo/docs guide <name>` |
| **The docs site** | The same content, rendered, plus live examples you can interact with. | <https://cascivo.com> |

**If two disagree, the `.d.ts` wins** — it is generated from the same source the
components compile from, and the parity guards in `scripts/checks/` fail the build
when a manifest and its interface diverge.

The `@cascivo/docs` package ships two directories that look alike:
`llms/<name>.md` is the full per-component reference, and `context/<name>.md` is
the condensed intent summary (when to use, when not to, related components) meant
for pasting into an agent's context window.

## Start here

| Guide | What it covers |
| ----- | -------------- |
| [GETTING-STARTED.md](GETTING-STARTED.md) | Zero to a rendered button — both the copy-paste CLI path and the prebuilt `@cascivo/react` path. |
| [ENTERPRISE-READINESS.md](ENTERPRISE-READINESS.md) | Common enterprise frictions (signal↔state, layout, theming, signal lifecycles, typed tokens, forms) mapped to the shipped primitive that solves each. |
| [HEADLESS.md](HEADLESS.md) | The `@cascivo/core` behavior + state primitives, and the "React hook → cascivo primitive" mapping (useState/useContext/useEffect and their replacements). |
| [COMPATIBILITY.md](COMPATIBILITY.md) | Supported React versions, browsers, frameworks, and the support matrix. |
| [MIGRATING-FROM-SHADCN.md](MIGRATING-FROM-SHADCN.md) | Coming from shadcn/ui — CSS setup delta, component mapping, forms, and app shell. |

## Framework guides

| Guide | What it covers |
| ----- | -------------- |
| [USING-WITH-A-ROUTER.md](USING-WITH-A-ROUTER.md) | **Any router** (TanStack, React Router, Next.js) — `setLinkComponent` for config-driven navs vs `<Link asChild>` for in-content links. Read before writing any link. |
| [USING-WITH-NEXTJS.md](USING-WITH-NEXTJS.md) | Next.js App Router / RSC — client boundaries, serialization caveats, naming collisions. |
| [USING-WITH-VITE-SSR.md](USING-WITH-VITE-SSR.md) | Vite SSR / TanStack Start / Remix / workerd — the one-line `ssr.noExternal` fix for the `Unknown file extension ".css"` crash. |
| [USING-WITH-PREACT.md](USING-WITH-PREACT.md) | Preact + `preact/compat`, where signals are natively reactive. **Verified on Vite CSR**; see the guide's scope table for SSR and Astro. |
| [USING-WITH-ASTRO.md](USING-WITH-ASTRO.md) | Astro islands — which client directive keeps your component CSS, and why Preact under Astro does not work. |
| [USING-WITH-TAILWIND.md](USING-WITH-TAILWIND.md) | Interop with an existing Tailwind v4 setup. |

## Theming & tokens

| Guide | What it covers |
| ----- | -------------- |
| [THEMING.md](THEMING.md) | The `data-theme` model, runtime switching (`ThemeProvider`/`useTheme`, SSR no-FOUC), the specificity footgun, and authoring a brand theme. |
| [TOKENS.md](TOKENS.md) | The three-tier token catalog (primitive → semantic → component), by group. |
| [BRAND.md](BRAND.md) | cascivo's own brand reference — colours, voice, and usage. |

## Quality & operations

| Guide | What it covers |
| ----- | -------------- |
| [BENCHMARKS.md](BENCHMARKS.md) | **Bundle size** (JS + CSS, min+gzip) against shadcn/ui and Carbon, per-component incremental cost, and runtime benchmarks. The answer to "how big is it?". |
| [TESTING.md](TESTING.md) | How components are tested — unit, a11y, and visual regression. |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Symptom → cause → fix for the common failure modes (unstyled UI, frozen signals). |
| [UPGRADING.md](UPGRADING.md) | Upgrade guidance and `cascivo update` for owned component code. |
| [RELEASING.md](RELEASING.md) | Release runbook — changesets, versioning, trusted publishing. |
| [CSS-LAYERS-PITFALL.md](CSS-LAYERS-PITFALL.md) | The `@layer` ordering pitfall in example apps and how to avoid it. |
| [THIRD-PARTY-CSS.md](THIRD-PARTY-CSS.md) | Tame a legacy library's global CSS with the native `@import … layer(vendor)` recipe. |

## Ecosystem

| Guide | What it covers |
| ----- | -------------- |
| [CONTRIBUTING-REGISTRY.md](CONTRIBUTING-REGISTRY.md) | Publish and host a third-party component registry. |
| [CONTRIBUTING-TEMPLATES.md](CONTRIBUTING-TEMPLATES.md) | Author a template and submit it to the marketplace. |
| [CHART-LIBRARIES.md](CHART-LIBRARIES.md) | `@cascivo/charts` compared to Chart.js and Apache ECharts. |

## Cookbooks

Task-focused, copy-adaptable recipes in [`cookbooks/`](cookbooks/):

- [layout-and-spacing.md](cookbooks/layout-and-spacing.md) — layout and spacing without inline styles.
- [derivable-theming.md](cookbooks/derivable-theming.md) — relative color, `contrast-color`, and `@property`.
- [charts-stacked-bar.md](cookbooks/charts-stacked-bar.md) — stacked bars from row-oriented data.
- [charts-streaming.md](cookbooks/charts-streaming.md) — live, streaming charts (poll / SSE / WebSocket).
- [charts-lifeos-bridge.md](cookbooks/charts-lifeos-bridge.md) — bridge `@cascivo/charts` onto a consumer palette.
- [vercel-dashboard.md](cookbooks/vercel-dashboard.md) — a Vercel-grade streaming dashboard.
- [pagome-on-cascivo.md](cookbooks/pagome-on-cascivo.md) — rebuild pagome.com on cascivo, design-preserving.

## Specs & reference

- [ROADMAP.md](ROADMAP.md) — where cascivo is headed.
- [specs/](specs/) — design specs and conformance notes (WCAG 2.2, chart palettes, spacing, parity matrices, comparison evaluations).
- [internal/](internal/) — internal implementation plans and audit history. Provenance, not product docs; commands and paths in older files may be stale.

---

Machine-readable docs for AI agents: [`llms.txt`](https://cascivo.com/llms.txt),
per-component [`llms/<name>.md`](https://cascivo.com/llms/), and
[`context.json`](https://cascivo.com/context.json). Give your own agent the house
rules with [AI-RULES.md](AI-RULES.md) (the CSS layer contract, the reactivity
contract, and a utility-first mapping). See the root
[README](../README.md#ai--context-layer) for the full AI layer.
