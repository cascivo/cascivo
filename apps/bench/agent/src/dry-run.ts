/**
 * A scripted stand-in for the agent, for checking the harness without a model or an API key:
 * each arm's tool call is made directly with the app this prompt would plausibly become. The
 * scaffold, the dependency link, `tsc` and the audit all run for real, so a dry run proves the
 * pipeline end to end; it measures nothing about a model.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ArmId } from './arms.ts'
import { CLI } from './env.ts'

const PAGES: Record<string, { title: string; block?: string }[]> = {
  'admin-console': [
    { title: 'Overview', block: 'dashboard-overview' },
    { title: 'Users', block: 'users-table-page' },
    { title: 'Settings', block: 'settings-profile' },
  ],
  'saas-settings': [
    { title: 'Profile', block: 'settings-profile' },
    { title: 'Billing', block: 'pricing' },
    { title: 'Notifications', block: 'settings-form-page' },
  ],
  'marketing-site': [
    { title: 'Home', block: 'marketing-hero' },
    { title: 'Features', block: 'marketing-features' },
    { title: 'Pricing', block: 'pricing' },
    { title: 'Customers', block: 'testimonials' },
    { title: 'FAQ', block: 'faq' },
  ],
  'crud-table': [{ title: 'Projects', block: 'dashboard-table' }],
  'auth-flow': [
    { title: 'Sign in', block: 'auth-login' },
    { title: 'Sign up', block: 'auth-signup' },
    { title: 'Dashboard', block: 'dashboard-overview' },
  ],
}

export function dryRun(prompt: string, arm: ArmId, dir: string): void {
  const pages = PAGES[prompt]
  if (!pages) throw new Error(`no dry-run plan for prompt "${prompt}"`)
  if (arm === 'today') {
    // What `create_app` gives the agent before it writes any page: the shell and placeholders.
    const sections = pages.map((p) => p.title).join(',')
    execFileSync('node', [CLI, 'create', 'app', '--yes', '--sections', sections], {
      cwd: dir,
      stdio: 'pipe',
    })
    return
  }
  writeFileSync(join(dir, 'cascivo.app.json'), JSON.stringify({ name: 'app', pages }))
  execFileSync('node', [CLI, 'create', '--from', 'cascivo.app.json'], { cwd: dir, stdio: 'pipe' })
}
