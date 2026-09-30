import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** What a temporary-account deploy printed that the user needs. */
export interface PreviewLinks {
  /** The live `workers.dev` URL. */
  url: string | null
  /** Opening this (and signing in) within 60 minutes keeps the deployment. */
  claimUrl: string | null
}

/** Pulls the live URL and the claim URL out of `wrangler deploy --temporary` output. */
export function parseDeployOutput(output: string): PreviewLinks {
  const claim = /Claim URL:\s*(https:\/\/\S+)/.exec(output)
  const live = /(https:\/\/[\w.-]+\.workers\.dev)\b/.exec(output)
  return { url: live?.[1] ?? null, claimUrl: claim?.[1] ?? null }
}

type Run = (
  command: string,
  args: string[],
  options: { cwd: string; encoding: 'utf8' },
) => { status: number | null; stdout: string; stderr: string; error?: Error }

/**
 * Runs the app's `deploy:preview` script — `cascivo create --framework cloudflare` writes it
 * as a build followed by `wrangler deploy --temporary` — and returns the two URLs. Throws with
 * an actionable message when the project cannot be previewed this way.
 */
export function deployPreview(
  cwd: string,
  run: Run = spawnSync as unknown as Run,
): PreviewLinks & { output: string } {
  const manifest = join(cwd, 'package.json')
  if (!existsSync(manifest)) throw new Error(`No package.json in ${cwd}`)
  const raw: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
  const scripts =
    typeof raw === 'object' && raw !== null && 'scripts' in raw
      ? (raw as { scripts?: unknown }).scripts
      : undefined
  const hasScript = typeof scripts === 'object' && scripts !== null && 'deploy:preview' in scripts
  if (!hasScript) {
    throw new Error(
      'This project has no "deploy:preview" script. Apps from `cascivo create --framework cloudflare` ' +
        'have one. For a static build (the react-vite or astro scaffold), build it and drop dist/ ' +
        'on https://www.cloudflare.com/drop/ instead.',
    )
  }

  const result = run('npm', ['run', 'deploy:preview'], { cwd, encoding: 'utf8' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (result.status !== 0) {
    const loggedIn = /already authenticated with Cloudflare/i.test(output)
    throw new Error(
      (loggedIn
        ? 'wrangler is logged in, and --temporary only works without credentials. Run ' +
          '`npx wrangler logout` (and unset CLOUDFLARE_API_TOKEN), or deploy to your own account ' +
          'with `npm run deploy`.\n\n'
        : '') + (output.trim() || result.error?.message || 'deploy:preview failed'),
    )
  }
  return { ...parseDeployOutput(output), output }
}
