## Usage

The quickest way is from your project root — it writes the config and keeps any other servers:

```sh
npx cascivo mcp init                  # Claude Code (.mcp.json)
npx cascivo mcp init --client cursor  # .cursor/mcp.json   (also: --client vscode)
```

Or add it to your MCP client configuration by hand:

```json
{
  "mcpServers": {
    "cascivo": {
      "command": "npx",
      "args": ["-y", "@cascivo/mcp"]
    }
  }
}
```

The server speaks the MCP stdio transport. It is **self-contained**: the registry, token catalog, variant matrix, component context, and marketplace catalog are all bundled with the package, so discovery, token, and validation tools work offline — hosted data is only fetched as a fallback. Override the registry with the `CASCIVO_REGISTRY_PATH` environment variable; add extra registries via `CASCADE_REGISTRIES`.

## Tools

### Discovery

| Tool                | Input                           | Returns                                                                                                                                              |
| ------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_registries`   | `{}`                            | Available registries: the cascivo directory plus any configured via `CASCADE_REGISTRIES`                                                             |
| `list_components`   | `{ category?, type? }`          | All component manifests, filterable by category and entry type (`component`, `layout`, `block`, …)                                                   |
| `get_component`     | `{ name, registry?, compact? }` | The full manifest (props, states, tokens, a11y, examples) — optionally from an external registry; `compact` returns props, one example and a11y only |
| `search_components` | `{ query, registry? }`          | Fuzzy search by name, tags, or description                                                                                                           |
| `get_context`       | `{ name }`                      | Intent, whenToUse/whenNotToUse, and authoring guidance for one component                                                                             |
| `select_component`  | `{ need }`                      | Heuristic ranking of components for a natural-language need, with scores and reasons                                                                 |

`category` is one of `inputs`, `display`, `overlay`, `navigation`, `feedback`, `chart`.

### Tokens & theming

| Tool                 | Input                                 | Returns                                                                                      |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `get_tokens`         | `{ group?, layer?, includeAliases? }` | The closed token catalog — canonical names only by default, so agents never hard-code values |
| `get_variant_matrix` | `{ role?, theme? }`                   | Deterministic intent→token map (colour role + state slot) + every token resolved per theme   |
| `create_theme`       | `{ primary, neutral, accent, name? }` | A custom theme as CSS (semantic token layer) generated from three colors                     |

### Scaffold & validate

| Tool                      | Input                              | Returns                                                                                                                                 |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `scaffold_view`           | `{ description, components? }`     | A validated starter `ViewConfig` + the bound-vocabulary `grammar` for its components                                                    |
| `validate_view`           | `{ config }`                       | Validation errors (renderable component, prop type/enum, refs) with exact paths                                                         |
| `render_view_as_markdown` | `{ config, data? }`                | What the view says, as Markdown — rendered by the real components (needs `@cascivo/render` installed in the project)                    |
| `get_view_grammar`        | `{ components?, detail? }`         | Generation prompt (format rules + bound vocabulary) for valid `ViewConfig` JSON; `detail` adds the vocabulary as JSON                   |
| `validate_component`      | `{ tsx?, css?, name? }`            | Static structural-invariant check of generated source (banned hooks, off-scale breakpoints, missing CSS fallbacks, hallucinated tokens) |
| `scaffold_flow`           | `{ description, steps?, layout? }` | Starter nodes/edges + ready-to-paste `<Flow />` JSX (from `@cascivo/flow`) for a diagram                                                |
| `scaffold_page`           | `{ description, components? }`     | **Deprecated** — use `scaffold_view`; still returns a JSX scaffold plus the `scaffold_view` output                                      |

### Templates

| Tool             | Input                                            | Returns                                                                          |
| ---------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `list_templates` | `{ category?, tag?, framework?, verifiedOnly? }` | Marketplace templates (whole-page compositions) from the catalog                 |
| `get_template`   | `{ name }`                                       | One template: its components, install command, demo link, and screenshots        |
| `add_template`   | `{ name, cwd? }`                                 | Installs a template (components + page/fixture files) by running the cascivo CLI |

### Project

| Tool             | Input                                                                                        | Returns                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add_to_project` | `{ names?, name?, outputDir? }`                                                              | Runs one `cascivo add <names…>` as a child process                                                                                                                              |
| `create_app`     | `{ name, framework?, runtime?, examples?, auth?, theme?, sections?, template?, cwd? }`       | Scaffolds a full app (shell + side nav + any first-party theme) via `cascivo create`: `react-vite` (default), `astro`, or `cloudflare` (client app + API on one Worker)         |
| `compose_app`    | `{ name, pages: [{ title, block? }], framework?, theme?, runtime?, examples?, auth?, cwd? }` | Writes a whole app from a blueprint via `cascivo create --from`: each page renders a registry block, wired into the routes and side nav                                         |
| `list_blocks`    | `{}`                                                                                         | The blocks a `compose_app` page can render, one line each                                                                                                                       |
| `lint_email`     | `{ html, checkLinks?, cwd? }`                                                                | Runs `cascivo email lint` on rendered email HTML: unsupported client features and dead links (`#`, `{{merge tags}}`, `example.com`). Needs `@cascivo/email` in `cwd`            |
| `deploy_preview` | `{ cwd }`                                                                                    | Publishes a `cloudflare` app to a temporary Cloudflare account with no sign-up. Returns a public URL and a claim URL; the deployment is deleted after 60 minutes unless claimed |

### Bound-vocabulary generation (anti-hallucination)

`get_view_grammar` derives — from the `component.meta.ts` manifests — a **system
prompt** plus a compact **allowed-vocabulary grammar** (each component → its
props → enum/size/variant values) for emitting valid `ViewConfig` JSON rendered
by `@cascivo/render` `<CascivoView />`. This is [OpenUI](https://openui.com)'s
"generate the system prompt from the component library" mechanism (see
[`ROADMAP-V40.md`](https://github.com/cascivo/cascivo/blob/main/docs/internal/ROADMAP-V40.md)):
because the grammar is **derived**, not authored, an LLM is structurally
prevented from inventing components, props, or enum values, and the grammar can
never drift from the components. It lists only the components `<CascivoView />`
can render, because the renderer draws an unknown name as nothing. Pair it with
`validate_view` (which also checks prop types/enums, and refuses a real component the
renderer cannot draw) as the enforcement backstop.

```ts
import { buildGenerationPrompt, loadRegistry } from '@cascivo/mcp'

const prompt = buildGenerationPrompt(loadRegistry(), { components: ['Badge', 'Button'] })
// → use as the system prompt; the model can only emit Badge/Button with their real props.
```

## Programmatic use

```ts
import { createServer } from '@cascivo/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = createServer({ registryPath: './registry.json' })
await server.connect(new StdioServerTransport())
```

The pure helpers (`listComponents`, `getComponent`, `searchComponents`, `generateThemeCss`, `scaffoldPage`, `buildGrammar`, `buildGenerationPrompt`, `loadRegistry`) are exported too, so the registry can be queried without spinning up the protocol.
