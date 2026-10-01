/**
 * Example apps published as starters: a self-contained copy of `apps/examples/<app>` under
 * `starters/<name>/`, so the "Deploy to Cloudflare" button can deploy it from GitHub.
 *
 * The button clones only the starter's directory and runs `npm install` there, so the copy
 * can have no workspace links, no `catalog:` versions and no paths into `packages/`. The
 * app's source (`src/`, `worker/`, `public/`, `index.html`) is copied byte for byte; only
 * the build setup is rewritten — the same shape `cascivo create --framework cloudflare`
 * writes: `vite` with `@preact/preset-vite` and `@cloudflare/vite-plugin`, exact cascivo
 * versions, and a standalone tsconfig.
 *
 * Generated, never edited by hand: `pnpm starters:generate` rewrites it and
 * `scripts/checks/starters.test.ts` fails when the copy and the app disagree.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readTree, REPO_ROOT, STARTER_PNPM_WORKSPACE } from './starters.ts'
import type { StarterCard } from './starters.ts'

export interface ExampleStarter {
  /** Directory under starters/. */
  name: string
  /** Directory under apps/examples/. */
  app: string
  /** One line for the README and package.json. */
  description: string
  /** Shown by the Deploy to Cloudflare flow next to each binding. */
  bindings: Record<string, string>
  card: StarterCard
}

export const EXAMPLE_STARTERS: ExampleStarter[] = [
  {
    name: 'stage',
    app: 'stage',
    description: 'Live Q&A and polls for talks, on Cloudflare Durable Objects, built with cascivo',
    bindings: {
      STAGES:
        'One Durable Object per session: its questions, polls and votes, and every open socket. Created for you.',
      CREATE_LIMIT:
        'Rate limit on starting sessions, per IP (10 a minute). Change `simple.limit` in `wrangler.jsonc`.',
    },
    card: {
      title: 'Stage: live Q&A',
      summary:
        'Questions, polls and reactions for talks, with a projector view. One Durable Object per session.',
      waitsFor: 'use-signal-state.md',
    },
  },
]

/** Third-party versions, kept equal to what `cascivo create --framework cloudflare` pins. */
const TOOLING = {
  '@babel/core': '^7.0.0',
  '@cloudflare/vite-plugin': '^1.62.0',
  '@preact/preset-vite': '^2.10.0',
  '@types/react': '^19.0.0',
  '@types/react-dom': '^19.0.0',
  react: '^19.0.0',
  'react-dom': '^19.0.0',
  typescript: '^5.7.0',
  vite: '^8.0.0',
  wrangler: '^4.143.0',
} as const

/** What is copied as is: the page, its static files, and all source except tests. */
const COPIED_DIRS = ['public', 'src', 'worker']
const TEST = /\.test\.tsx?$/

function readJson(path: string): Record<string, unknown> {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (typeof raw !== 'object' || raw === null) throw new Error(`${path} is not a JSON object`)
  return raw as Record<string, unknown>
}

function dependencies(pkg: Record<string, unknown>, field: string): Record<string, string> {
  const value = pkg[field]
  if (typeof value !== 'object' || value === null) return {}
  const out: Record<string, string> = {}
  for (const [name, spec] of Object.entries(value)) {
    if (typeof spec === 'string') out[name] = spec
  }
  return out
}

/** `workspace:*` becomes the package's exact version; the rest must already be npm ranges. */
function resolveDependencies(app: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, spec] of Object.entries(dependencies(app, 'dependencies'))) {
    if (name.startsWith('@cascivo/')) {
      const dir = name.slice('@cascivo/'.length)
      const version = readJson(join(REPO_ROOT, 'packages', dir, 'package.json'))['version']
      if (typeof version !== 'string') throw new Error(`packages/${dir} has no version`)
      out[name] = version
    } else if (name === 'preact') {
      out[name] = '^10.29.0'
    } else if (name === '@preact/signals-react') {
      out[name] = '>=3.0.0'
    } else {
      throw new Error(`No npm version rule for "${name}" (${spec}) in scripts/starters/examples.ts`)
    }
  }
  return out
}

