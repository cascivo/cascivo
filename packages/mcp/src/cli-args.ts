// Command lines the MCP tools hand to the cascivo CLI. Kept apart from server.ts so the
// mapping from tool input to argv is testable without spawning anything.

/** The first-party themes `cascivo create --theme` accepts. `cli-args.test.ts` keeps this equal to the CLI's list. */
export const THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
] as const

export interface CreateAppInput {
  name: string
  theme?: string | undefined
  sections?: string[] | undefined
  framework?: string | undefined
  runtime?: string | undefined
  examples?: string[] | undefined
  auth?: string | undefined
  template?: string | undefined
  workspace?: boolean | undefined
}

/**
 * A model-supplied value that starts with `-` would be read by the CLI as a flag, not as the
 * name or spec it was meant to be.
 */
function assertNotFlag(value: string, what: string): void {
  if (value.startsWith('-')) throw new Error(`${what} "${value}" must not start with "-".`)
}

export function createAppArgs(input: CreateAppInput): string[] {
  assertNotFlag(input.name, 'Project name')
  const args = ['-y', 'cascivo', 'create', input.name, '--yes']
  if (input.framework) args.push('--framework', input.framework)
  if (input.runtime) args.push('--runtime', input.runtime)
  if (input.examples && input.examples.length > 0) args.push('--example', input.examples.join(','))
  if (input.auth) args.push('--auth', input.auth)
  if (input.theme) args.push('--theme', input.theme)
  if (input.sections && input.sections.length > 0) {
    args.push('--sections', input.sections.join(', '))
  }
  if (input.workspace) args.push('--workspace')
  if (input.template) {
    assertNotFlag(input.template, 'Template')
    args.push('--template', input.template)
  }
  return args
}

export function addArgs(names: string[]): string[] {
  if (names.length === 0) throw new Error('Name at least one component to add.')
  for (const name of names) assertNotFlag(name, 'Component name')
  return ['-y', 'cascivo', 'add', ...names]
}
