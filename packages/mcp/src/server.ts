import { spawnSync } from 'node:child_process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  fetchDirectory,
  fetchRegistryIndex,
  getComponent,
  getEnvRegistries,
  listComponents,
  loadRegistry,
  mergeRegistries,
  searchComponents,
  type Registry,
} from './registry.js'
import { generateThemeCss } from './theme.js'
import { scaffoldPage } from './scaffold.js'
import { validateView } from './validate.js'
import { scaffoldView } from './scaffold-view.js'
import { buildGrammar, formatGrammar } from './grammar.js'
import { buildGenerationPrompt } from './prompt.js'
import { loadTokenCatalog } from './tokens.js'
import { loadVariantMatrix } from './variants.js'
import { validateComponentSource } from './validate-component.js'
import { loadContext, loadComponentMarkdown } from './context.js'
import { selectComponent } from './select.js'
import { loadCatalog, listTemplates, getTemplate } from './templates.js'

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

export interface ServerOptions {
  registryPath?: string
  version?: string
  /** Injectable fetch function — used for testing multi-registry features. */
  fetchFn?: FetchFn
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
  const fetchFn = options.fetchFn

  const server = new McpServer({
    name: '@cascivo/mcp',
    version: options.version ?? '0.0.0',
  })

  server.registerTool(
    'list_registries',
    {
      title: 'List registries',
      description:
        'List available component registries: the cascade directory plus any configured via CASCADE_REGISTRIES env.',
      inputSchema: {},
    },
    async () => {
      const directory = await fetchDirectory(fetchFn)
      const env = getEnvRegistries()
      const entries = mergeRegistries(directory, env)
      return json(
        entries.map(({ namespace, name, description, verified, homepage }) => ({
          namespace,
          name,
          description,
          verified: verified ?? false,
          homepage,
        })),
      )
    },
  )

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description: 'List all cascade components, optionally filtered by category and/or type.',
      inputSchema: {
        category: z
          .enum(['inputs', 'display', 'overlay', 'navigation', 'feedback', 'chart'])
          .optional()
          .describe('Filter by component category'),
        type: z
          .enum(['component', 'layout', 'block', 'chart', 'flow', 'editor'])
          .optional()
          .describe('Filter by entry type'),
      },
    },
    ({ category, type }) => json(listComponents(registry, category, type)),
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get component',
      description:
        'Get the full manifest (props, states, tokens, a11y, examples) for one component.',
      inputSchema: {
        name: z.string().describe('Component name, e.g. "button"'),
        registry: z
          .string()
          .optional()
          .describe('Namespace of an external registry, e.g. "@myns". Omit for the default.'),
      },
    },
    async ({ name, registry: ns }) => {
      if (ns) {
        const env = getEnvRegistries()
        const directory = await fetchDirectory(fetchFn)
        const entries = mergeRegistries(directory, env)
        const entry = entries.find((e) => e.namespace === ns)
        if (!entry) return error(`Registry "${ns}" not found.`)
        const remoteRegistry = await fetchRegistryIndex(entry.registryUrl, fetchFn)
        if (!remoteRegistry) return error(`Failed to fetch registry index for "${ns}".`)
        const meta = getComponent(remoteRegistry, name)
        return meta ? json(meta) : error(`Component "${name}" not found in registry "${ns}".`)
      }
      const meta = getComponent(registry, name)
      return meta ? json(meta) : error(`Component "${name}" not found.`)
    },
  )

  server.registerTool(
    'search_components',
    {
      title: 'Search components',
      description: 'Fuzzy search components by name, tags, or description.',
      inputSchema: {
        query: z.string().describe('Search query'),
        registry: z
          .string()
          .optional()
          .describe('Namespace of an external registry, e.g. "@myns". Omit for the default.'),
      },
    },
    async ({ query, registry: ns }) => {
      if (ns) {
        const env = getEnvRegistries()
        const directory = await fetchDirectory(fetchFn)
        const entries = mergeRegistries(directory, env)
        const entry = entries.find((e) => e.namespace === ns)
        if (!entry) return error(`Registry "${ns}" not found.`)
        const remoteRegistry = await fetchRegistryIndex(entry.registryUrl, fetchFn)
        if (!remoteRegistry) return error(`Failed to fetch registry index for "${ns}".`)
        return json(searchComponents(remoteRegistry, query))
      }
      return json(searchComponents(registry, query))
    },
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
      const env = outputDir ? { ...process.env, CASCIVO_OUTPUT_DIR: outputDir } : process.env
      const result = spawnSync('npx', ['-y', 'cascivo', 'add', name], { encoding: 'utf8', env })
      if (result.status !== 0) {
        return error(result.stderr || result.error?.message || `Failed to add "${name}".`)
      }
      return text(result.stdout || `Added ${name}.`)
    },
  )

  server.registerTool(
    'list_templates',
    {
      title: 'List templates',
      description:
        'List marketplace templates (whole-page compositions) from the static catalog, optionally filtered by category, tag, framework, or verified status.',
      inputSchema: {
        category: z.string().optional().describe('Filter by category, e.g. "dashboard"'),
        tag: z.string().optional().describe('Filter by tag'),
        framework: z
          .enum(['react-vite', 'react-next'])
          .optional()
          .describe('Filter by target framework'),
        verifiedOnly: z.boolean().optional().describe('Only verified templates'),
      },
    },
    ({ category, tag, framework, verifiedOnly }) => {
      const catalog = loadCatalog()
      const filter: Parameters<typeof listTemplates>[1] = {}
      if (category) filter.category = category
      if (tag) filter.tag = tag
      if (framework) filter.framework = framework
      if (verifiedOnly) filter.verifiedOnly = verifiedOnly
      return json(listTemplates(catalog, filter))
    },
  )

  server.registerTool(
    'get_template',
    {
      title: 'Get template',
      description:
        'Get one marketplace template by name or install spec — its components, install command, demo link, and screenshots.',
      inputSchema: {
        name: z.string().describe('Template name or install spec, e.g. "@cascivo/dashboard"'),
      },
    },
    ({ name }) => {
      const tpl = getTemplate(loadCatalog(), name)
      if (!tpl) return error(`Template "${name}" not found in the marketplace catalog.`)
      return json(tpl)
    },
  )

  server.registerTool(
    'add_template',
    {
      title: 'Add template',
      description:
        'Install a marketplace template (its components + page/fixture files) into the current project by running the cascade CLI.',
      inputSchema: {
        name: z.string().describe('Template name or install spec, e.g. "@cascivo/dashboard"'),
        cwd: z.string().optional().describe('Project directory (default: current directory)'),
      },
    },
    ({ name, cwd }) => {
      const tpl = getTemplate(loadCatalog(), name)
      const spec = tpl?.installSpec ?? name
      const result = spawnSync('npx', ['-y', 'cascivo', 'add', spec], {
        encoding: 'utf8',
        ...(cwd ? { cwd } : {}),
      })
      if (result.status !== 0) {
        return error(result.stderr || result.error?.message || `Failed to add template "${spec}".`)
      }
      return text(result.stdout || `Added template ${spec}.`)
    },
  )

  server.registerTool(
    'create_app',
    {
      title: 'Create app',
      description:
        'Scaffold a complete, ready-to-run cascivo app (Vite + React + TypeScript) wired with the app shell, side navigation, header, and a theme — one page per nav section, with signal-driven section switching. Runs `cascivo create` as a child process, writing the project into a new <name> directory.',
      inputSchema: {
        name: z.string().describe('Project name and directory, e.g. "my-app"'),
        theme: z
          .enum(['light', 'dark', 'warm'])
          .optional()
          .describe('Theme to wire in (default: light)'),
        sections: z
          .array(z.string())
          .optional()
          .describe(
            'Side-nav section labels; one page is generated per section (default: Dashboard, Reports, Settings)',
          ),
        cwd: z
          .string()
          .optional()
          .describe('Directory to create the app in (default: current directory)'),
      },
    },
    ({ name, theme, sections, cwd }) => {
      const args = ['-y', 'cascivo', 'create', name, '--yes']
      if (theme) args.push('--theme', theme)
      if (sections && sections.length > 0) args.push('--sections', sections.join(', '))
      const result = spawnSync('npx', args, { encoding: 'utf8', ...(cwd ? { cwd } : {}) })
      if (result.status !== 0) {
        return error(result.stderr || result.error?.message || `Failed to create "${name}".`)
      }
      return text(result.stdout || `Created ${name}.`)
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
      const componentNames = new Set(registry.components.map((c) => c.meta.name))
      const result = validateView(config, componentNames)
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
      const { config, errors, grammar } = scaffoldView(
        { description, ...(components ? { components } : {}) },
        registry,
      )
      if (errors.length > 0) {
        return json({ valid: false, errors, config, grammar })
      }
      return json({ valid: true, config, grammar })
    },
  )

  server.registerTool(
    'scaffold_flow',
    {
      title: 'Scaffold a flow diagram',
      description:
        'Generate a starter declarative <Flow nodes edges /> (from @cascivo/flow) for a node/edge diagram — flowchart, DAG, or pipeline. Returns serializable nodes/edges plus ready-to-paste JSX. Edit the labels/edges to match the intent.',
      inputSchema: {
        description: z.string().describe('What the diagram represents'),
        steps: z
          .array(z.string())
          .optional()
          .describe(
            'Ordered step labels; consecutive steps are connected. Omit for a 3-step starter.',
          ),
        layout: z
          .enum(['none', 'grid', 'layered'])
          .optional()
          .describe('Optional auto-layout. Default "layered".'),
      },
    },
    ({ description, steps, layout }) => {
      const labels = steps && steps.length > 0 ? steps : ['Source', 'Process', 'Sink']
      const nodes = labels.map((label, i) => ({
        id: `n${i + 1}`,
        position: { x: i * 240, y: 0 },
        data: { label },
      }))
      const edges = labels.slice(1).map((_, i) => ({
        id: `e${i + 1}`,
        source: `n${i + 1}`,
        target: `n${i + 2}`,
        animated: true,
      }))
      const lay = layout ?? 'layered'
      const layoutProp = lay === 'none' ? '' : ` layout="${lay}"`
      const code = `import { Flow } from '@cascivo/flow'
import '@cascivo/flow/styles.css'

// ${description}
export function Diagram() {
  return (
    <Flow
      style={{ height: 360 }}
      background
      controls${layoutProp}
      nodes={${JSON.stringify(nodes)}}
      edges={${JSON.stringify(edges)}}
    />
  )
}`
      return json({ nodes, edges, layout: lay, code })
    },
  )

  server.registerTool(
    'get_view_grammar',
    {
      title: 'Get view grammar',
      description:
        "Get the bound-vocabulary grammar + system prompt for generating valid ViewConfig JSON, derived from the component manifests. Use this to constrain an LLM to cascivo's real components, props, and enum values (anti-hallucination). Optionally scope to a subset of components.",
      inputSchema: {
        components: z
          .array(z.string())
          .optional()
          .describe('Scope the vocabulary to these component names. Omit for the full registry.'),
      },
    },
    ({ components }) => {
      const grammar = buildGrammar(registry, components)
      return json({
        grammar: formatGrammar(grammar),
        prompt: buildGenerationPrompt(registry, components ? { components } : {}),
        components: grammar.components,
      })
    },
  )

  server.registerTool(
    'get_tokens',
    {
      title: 'Get tokens',
      description:
        'Get the cascade token catalog (closed set). Agents must select from this catalog rather than hard-coding values. Returns the CANONICAL token set by default — exactly one name per purpose. Pass includeAliases: true to also list backwards-compat aliases, each tagged with its canonical name.',
      inputSchema: {
        group: z
          .string()
          .optional()
          .describe('Filter by token group, e.g. "color", "space", "radius"'),
        layer: z
          .enum(['primitive', 'semantic', 'component'])
          .optional()
          .describe('Filter by layer'),
        includeAliases: z
          .boolean()
          .optional()
          .describe(
            'Include backwards-compat alias tokens (e.g. --cascivo-color-bg → --cascivo-color-background). Off by default so agents see one correct token per purpose.',
          ),
      },
    },
    async ({ group, layer, includeAliases }) => {
      try {
        const catalog = await loadTokenCatalog(fetchFn)
        let tokens = catalog.tokens
        // Canonical-only by default: hide tokens that are an alias of another.
        if (!includeAliases) tokens = tokens.filter((t) => !t.aliasOf)
        if (group) tokens = tokens.filter((t) => t.group === group)
        if (layer) tokens = tokens.filter((t) => t.layer === layer)
        return json({ count: tokens.length, tokens })
      } catch (e) {
        return error(`Token catalog unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
  )

  server.registerTool(
    'get_variant_matrix',
    {
      title: 'Get variant matrix',
      description:
        'Get the deterministic token variant matrix: a map from design intent (a colour role + state slot, e.g. accent + hover) to the exact token name, plus every semantic/component token resolved to a concrete value in each theme. Use this to answer "what is the warm theme\'s accent-hover value?" or "which token is the active state of primary?" without guessing how layered theme CSS resolves.',
      inputSchema: {
        role: z
          .string()
          .optional()
          .describe('Filter to one colour role, e.g. "accent", "primary", "destructive"'),
        theme: z
          .string()
          .optional()
          .describe('Restrict the per-theme values to a single theme, e.g. "warm"'),
      },
    },
    async ({ role, theme }) => {
      try {
        const matrix = await loadVariantMatrix(fetchFn)
        if (theme && !matrix.themes.includes(theme)) {
          return error(`Unknown theme "${theme}". Available: ${matrix.themes.join(', ')}`)
        }
        const pickTheme = (byTheme: Record<string, string | null>) =>
          theme ? { [theme]: byTheme[theme] ?? null } : byTheme
        let tokens = matrix.tokens
        let families = matrix.families
        if (role) {
          tokens = tokens.filter((t) => t.role === role)
          families = matrix.families[role] ? { [role]: matrix.families[role] } : {}
          if (tokens.length === 0) {
            const available = Object.keys(matrix.families).join(', ')
            return error(`No colour role "${role}". Available roles: ${available}`)
          }
        }
        return json({
          themes: theme ? [theme] : matrix.themes,
          families,
          tokens: tokens.map((t) => ({ ...t, byTheme: pickTheme(t.byTheme) })),
        })
      } catch (e) {
        return error(`Variant matrix unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
  )

  server.registerTool(
    'validate_component',
    {
      title: 'Validate component (shadow sandbox)',
      description:
        "Run cascivo's structural invariants over candidate component source (TSX and/or CSS) before writing it to disk. Catches banned React hooks, off-scale @media/@container breakpoints, missing static fallbacks for progressive CSS (@function/if()), and hallucinated --cascivo-* tokens. Use this to self-correct generated code in a loop until `valid` is true.",
      inputSchema: {
        tsx: z.string().optional().describe('Component TSX source'),
        css: z.string().optional().describe('Component CSS (module or plain) source'),
        name: z.string().optional().describe('Component name (for messages only)'),
      },
    },
    async ({ tsx, css, name }) => {
      let tokenNames: Set<string> | undefined
      let aliasMap: Map<string, string> | undefined
      try {
        const catalog = await loadTokenCatalog(fetchFn)
        tokenNames = new Set(catalog.tokens.map((t) => t.name))
        aliasMap = new Map(catalog.tokens.filter((t) => t.aliasOf).map((t) => [t.name, t.aliasOf!]))
      } catch {
        // Token catalog is optional — skip the hallucination/alias checks if unavailable.
      }
      const result = validateComponentSource(
        { ...(tsx ? { tsx } : {}), ...(css ? { css } : {}), ...(name ? { name } : {}) },
        {
          ...(tokenNames ? { tokenNames } : {}),
          ...(aliasMap && aliasMap.size > 0 ? { aliasMap } : {}),
        },
      )
      return json(result)
    },
  )

  server.registerTool(
    'get_context',
    {
      title: 'Get context',
      description:
        'Get intent, whenToUse/whenNotToUse, and authoring guidance for one component by name.',
      inputSchema: {
        name: z.string().describe('Component name, e.g. "Toast"'),
      },
    },
    async ({ name }) => {
      try {
        const ctx = await loadContext(fetchFn)
        const target = name.toLowerCase()
        const component = ctx.components.find((c) => c.name.toLowerCase() === target)
        if (!component) {
          const available = ctx.components.map((c) => c.name).join(', ')
          return error(`Component "${name}" not found. Available: ${available}`)
        }
        const md = await loadComponentMarkdown(component.name, fetchFn)
        return json({
          name: component.name,
          category: component.category,
          description: component.description,
          intent: component.intent,
          contextUrl: component.contextUrl,
          ...(component.aiPrompt ? { aiPrompt: component.aiPrompt } : {}),
          ...(md ? { markdown: md } : {}),
        })
      } catch (e) {
        return error(`Context bundle unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
  )

  server.registerTool(
    'select_component',
    {
      title: 'Select component',
      description:
        'Heuristic ranking of cascade components by natural language need. Returns top matches with scores and reasons. Note: heuristic ranking, not a model call.',
      inputSchema: {
        need: z.string().describe('Natural language description of what the component should do'),
      },
    },
    async ({ need }) => {
      try {
        const ctx = await loadContext(fetchFn)
        const results = selectComponent(need, ctx.components)
        return json({
          note: 'Heuristic ranking — not a model call. Verify with get_context before using.',
          results,
        })
      } catch (e) {
        return error(`Context bundle unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
  )

  return server
}
