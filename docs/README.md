# cascivo documentation

The curated index for everything under `docs/`. Start here, then follow the path
that matches what you're doing. The full, interactive docs live at
[docs.cascivo.com](https://docs.cascivo.com); this directory holds the adopter
guides, references, cookbooks, and specs that ship with the source.

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
| [USING-WITH-NEXTJS.md](USING-WITH-NEXTJS.md) | Next.js App Router / RSC — client boundaries, serialization caveats, naming collisions. |
| [USING-WITH-PREACT.md](USING-WITH-PREACT.md) | Preact + `preact/compat`, where signals are natively reactive. |
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
per-component [`llms/<name>.md`](https://docs.cascivo.com/llms/), and
[`context.json`](https://cascivo.com/context.json). Give your own agent the house
rules with [AI-RULES.md](AI-RULES.md) (the CSS layer contract, the reactivity
contract, and a utility-first mapping). See the root
[README](../README.md#ai--context-layer) for the full AI layer.
