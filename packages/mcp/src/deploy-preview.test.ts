import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deployPreview, parseDeployOutput } from './deploy-preview.js'

// Real `wrangler deploy --temporary` output (wrangler 4.143), trimmed.
const OUTPUT = `Solving proof-of-work challenge…
Temporary account ready:
	Account: Terrific Teal (created)
	Claim within: 60 minutes
	Claim URL: https://dash.cloudflare.com/claim-preview?claimToken=abc_DEF-123
✨ Success! Uploaded 11 files (1.41 sec)
Uploaded edge-app (3.98 sec)
Deployed edge-app triggers (0.75 sec)
  https://edge-app.terrific-teal.workers.dev
Current Version ID: 040ff45d-dbe9-4fe1-a0f3-ada5a18379dd`

let dir: string | undefined
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = undefined
})

function project(scripts: Record<string, string>): string {
  dir = mkdtempSync(join(tmpdir(), 'deploy-preview-'))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts }))
  return dir
}

describe('parseDeployOutput', () => {
  it('finds the live URL and the claim URL', () => {
    expect(parseDeployOutput(OUTPUT)).toEqual({
      url: 'https://edge-app.terrific-teal.workers.dev',
      claimUrl: 'https://dash.cloudflare.com/claim-preview?claimToken=abc_DEF-123',
    })
  })

  it('reports nulls when nothing was printed', () => {
    expect(parseDeployOutput('nothing here')).toEqual({ url: null, claimUrl: null })
  })
})

describe('deployPreview', () => {
  it('runs the deploy:preview script and returns both links', () => {
    const cwd = project({ 'deploy:preview': 'npm run build && wrangler deploy --temporary' })
    const run = vi.fn(() => ({ status: 0, stdout: OUTPUT, stderr: '' }))
    const result = deployPreview(cwd, run)
    expect(run).toHaveBeenCalledWith('npm', ['run', 'deploy:preview'], { cwd, encoding: 'utf8' })
    expect(result.url).toBe('https://edge-app.terrific-teal.workers.dev')
    expect(result.claimUrl).toContain('claimToken=')
  })

  it('points a static app at Cloudflare Drop instead', () => {
    const cwd = project({ build: 'vite build' })
    expect(() => deployPreview(cwd, vi.fn())).toThrow('https://www.cloudflare.com/drop/')
  })

  it('explains the logged-in case, which --temporary refuses', () => {
    const cwd = project({ 'deploy:preview': 'x' })
    const run = vi.fn(() => ({
      status: 1,
      stdout: '',
      // wrangler 4.143's exact wording.
      stderr:
        "X [ERROR] You're already authenticated with Cloudflare, so `--temporary` can't be used.",
    }))
    expect(() => deployPreview(cwd, run)).toThrow('npx wrangler logout')
  })

  it('fails clearly outside a project', () => {
    dir = mkdtempSync(join(tmpdir(), 'deploy-preview-'))
    expect(() => deployPreview(dir!, vi.fn())).toThrow('No package.json')
  })
})
