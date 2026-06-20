The **source of truth** for every cascivo component — TSX + CSS module + `component.meta.ts` manifest + tests. This package is what the CLI copies from; the registry, MCP server, docs, and Storybook all derive from these manifests.

You don't install this package. In an app, either:

- **Copy what you use** — `npx cascivo add button` drops the source into your project (you own and edit it), or
- **Use the prebuilt distribution** — [`@cascivo/react`](https://github.com/cascivo/cascivo/tree/main/packages/react) ships every component as a normal dependency.

Both consume the same tokens and themes and can coexist in one project.

## Authoring

Every component here follows the rules in [CLAUDE.md](https://github.com/cascivo/cascivo/blob/main/CLAUDE.md): signals not React hooks, modern CSS (`@layer` / `@container` / `:has()`), mobile-first with ≥44px touch targets, strings from the i18n catalog, and a machine-readable manifest. New components flow through the [dark factory](https://github.com/cascivo/cascivo/tree/main/scripts/factory) and get a human design + accessibility review before merge.

The full catalog of what lives here:
