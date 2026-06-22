## Usage

Add it to your MCP client configuration:

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

The server speaks the MCP stdio transport. By default it reads the `registry.json` bundled with the package; override with the `CASCIVO_REGISTRY_PATH` environment variable to point at a local registry.

## Tools

| Tool                 | Input                                 | Returns                                                                                                                                 |
| -------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `list_components`    | `{ category? }`                       | All component manifests, optionally filtered by category                                                                                |
| `get_component`      | `{ name }`                            | The full manifest for one component                                                                                                     |
| `search_components`  | `{ query }`                           | Components matching name, tags, or description                                                                                          |
| `add_to_project`     | `{ name, outputDir? }`                | Runs `cascivo add <name>` as a child process                                                                                            |
| `create_theme`       | `{ primary, neutral, accent, name? }` | A custom theme as CSS (semantic token layer)                                                                                            |
| `scaffold_page`      | `{ description, components? }`        | A JSX page layout string                                                                                                                |
| `scaffold_view`      | `{ description, components? }`        | A validated starter `ViewConfig` + the bound-vocabulary `grammar` for its components                                                    |
| `validate_view`      | `{ config }`                          | Validation errors (component, prop type/enum, refs) with exact paths                                                                    |
| `get_view_grammar`   | `{ components? }`                     | Bound-vocabulary grammar + generation prompt for valid `ViewConfig` JSON                                                                |
| `get_variant_matrix` | `{ role?, theme? }`                   | Deterministic intent→token map (role + state slot) + every token resolved per theme                                                     |
| `validate_component` | `{ tsx?, css?, name? }`               | Static structural-invariant check of generated source (banned hooks, off-scale breakpoints, missing CSS fallbacks, hallucinated tokens) |

`category` is one of `inputs`, `display`, `overlay`, `navigation`, `feedback`.

### Bound-vocabulary generation (anti-hallucination)

`get_view_grammar` derives — from the `component.meta.ts` manifests — a **system
prompt** plus a compact **allowed-vocabulary grammar** (each component → its
props → enum/size/variant values) for emitting valid `ViewConfig` JSON rendered
by `@cascivo/render` `<CascadeView />`. This is [OpenUI](https://openui.com)'s
"generate the system prompt from the component library" mechanism (see
[`docs/ROADMAP-V40.md`](../../docs/ROADMAP-V40.md)): because the grammar is
**derived**, not authored, an LLM is structurally prevented from inventing
components, props, or enum values, and the grammar can never drift from the
components. Pair it with `validate_view` (which now also checks prop types/enums)
as the enforcement backstop.

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

The pure helpers (`listComponents`, `getComponent`, `searchComponents`, `generateThemeCss`, `scaffoldPage`) are exported too, so the registry can be queried without spinning up the protocol.
