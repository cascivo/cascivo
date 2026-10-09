/**
 * The five fixed tasks (2026-10-07 research, §6). Each names a whole screen an adopter would
 * ask an agent for, not a component, because the claim under test is about building apps.
 * Change a prompt and the results before it stop being comparable: add one instead.
 */
export interface BenchPrompt {
  id: string
  text: string
}

export const PROMPTS: readonly BenchPrompt[] = [
  {
    id: 'admin-console',
    text:
      'Build an admin console: an overview page with KPI stats, a users table, and a ' +
      'settings page, with a side navigation between them.',
  },
  {
    id: 'saas-settings',
    text:
      'Build the settings area of a SaaS product: profile, billing and notification ' +
      'preferences, each on its own page.',
  },
  {
    id: 'marketing-site',
    text:
      'Build a marketing site for a developer tool: a hero, a features section, pricing, ' +
      'testimonials, an FAQ and a footer.',
  },
  {
    id: 'crud-table',
    text:
      'Build a page that lists projects in a table with search and pagination, and lets ' +
      'the user create a project.',
  },
  {
    id: 'auth-flow',
    text: 'Build a sign-in page and a sign-up page for a web app, with a dashboard after login.',
  },
]

/**
 * What every run is told beyond the task, identical across arms so the only variable is the
 * tools. The app has to land where the scorer looks for it, and installing is the harness's
 * job: an install inside the run would be timed as the agent's work.
 */
export const INSTRUCTIONS =
  'Use the cascivo design system. Create a React + Vite app in this directory with the ' +
  'cascivo MCP tools, then write whatever else the task needs. Do not install dependencies ' +
  'and do not start a dev server. Stop when the app is complete.'
