import { formatJson } from '../commands/create.js'
import type { ScaffoldFile } from '../commands/create.js'

/**
 * `cascivo create --workspace`: the app inside a pnpm monorepo with the tooling a team would set
 * up next anyway. The app itself is the ordinary scaffold, moved to `apps/web`, so everything
 * `cascivo app` does keeps working from that directory.
 *
 * - `packages/ui`: the team's own components, imported by the app. Copying cascivo source to
 *   own it (`cascivo add`) happens here, so every app in the workspace shares one copy.
 * - Vite+ (`vp run`) runs each package's scripts across the workspace, in dependency order
 *   and cached.
 * - CI runs the same scripts on every push.
 */
export interface WorkspaceInput {
  /** The npm package name of the app; the workspace packages are scoped under it. */
  packageName: string
  /** The scaffold's files, as `cascivo create` writes them for a single app. */
  app: ScaffoldFile[]
  /** The first nav label, which the smoke test looks for. */
  firstLabel: string
  /** React + Vite apps get a component test setup; the cloudflare app tests its Worker itself. */
  testable: boolean
  /** The `@cascivo/react` version the app pins, for packages/ui. */
  reactVersion: string
}

// As Prettier prints it, so the app's own `format:check` passes on what it was given.
const json = formatJson

/** Keys of a package.json that JSON.parse returned, with `dependencies`-like maps narrowed. */
function parsePackageJson(contents: string): Record<string, unknown> {
  const raw: unknown = JSON.parse(contents)
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('cascivo: the scaffold wrote a package.json that is not an object')
  }
  return { ...raw }
}

function record(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

const ROOT_FILES = new Set(['.mcp.json'])

export function buildWorkspace(input: WorkspaceInput): ScaffoldFile[] {
  const scope = `@${input.packageName}`
  const ui = `${scope}/ui`
  const files: ScaffoldFile[] = []

  for (const file of input.app) {
    if (ROOT_FILES.has(file.path)) continue
    if (file.path === 'package.json') {
      const pkg = parsePackageJson(file.contents)
      const scripts = record(pkg.scripts)
      const devDependencies = record(pkg.devDependencies)
      files.push({
        path: 'apps/web/package.json',
        contents: json({
          ...pkg,
          name: `${scope}/web`,
          scripts: input.testable ? { ...scripts, test: 'vitest run' } : scripts,
          dependencies: { [ui]: 'workspace:*', ...record(pkg.dependencies) },
          devDependencies: input.testable
            ? {
                ...devDependencies,
                '@testing-library/react': '^16.3.0',
                jsdom: '^30.0.0',
                vitest: '^5.0.0',
              }
            : devDependencies,
        }),
      })
      continue
    }
    files.push({ path: `apps/web/${file.path}`, contents: file.contents })
  }

  if (input.testable) {
    files.push(
      {
        path: 'apps/web/vitest.config.ts',
        contents: `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'jsdom' },
})
`,
      },
      {
        path: 'apps/web/src/App.test.tsx',
        contents: `import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'

it('renders the app shell and its navigation', () => {
  render(<App />)
  expect(screen.getAllByText('${input.firstLabel.replace(/'/g, "\\'")}').length).toBeGreaterThan(0)
})
`,
      },
    )
  }

  files.push(
    {
      path: 'packages/ui/package.json',
      contents: json({
        name: ui,
        private: true,
        version: '0.0.0',
        type: 'module',
        exports: { '.': './src/index.ts' },
        scripts: { typecheck: 'tsc --noEmit' },
        dependencies: { '@cascivo/react': input.reactVersion },
        peerDependencies: { react: '>=18.0.0' },
        devDependencies: { '@types/react': '^19.0.0', typescript: '^5.7.0' },
      }),
    },
    {
      path: 'packages/ui/tsconfig.json',
      contents: json({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ['src'],
      }),
    },
    {
      path: 'packages/ui/src/index.ts',
      contents: `// The team's own components, shared by every app in the workspace. Build them from
// @cascivo/react, or copy a cascivo component here to own its source:
//   cd packages/ui && npx cascivo add <name>
// then export it below and import it in an app as \`import { … } from '${ui}'\`.
export {}
`,
    },
    {
      path: 'package.json',
      contents: json({
        name: input.packageName,
        private: true,
        type: 'module',
        scripts: {
          dev: 'pnpm --filter ./apps/web dev',
          build: 'vp run -r build',
          typecheck: 'vp run -r typecheck',
          lint: 'vp run -r lint',
          ...(input.testable ? { test: 'vp run -r test' } : {}),
          'format:check': 'vp run -r format:check',
        },
        devDependencies: { 'vite-plus': '^1.1.0' },
      }),
    },
    {
      path: 'pnpm-workspace.yaml',
      contents: `packages:
  - apps/*
  - packages/*
# Install scripts pnpm runs: esbuild fetches the binary Vite builds with, workerd is the
# Workers runtime. allowBuilds is pnpm 11's form, onlyBuiltDependencies pnpm 10's.
allowBuilds:
  esbuild: true
  workerd: true
onlyBuiltDependencies:
  - esbuild
  - workerd
`,
    },
    {
      path: 'vite.config.ts',
      contents: `// Vite+ configuration for the workspace: \`vp run\` caches each package's tasks.
import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: { cache: true },
})
`,
    },
    {
      path: '.gitignore',
      contents: 'node_modules\ndist\n.vite\n',
    },
    {
      path: '.github/workflows/ci.yml',
      contents: `name: CI

on:
  push:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
${input.testable ? '      - run: pnpm test\n' : ''}      - run: pnpm build
`,
    },
    {
      path: 'AGENTS.md',
      contents: `# Agent instructions — workspace

A pnpm workspace. Run every command from this directory unless a step says otherwise.

- \`apps/web\` is the app. Read \`apps/web/AGENTS.md\` before changing it. Grow it with
  \`npx cascivo app add page "<title>" --block <name>\`, run in \`apps/web\`.
- \`packages/ui\` (\`${ui}\`) holds the team's own components. Copy a cascivo component here to
  own its source (\`cd packages/ui && npx cascivo add <name>\`), and export it from
  \`src/index.ts\`.
- Checks: \`pnpm typecheck\`, \`pnpm lint\`,${input.testable ? ' `pnpm test`,' : ''} \`pnpm build\`. CI runs the same.
`,
    },
    { path: 'CLAUDE.md', contents: '@AGENTS.md\n' },
  )
  const mcp = input.app.find((f) => f.path === '.mcp.json')
  if (mcp) files.push(mcp)
  return files
}
