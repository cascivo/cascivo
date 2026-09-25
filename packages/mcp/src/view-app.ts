import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The MCP App (the MCP UI extension, `io.modelcontextprotocol/ui`) that renders a view inside
 * the chat client: `show_view` links to this resource, and a host that supports MCP Apps
 * loads it into an iframe and hands it the tool result. Hosts without the extension ignore
 * the link and show the tool's text.
 */
export const VIEW_APP_URI = 'ui://cascivo/view.html'
export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app'

/**
 * Tool `_meta` linking to the view. The nested `ui.resourceUri` is the current form; the flat
 * `ui/resourceUri` key is the deprecated one some hosts still read, so both are set.
 */
export const VIEW_APP_TOOL_META = {
  ui: { resourceUri: VIEW_APP_URI },
  'ui/resourceUri': VIEW_APP_URI,
}

const HERE = dirname(fileURLToPath(import.meta.url))

/** The built page (dist/view.html, written by scripts/build-app.mjs), if this is a build. */
export function loadViewApp(dir: string = HERE): string | undefined {
  const file = join(dir, 'view.html')
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined
}
