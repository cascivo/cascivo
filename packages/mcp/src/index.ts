import { createRequire } from 'node:module'
import { argv } from 'node:process'
import { pathToFileURL } from 'node:url'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'

// Read at runtime: this file lives one level below the package root both in
// src/ (dev, tests) and in dist/ (published bundle), so ../package.json is
// always the @cascivo/mcp package manifest.
export const VERSION: string = (
  createRequire(import.meta.url)('../package.json') as { version: string }
).version

export { createServer } from './server.js'
export type { ServerOptions } from './server.js'
export { generateThemeCss, type ThemeColors } from './theme.js'
export { scaffoldPage, type ScaffoldOptions } from './scaffold.js'
export {
  buildGrammar,
  formatGrammar,
  parseEnum,
  type GrammarComponent,
  type GrammarProp,
  type ViewGrammar,
} from './grammar.js'
export { buildGenerationPrompt, type GenerationPromptOptions } from './prompt.js'
export {
  getComponent,
  listComponents,
  loadRegistry,
  searchComponents,
  type ComponentManifest,
  type Registry,
  type RegistryComponent,
} from './registry.js'

/** Start the MCP server over stdio. */
export async function main(): Promise<void> {
  const server = createServer({ version: VERSION })
  await server.connect(new StdioServerTransport())
}

const isMain = argv[1] !== undefined && import.meta.url === pathToFileURL(argv[1]).href

if (isMain) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  })
}
