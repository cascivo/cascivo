/**
 * The surfaces being compared. Every arm gets the same file tools and the same prompt; what
 * differs is the design system and the MCP server around it.
 *
 * - `today`: the agent scaffolds a shell (`create_app`) and writes every page as TSX, which is
 *   how an agent built an app with cascivo before blueprints. Internal comparison only.
 * - `cascivo`: the agent also has `list_blocks` and `compose_app`, and can describe the app
 *   as pages of registry blocks. This was the `blueprints` arm before the published eval.
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

const BLUEPRINT_TOOLS = ['mcp__cascivo__compose_app', 'mcp__cascivo__list_blocks']

/** File tools every arm gets. No Bash: an agent that installs or runs servers is not comparable. */
const FILE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep']

export function isArm(value: string): value is ArmId {
  return (ARMS as readonly string[]).includes(value)
}

export function isLegacyArm(value: string): value is ArmId {
  return (LEGACY_ARMS as readonly string[]).includes(value)
}

/**
 * The `claude -p` arguments for one run, minus the prompt itself.
 *
 * @param mcpConfig The MCP config file; null only for `cascivo-bare`, which has no server.
 * @param opts.stream Emit the whole transcript (`stream-json`) instead of one result object.
 */
export function claudeArgs(
  arm: ArmId,
  mcpConfig: string | null,
  model: string | null,
  opts?: { stream?: boolean },
): string[] {
  if (arm !== 'cascivo-bare' && mcpConfig === null)
    throw new Error(`arm ${arm} needs an MCP config`)
  const server = arm === 'shadcn' ? 'shadcn' : 'cascivo'
  return [
    '--output-format',
    ...(opts?.stream ? ['stream-json', '--verbose'] : ['json']),
    // No user or project settings, hooks or CLAUDE.md: the run sees only what this harness gives it.
    '--bare',
    // Without a config, strict mode is what keeps ambient servers out of cascivo-bare.
    '--strict-mcp-config',
    ...(arm === 'cascivo-bare' || mcpConfig === null ? [] : ['--mcp-config', mcpConfig]),
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    [...(arm === 'cascivo-bare' ? [] : [`mcp__${server}__*`]), ...FILE_TOOLS].join(','),
    ...(arm === 'today' ? ['--disallowedTools', BLUEPRINT_TOOLS.join(',')] : []),
    ...(model ? ['--model', model] : []),
  ]
}
