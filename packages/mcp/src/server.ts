import { spawnSync } from 'node:child_process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  getComponent,
  listComponents,
  loadRegistry,
  searchComponents,
  type Registry,
} from './registry.js'
import { generateThemeCss } from './theme.js'
import { scaffoldPage } from './scaffold.js'
import { validateView } from '../../render/src/validate.js'
import { scaffoldView } from './scaffold-view.js'

export interface ServerOptions {
  registryPath?: string
  version?: string
}

const json = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })

const error = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
})

/** Build a configured McpServer exposing the cascade component registry. */
export function createServer(options: ServerOptions = {}): McpServer {
  const registry: Registry = loadRegistry(options.registryPath)

  const server = new McpServer({
    name: '@cascade-ui/mcp',
    version: options.version ?? '0.0.0',
  })

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description: 'List all cascade components, optionally filtered by category.',
      inputSchema: {
        category: z
          .enum(['inputs', 'display', 'overlay', 'navigation', 'feedback'])
          .optional()
          .describe('Filter by component category'),
      },
    },
    ({ category }) => json(listComponents(registry, category)),
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get component',
      description:
        'Get the full manifest (props, states, tokens, a11y, examples) for one component.',
      inputSchema: { name: z.string().describe('Component name, e.g. "button"') },
    },
    ({ name }) => {
      const meta = getComponent(registry, name)
      return meta ? json(meta) : error(`Component "${name}" not found.`)
    },
  )

  server.registerTool(
    'search_components',
    {
      title: 'Search components',
      description: 'Fuzzy search components by name, tags, or description.',
      inputSchema: { query: z.string().describe('Search query') },
    },
    ({ query }) => json(searchComponents(registry, query)),
  )

  server.registerTool(
    'add_to_project',
    {
      title: 'Add to project',
      description: 'Add a component to the current project by running the cascade CLI.',
      inputSchema: {
        name: z.string().describe('Component name to add'),
        outputDir: z.string().optional().describe('Directory to write the component into'),
      },
    },
    ({ name, outputDir }) => {
      const env = outputDir ? { ...process.env, CASCADE_OUTPUT_DIR: outputDir } : process.env
      const result = spawnSync('npx', ['-y', 'cascade', 'add', name], { encoding: 'utf8', env })
      if (result.status !== 0) {
        return error(result.stderr || result.error?.message || `Failed to add "${name}".`)
      }
      return text(result.stdout || `Added ${name}.`)
    },
  )

  server.registerTool(
    'create_theme',
    {
      title: 'Create theme',
      description: 'Generate a cascade theme CSS file from three colors.',
      inputSchema: {
        primary: z.string().describe('Primary / interactive color (any CSS color)'),
        neutral: z.string().describe('Base neutral color for surfaces and text'),
        accent: z.string().describe('Secondary accent color (info / focus)'),
        name: z.string().optional().describe('Theme name (default: "custom")'),
      },
    },
    ({ primary, neutral, accent, name }) =>
      text(generateThemeCss({ primary, neutral, accent }, name)),
  )

  server.registerTool(
    'scaffold_page',
    {
      title: 'Scaffold page (deprecated)',
      description:
        '[Deprecated — use scaffold_view instead] Generate a JSX page layout from a description.',
      inputSchema: {
        description: z.string().describe('What the page is for'),
        components: z.array(z.string()).optional().describe('Components to include'),
      },
    },
    ({ description, components }) => {
      const { config } = scaffoldView(
        { description, ...(components ? { components } : {}) },
        registry,
      )
      return text(
        `[Deprecated] Use scaffold_view for config-first output. JSX scaffold:\n\n${scaffoldPage(components ? { description, components } : { description })}\n\n--- scaffold_view output ---\n${JSON.stringify(config, null, 2)}`,
      )
    },
  )

  server.registerTool(
    'validate_view',
    {
      title: 'Validate view config',
      description:
        'Validate a CascadeView JSON config against the registry. Returns errors with exact paths.',
      inputSchema: {
        config: z.record(z.string(), z.unknown()).describe('The ViewConfig object to validate'),
      },
    },
    ({ config }) => {
      const result = validateView(config)
      return json(result)
    },
  )

  server.registerTool(
    'scaffold_view',
    {
      title: 'Scaffold view config',
      description:
        'Generate a valid starter ViewConfig from a description. Always validates before returning.',
      inputSchema: {
        description: z.string().describe('What the page/view is for'),
        components: z.array(z.string()).optional().describe('Component names to include'),
      },
    },
    ({ description, components }) => {
      const { config, errors } = scaffoldView(
        { description, ...(components ? { components } : {}) },
        registry,
      )
      if (errors.length > 0) {
        return json({ valid: false, errors, config })
      }
      return json({ valid: true, config })
    },
  )

  return server
}
