The `cascivo` CLI drives the copy-paste workflow — it scaffolds config, copies component source from the registry into your project, and audits generated code. You own every file it writes.

## Commands

```sh
npx cascivo create my-app          # scaffold a full app — Vite + React, app shell, side nav, theme
npx cascivo create my-app --template owner/repo/dashboard  # …and start from a template
npx cascivo init                   # scaffold cascivo.config.ts + tokens; detects your package manager
cascivo add button card            # copy component source from the registry into your project
cascivo add owner/repo/button      # install from any third-party registry
cascivo add owner/repo/dashboard   # install a template (its components + page/fixture files)
cascivo view owner/repo/dashboard  # preview an item (or template) before installing
cascivo list                       # list available components
cascivo update                     # pull newer versions of copied components
cascivo audit --ai                 # flag hard-coded values, invented props, missing wiring
cascivo search <query>             # search components across registries
cascivo theme add <name>           # install a first-party theme (12 available)
cascivo eject <component>          # eject tokens into a scoped local override file
cascivo generate <config.json>     # generate TSX from a ViewConfig JSON file
cascivo doctor [--ci] [--drift]    # check components for rule violations / registry drift
cascivo tokens import <file>       # import external design tokens as overrides
cascivo registry build             # build a registry from your own components
cascivo template init <name>       # scaffold a new template
```

Every command supports `--help` for its flags and examples.

A **template** is a registry item (`type: "template"`) that bundles a working page with the components it composes (in `registryDependencies`) and its own page/fixture files (each with a `target`). `cascivo add` installs the component closure into your components directory and writes the template's files to their targets; `create --template` does the same into a freshly scaffolded app.

## How it works

`create` scaffolds a complete Vite + React + TypeScript app — pre-wired with the cascivo app shell, side navigation, header, and your chosen theme. It asks for a project name, theme, and the nav sections you want, then generates a section component for each. Pass `--theme`, `--sections "Dashboard, Reports"`, or `--yes` to skip the prompts. `init` detects npm / pnpm / yarn / bun, writes `cascivo.config.ts`, and wires up the token and theme imports. `add` resolves each component from [`registry.json`](https://github.com/cascivo/cascivo/blob/main/registry.json), fetches its source (TSX + CSS module + manifest) from GitHub raw URLs, and drops it into the path from your config — pulling in any dependencies it needs.

Because the registry model is open, `add owner/repo/component` installs from any compatible registry, not just the first-party one. See the [registry starter](https://github.com/cascivo/cascivo/tree/main/apps/examples/registry-starter) to publish your own.

## Prefer the shadcn CLI or an AI tool?

cascivo also publishes a [shadcn-compatible registry](https://cascivo.com/r/shadcn/registry.json),
so you can install the same components with the shadcn CLI or "Open in v0" without
the `cascivo` binary:

```sh
npx shadcn@latest add https://cascivo.com/r/shadcn/button.json
```

Every item inlines its source and resolves its cascivo dependencies transitively.
Page **blocks** are in the shadcn registry too, under a `block-` slug — install
`block/dashboard-overview` as `https://cascivo.com/r/shadcn/block-dashboard-overview.json`
(the `cascivo` binary addresses the same block as `npx cascivo add block/dashboard-overview`).

Building **with an AI assistant?** cascivo has no training-data footprint yet, so
give the tool the knowledge directly rather than relying on it to browse the site:
paste or link [`https://cascivo.com/llms-full.txt`](https://cascivo.com/llms-full.txt)
(the whole library — setup + every component — in one file), or point an MCP-capable
agent at [`@cascivo/mcp`](https://www.npmjs.com/package/@cascivo/mcp).
