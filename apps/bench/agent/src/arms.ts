/**
 * The surfaces being compared. Every arm gets the same file tools and the same prompt; what
 * differs is the design system and the MCP server around it.
 *
 * - `today`: the agent scaffolds a shell (`create_app`) and writes every page as TSX, which is
 *   how an agent built an app with cascivo before blueprints. Internal comparison only.
 * - `cascivo`: the cascivo MCP server. In the legacy `bench` the agent also has `compose_app`
 *   and can describe the app as pages of registry blocks (the old `blueprints` arm); in the
 *   published eval it has only the server's read tools (CASCIVO_SAFE_TOOLS) and writes the app
 *   itself.
 * - `cascivo-bare`: a cascivo starter app and no MCP server, so the gap to `cascivo` is the
 *   value of cascivo's AI context.
 * - `shadcn`: a shadcn/ui + Tailwind starter and shadcn's official MCP server, the control.
 */
export type ArmId = 'today' | 'cascivo' | 'cascivo-bare' | 'shadcn'

export const ARMS: readonly ArmId[] = ['today', 'cascivo', 'cascivo-bare', 'shadcn']

/** The arms the legacy `bench` command can run: its harness only knows the cascivo MCP server. */
export const LEGACY_ARMS: readonly ArmId[] = ['today', 'cascivo']

export const PUBLISHED_ARMS = ['cascivo', 'cascivo-bare', 'shadcn'] as const

export type PublishedArmId = (typeof PUBLISHED_ARMS)[number]

/**
 * The cascivo MCP tools an eval session may call: each only reads (the registry, the bundled
 * catalogs and guides, or cascivo.com) or computes text from its arguments. The `generate` job
 * holds the API key, and a process anything there starts can read it from /proc, so no tool
 * the agent reaches may run a process or load code from the agent's directory.
 * `src/bench.test.ts` checks that this list and CASCIVO_EXECUTING_TOOLS cover every tool
 * `packages/mcp/src/server.ts` registers.
 */
export const CASCIVO_SAFE_TOOLS = [
  'list_registries',
  'list_components',
  'get_component',
  'search_components',
  'list_templates',
  'get_template',
  'list_blocks',
  'create_theme',
  'scaffold_page',
  'validate_view',
  'scaffold_view',
  'scaffold_flow',
  'get_view_grammar',
  'get_tokens',
  'search_icons',
  'get_variant_matrix',
  'validate_component',
  'list_guides',
  'get_guide',
  'get_context',
  'select_component',
] as const

/**
 * The cascivo MCP tools that run something: `npx cascivo` (add, create, compose, and the
 * installs they do), `npm run deploy:preview` in the agent's directory, `cascivo email lint`, or
 * an import of `@cascivo/render` from the agent's `node_modules`.
 */
export const CASCIVO_EXECUTING_TOOLS = [
  'add_to_project',
  'lint_email',
  'add_template',
  'create_app',
  'compose_app',
  'deploy_preview',
  'render_view_as_markdown',
] as const

/**
 * The shadcn@4.22.1 MCP tools that start no process: they read components.json and format
 * text. Checked under strace with GitHub-sourced registries configured.
 */
export const SHADCN_SAFE_TOOLS = [
  'get_project_registries',
  'get_add_command_for_items',
  'get_audit_checklist',
] as const

/**
 * The shadcn MCP tools that resolve registry items, which for a GitHub source (an
 * `owner/repo` the agent names, or puts in components.json) runs `git ls-remote` and `gh api`.
 */
export const SHADCN_EXECUTING_TOOLS = [
  'list_items_in_registries',
  'search_items_in_registries',
  'view_items_in_registries',
  'get_item_examples_from_registries',
] as const

const BLUEPRINT_TOOLS = ['mcp__cascivo__compose_app', 'mcp__cascivo__list_blocks']

/**
 * File tools every arm is allowed. With `--bare`, CLI 2.1.304 offers only `Read` and `Edit` of
 * these (and Bash, which `--restricted` removes); the others are allowed for a CLI that offers
 * them. No Bash: an agent that installs or runs servers is not comparable, and it would run
 * commands in the job that holds the key.
 */
const FILE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep']

const tools = (server: string, names: readonly string[]) =>
  names.map((name) => `mcp__${server}__${name}`)

export function isArm(value: string): value is ArmId {
  return (ARMS as readonly string[]).includes(value)
}

export function isLegacyArm(value: string): value is ArmId {
  return (LEGACY_ARMS as readonly string[]).includes(value)
}

/** The MCP tools an arm may call and the ones it must never be offered. */
function mcpTools(arm: ArmId, executingTools: boolean): { allow: string[]; deny: string[] } {
  switch (arm) {
    case 'cascivo-bare':
      return { allow: [], deny: [] }
    case 'shadcn':
      return {
        allow: tools('shadcn', SHADCN_SAFE_TOOLS),
        deny: tools('shadcn', SHADCN_EXECUTING_TOOLS),
      }
    case 'cascivo':
    case 'today': {
      const safe = tools('cascivo', CASCIVO_SAFE_TOOLS)
      const executing = tools('cascivo', CASCIVO_EXECUTING_TOOLS)
      const allow = executingTools ? [...safe, ...executing] : safe
      const deny = executingTools ? [] : executing
      if (arm === 'cascivo') return { allow, deny }
      return {
        allow: allow.filter((tool) => !BLUEPRINT_TOOLS.includes(tool)),
        deny: [...deny.filter((tool) => !BLUEPRINT_TOOLS.includes(tool)), ...BLUEPRINT_TOOLS],
      }
    }
  }
}

/**
 * The `claude -p` arguments for one run, minus the prompt itself.
 *
 * @param mcpConfig The MCP config file; null only for `cascivo-bare`, which has no server.
 * @param opts.stream Emit the whole transcript (`stream-json`) instead of one result object.
 * @param opts.executingTools Also allow the cascivo tools that run the cascivo CLI
 *   (`create_app`, `compose_app`, …). Only the legacy local `bench` sets it: its arms are built
 *   on those tools, and it never runs in the eval's `generate` job.
 */
export function claudeArgs(
  arm: ArmId,
  mcpConfig: string | null,
  model: string | null,
  opts?: { stream?: boolean; executingTools?: boolean },
): string[] {
  if (arm !== 'cascivo-bare' && mcpConfig === null)
    throw new Error(`arm ${arm} needs an MCP config`)
  const { allow, deny } = mcpTools(arm, opts?.executingTools ?? false)
  return [
    '--output-format',
    ...(opts?.stream ? ['stream-json', '--verbose'] : ['json']),
    // No user or project settings, hooks or CLAUDE.md: the run sees only what this harness gives it.
    '--bare',
    // Read and Edit only inside the working directory, never through a symlink out of it, and no
    // Bash (CLI 2.1.304, checked against a scripted API).
    '--restricted',
    // Without a config, strict mode is what keeps ambient servers out of cascivo-bare.
    '--strict-mcp-config',
    ...(arm === 'cascivo-bare' || mcpConfig === null ? [] : ['--mcp-config', mcpConfig]),
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    [...allow, ...FILE_TOOLS].join(','),
    // Denied as well as left out of the allowlist: a deny rule wins over any allow, and the
    // model is never offered the tool.
    '--disallowedTools',
    [...deny, 'Bash'].join(','),
    ...(model ? ['--model', model] : []),
  ]
}
