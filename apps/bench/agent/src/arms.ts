/**
 * The two surfaces being compared. Both get the same MCP server, the same file tools and the
 * same prompt; the blueprint tools are what differs.
 *
 * - `today`: the agent scaffolds a shell (`create_app`) and writes every page as TSX, which is
 *   how an agent built an app with cascivo before blueprints.
 * - `blueprints`: the agent also has `list_blocks` and `compose_app`, and can describe the app
 *   as pages of registry blocks.
 */
export type ArmId = 'today' | 'blueprints'

export const ARMS: readonly ArmId[] = ['today', 'blueprints']

const BLUEPRINT_TOOLS = ['mcp__cascivo__compose_app', 'mcp__cascivo__list_blocks']

/** File tools both arms get. No Bash: an agent that installs or runs servers is not comparable. */
const FILE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep']

export function isArm(value: string): value is ArmId {
  return (ARMS as readonly string[]).includes(value)
}

/** The `claude -p` arguments for one run, minus the prompt itself. */
export function claudeArgs(arm: ArmId, mcpConfig: string, model: string | null): string[] {
  return [
    '--output-format',
    'json',
    // No user or project settings, hooks or CLAUDE.md: the run sees only what this harness gives it.
    '--bare',
    '--strict-mcp-config',
    '--mcp-config',
    mcpConfig,
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    ['mcp__cascivo__*', ...FILE_TOOLS].join(','),
    ...(arm === 'today' ? ['--disallowedTools', BLUEPRINT_TOOLS.join(',')] : []),
    ...(model ? ['--model', model] : []),
  ]
}
