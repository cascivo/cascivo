/**
 * `lint_email` — the CLI's `cascivo email lint`, for an agent.
 *
 * Delegated rather than reimplemented, like `add_to_project`: one implementation behind both
 * surfaces is the only way the two cannot disagree about whether an email is sendable. It
 * also keeps `@cascivo/email` — and the React it renders with — out of this server's install.
 * The CLI loads `@cascivo/email` from the project, so `cwd` has to be one that has it.
 */
import { spawnSync } from 'node:child_process'

export interface LintEmailInput {
  html: string
  checkLinks?: boolean
  cwd?: string
}

export interface LintEmailResult {
  /** True when nothing blocked: no unsupported feature and no link that cannot work. */
  passed: boolean
  report: string
}

type Spawn = (
  command: string,
  args: string[],
  options: { encoding: 'utf8'; input: string; cwd?: string },
) => { status: number | null; stdout: string; stderr: string; error?: Error }

/** The summary line the CLI prints last, e.g. `1 file, 2 blocked, 0 caveats.` */
const SUMMARY = /\d+ files?, \d+ blocked, \d+ caveats?\./

/**
 * Lint rendered email HTML; throw only when the lint itself could not run.
 *
 * The CLI exits 1 for "this email has blocked findings" and for "I could not run" alike, so
 * the summary line decides which: a report means the lint ran, whatever its verdict.
 */
export function lintEmail(
  { html, checkLinks = false, cwd }: LintEmailInput,
  spawn: Spawn = spawnSync as unknown as Spawn,
): LintEmailResult {
  const args = ['-y', 'cascivo', 'email', 'lint', '-', ...(checkLinks ? ['--check-links'] : [])]
  const result = spawn('npx', args, { encoding: 'utf8', input: html, ...(cwd ? { cwd } : {}) })
  const report = (result.stdout ?? '').trim()
  if (!SUMMARY.test(report)) {
    throw new Error(
      (result.stderr ?? '').trim() ||
        result.error?.message ||
        'cascivo email lint produced no report.',
    )
  }
  return { passed: result.status === 0, report }
}