/** The app's wrangler.jsonc without its repo-specific header and assets directory. */
function wrangler(source: string): string {
  const start = source.indexOf('{')
  const body = source.slice(start)
  const directory = /\n\s*"directory": "\.\/dist",\n/
  if (!directory.test(body)) {
    throw new Error('wrangler.jsonc: expected an assets "directory" line to remove')
  }
  return (
    '// Cloudflare deploy config. `npm run deploy` builds and ships the app and its Worker\n' +
    '// together; @cloudflare/vite-plugin runs the same Worker, Durable Objects included,\n' +
    '// inside `npm run dev`. https://developers.cloudflare.com/workers/wrangler/configuration/\n' +
    body.replace(directory, '\n')
  )
}

const VITE_CONFIG = `import preact from '@preact/preset-vite'
import { cascivoRoutes } from '@cascivo/app/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

// The source is written against React's types; @preact/preset-vite aliases react and
// react-dom to preact/compat, so the bundle runs on Preact. To run on React instead, swap
// this plugin for @vitejs/plugin-react — no source changes.
//
// cascivoRoutes() writes src/routes.gen.ts from src/routes/ — one file per page.
// cloudflare() runs worker/index.ts (and its Durable Object) in workerd during \`vite dev\`
// and builds it with the client. Request routing is in wrangler.jsonc.
export default defineConfig({
  plugins: [preact(), cascivoRoutes(), cloudflare()],
})
`

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2022',
    useDefineForClassFields: true,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    moduleDetection: 'force',
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
  },
  include: ['src', 'worker'],
}

const VITE_ENV = `/// <reference types="vite/client" />\n`

const GITIGNORE = `node_modules
dist
.wrangler
.dev.vars
`

/** The Deploy to Cloudflare link for `starters/<name>`. */
export function deployUrl(name: string): string {
  return `https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/${name}`
}

function readme(starter: ExampleStarter, title: string): string {
  return `# ${title}

${starter.description}.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](${deployUrl(starter.name)})

This is a copy of [\`apps/examples/${starter.app}\`](https://github.com/cascivo/cascivo/tree/main/apps/examples/${starter.app}),
made to run on its own: the Deploy button clones this directory into your GitHub account,
creates the Durable Object and deploys it to your Cloudflare account. Nothing else needs setting up.

\`\`\`sh
npm install
npm run dev      # the app and its Worker, Durable Objects included, on http://localhost:5173
npm run deploy   # build and deploy to your Cloudflare account (runs \`wrangler login\` if needed)
\`\`\`

To start from this directory without the button:

\`\`\`sh
npm create cloudflare@latest my-${starter.name} -- --template cascivo/cascivo/starters/${starter.name}
\`\`\`

See the app's README for how it works. This directory is generated by
\`scripts/starters/examples.ts\` in the cascivo repository; change the app there, not here.
`
}

/** Every file of the example's standalone copy, keyed by path. */
export function buildExampleStarter(starter: ExampleStarter): Map<string, string> {
  const appDir = join(REPO_ROOT, 'apps/examples', starter.app)
  const app = readJson(join(appDir, 'package.json'))
  const files = new Map<string, string>()

  files.set('index.html', readFileSync(join(appDir, 'index.html'), 'utf8'))
  for (const dir of COPIED_DIRS) {
    if (!existsSync(join(appDir, dir))) continue
    for (const [path, contents] of readTree(join(appDir, dir))) {
      if (!TEST.test(path)) files.set(`${dir}/${path}`, contents)
    }
  }

  const workerName = `cascivo-${starter.name}`
  const pkg = {
    name: workerName,
    private: true,
    version: '0.0.0',
    description: starter.description,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      deploy: 'npm run build && wrangler deploy',
      typecheck: 'tsc --noEmit',
    },
    dependencies: resolveDependencies(app),
    devDependencies: TOOLING,
    cloudflare: {
      bindings: Object.fromEntries(
        Object.entries(starter.bindings).map(([name, description]) => [name, { description }]),
      ),
    },
  }
  files.set('package.json', JSON.stringify(pkg, null, 2) + '\n')
  files.set('vite.config.ts', VITE_CONFIG)
  files.set('tsconfig.json', JSON.stringify(TSCONFIG, null, 2) + '\n')
  files.set('src/vite-env.d.ts', VITE_ENV)
  files.set('.gitignore', GITIGNORE)
  files.set('pnpm-workspace.yaml', STARTER_PNPM_WORKSPACE)
  files.set('wrangler.jsonc', wrangler(readFileSync(join(appDir, 'wrangler.jsonc'), 'utf8')))

  const title = /<title>([^<]+)<\/title>/.exec(files.get('index.html') ?? '')?.[1] ?? workerName
  files.set('README.md', readme(starter, title.replace(/&amp;/g, '&')))
  return files
}
