The `cascivo` CLI drives the copy-paste workflow — it scaffolds config, copies component source from the registry into your project, and audits generated code. You own every file it writes.

## Commands

```sh
npx cascivo create my-app     # scaffold a full app — Vite + React, app shell, side nav, theme
npx cascivo init              # scaffold cascivo.config.ts + tokens; detects your package manager
cascivo add button card       # copy component source from the registry into your project
cascivo add owner/repo/button # install from any third-party registry
cascivo list                  # list available components
cascivo update                # pull newer versions of copied components
cascivo audit --ai            # flag hard-coded values, invented props, missing wiring
cascivo build                 # build a registry from your own components
```

## How it works

`create` scaffolds a complete Vite + React + TypeScript app — pre-wired with the cascivo app shell, side navigation, header, and your chosen theme. It asks for a project name, theme, and the nav sections you want, then generates a section component for each. Pass `--theme`, `--sections "Dashboard, Reports"`, or `--yes` to skip the prompts. `init` detects npm / pnpm / yarn / bun, writes `cascivo.config.ts`, and wires up the token and theme imports. `add` resolves each component from [`registry.json`](https://github.com/cascivo/cascivo/blob/main/registry.json), fetches its source (TSX + CSS module + manifest) from GitHub raw URLs, and drops it into the path from your config — pulling in any dependencies it needs.

Because the registry model is open, `add owner/repo/component` installs from any compatible registry, not just the first-party one. See the [registry starter](https://github.com/cascivo/cascivo/tree/main/apps/examples/registry-starter) to publish your own.
