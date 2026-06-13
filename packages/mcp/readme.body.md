## Usage

Add it to your MCP client configuration:

```json
{
  "mcpServers": {
    "cascade": {
      "command": "npx",
      "args": ["-y", "@cascivo/mcp"]
    }
  }
}
```

The server speaks the MCP stdio transport. By default it reads the `registry.json` bundled with the package; override with the `CASCADE_REGISTRY_PATH` environment variable to point at a local registry.

## Tools

| Tool                | Input                                 | Returns                                                  |
| ------------------- | ------------------------------------- | -------------------------------------------------------- |
| `list_components`   | `{ category? }`                       | All component manifests, optionally filtered by category |
| `get_component`     | `{ name }`                            | The full manifest for one component                      |
| `search_components` | `{ query }`                           | Components matching name, tags, or description           |
| `add_to_project`    | `{ name, outputDir? }`                | Runs `cascade add <name>` as a child process             |
| `create_theme`      | `{ primary, neutral, accent, name? }` | A custom theme as CSS (semantic token layer)             |
| `scaffold_page`     | `{ description, components? }`        | A JSX page layout string                                 |

`category` is one of `inputs`, `display`, `overlay`, `navigation`, `feedback`.

## Programmatic use

```ts
import { createServer } from '@cascivo/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = createServer({ registryPath: './registry.json' })
await server.connect(new StdioServerTransport())
```

The pure helpers (`listComponents`, `getComponent`, `searchComponents`, `generateThemeCss`, `scaffoldPage`) are exported too, so the registry can be queried without spinning up the protocol.
