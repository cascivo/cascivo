// Assemble the five v21 demo apps into the landing's build output (roadmap v22).
//
// Each demo is a standalone Vite SPA built with `base: './'` (relative asset
// URLs), so its `dist/` can be served unchanged from any sub-path. This script
// copies each demo's built `dist/` into `apps/site/dist/demos/<slug>/`, so a
// single Cloudflare Pages deploy of the landing serves the homepage, the
// `/examples/*` marketing pages, AND every live demo under `/demos/<slug>/`.
//
// Usage:
//   node scripts/assemble-demos.mjs            # copy already-built demos
//   node scripts/assemble-demos.mjs --build    # build each demo first, then copy
//
// The landing itself must already be built (so `apps/site/dist/` exists);
// the `build:landing-demos` root script enforces that ordering.

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

/** slug → package name. The slug is also the served sub-path: /demos/<slug>/. */
const DEMOS = {
  deploy: '@cascivo/example-deploy',
  pay: '@cascivo/example-pay',
  flow: '@cascivo/example-flow',
  track: '@cascivo/example-track',
  pulse: '@cascivo/example-pulse',
  trade: '@cascivo/example-trade',
}

const shouldBuild = process.argv.includes('--build')

const landingDist = resolve(root, 'apps/site/dist')
if (!existsSync(landingDist)) {
  console.error(
    `[assemble-demos] ${landingDist} does not exist — build the landing first (pnpm build:landing-demos).`,
  )
  process.exit(1)
}

// Live demos mount under /demos/<slug>/ — deliberately NOT /examples/<slug>/,
// which is reserved for the landing's prerendered marketing pages (v22).
const demosRoot = resolve(landingDist, 'demos')

for (const [slug, pkg] of Object.entries(DEMOS)) {
  const demoDir = resolve(root, 'apps/examples', slug)
  const demoDist = resolve(demoDir, 'dist')

  if (shouldBuild) {
    console.log(`[assemble-demos] building ${pkg} …`)
    execFileSync('pnpm', ['exec', 'vp', 'run', `${pkg}#build`], {
      cwd: root,
      stdio: 'inherit',
    })
  }

  if (!existsSync(demoDist)) {
    console.error(
      `[assemble-demos] ${demoDist} is missing — run with --build or build ${pkg} first.`,
    )
    process.exit(1)
  }

  const target = resolve(demosRoot, slug)
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  cpSync(demoDist, target, { recursive: true })
  console.log(`[assemble-demos] ${slug} → apps/site/dist/demos/${slug}/`)
}

console.log(
  `[assemble-demos] done — ${Object.keys(DEMOS).length} demos assembled into the landing.`,
)
