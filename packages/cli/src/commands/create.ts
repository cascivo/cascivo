import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import {
  detectPackageManager,
  THEMES,
  type PackageManager,
  type ThemeName,
} from '../utils/config.js'
import { flagValue, positionalArgs, resolvePackageManagerFlag } from '../utils/args.js'
import { writeFileSafe } from '../utils/fs.js'
import { CASCIVO_VERSIONS, SIGNALS_PEER } from '../generated/versions.js'
// Bundled into the CLI (a devDependency): the scaffold writes the same routes.gen.ts the
// app's own Vite plugin will, so the two cannot drift.
import { generateRoutes } from '@cascivo/app/vite'
import { loadRecipe, recipeFiles } from '../scaffold/recipes.js'

/**
 * Exact published versions, baked in at build time by `scripts/registry/cli-versions.ts`.
 *
 * This used to be the literal `'latest'` for every cascivo dependency — the loosest
 * possible specifier on a set of independently-versioned 0.x packages, and the direct
 * opposite of GETTING-STARTED.md's "pin **exact** versions (no `^`)". A scaffold that
 * contradicts the docs on the very first file an adopter opens undermines every other rule
 * those docs state, so the pins are generated rather than hand-written.
 */
const V = CASCIVO_VERSIONS

/** Install-everything command for a package manager (`pnpm install`, `yarn`, …). */
function installAllCommand(pm: PackageManager): string {
  return pm === 'yarn' ? 'yarn' : `${pm} install`
}

/** Run-a-script command for a package manager (`npm run dev` vs `pnpm dev`). */
function runScriptCommand(pm: PackageManager, script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`
}

/**
 * Like `runScriptCommand`, but always through `run`. A script named after a built-in
 * command needs it: `pnpm deploy` is pnpm's own workspace deploy, not the `deploy` script.
 */
function runExplicitCommand(pm: PackageManager, script: string): string {
  return `${pm} run ${script}`
}

/** Project shape `create` emits. */
export type Framework = 'react-vite' | 'astro' | 'cloudflare'

export const FRAMEWORKS = ['react-vite', 'astro', 'cloudflare'] as const

/** Client runtime for `--framework cloudflare`. The source is identical for both. */
export type Runtime = 'preact' | 'react'

export const RUNTIMES = ['preact', 'react'] as const

/** Optional demo pages for `--framework cloudflare`. */
export type Example =
  | 'board'
  | 'agent'
  | 'notes'
  | 'import'
  | 'files'
  | 'export'
  | 'usage'
  | 'crud'
  | 'live'
  | 'voice'
  | 'publish'
  | 'webhooks'
  | 'digest'
  | 'search'
  | 'checkout'
  | 'newsletter'
  | 'social'

export const EXAMPLES = [
  'board',
  'agent',
  'notes',
  'import',
  'files',
  'export',
  'usage',
  'crud',
  'live',
  'voice',
  'publish',
  'webhooks',
  'digest',
  'search',
  'checkout',
  'newsletter',
  'social',
] as const

function isExample(value: string): value is Example {
  return (EXAMPLES as readonly string[]).includes(value)
}

function isRuntime(value: string): value is Runtime {
  return (RUNTIMES as readonly string[]).includes(value)
}

export interface ScaffoldOptions {
  /** Project directory + package name. */
  name: string
  /** Project shape. Defaults to `react-vite`. */
  framework?: Framework
  /** Theme imported in the entry CSS and set on `<html data-theme>`. */
  theme: ThemeName
  /** Display labels for the side-nav sections (one section component each). */
  sections: string[]
  /** Package manager for the generated README's commands (default npm). */
  pm?: PackageManager
  /**
   * Client runtime for the `cloudflare` framework. Defaults to `preact`, or `react` with the
   * `agent` example, whose Agents SDK hooks need React (see {@link runtimeOf}).
   */
  runtime?: Runtime
  /** Extra demo pages for the `cloudflare` framework. */
  examples?: Example[]
  /**
   * `cloudflare` framework only. `access`: the Worker refuses every request Cloudflare Access
   * did not let through. `email`: accounts with emailed sign-in links; `oauth`: accounts with
   * GitHub, Google and LinkedIn sign-in; `email,oauth`: both on one page. With accounts, every API write
   * needs a signed-in user.
   */
  auth?: Auth
}

export type Auth = 'access' | 'email' | 'oauth' | 'email,oauth'

export interface ScaffoldFile {
  /** Path relative to the project root. */
  path: string
  contents: string
}

interface Section {
  /** Discriminant used in the section signal + conditional render. */
  key: string
  /** Human-readable label shown in the nav and section heading. */
  label: string
  /** PascalCase component + file name. */
  component: string
}

/** Slug suitable for a union-member string literal: lower-kebab, alnum only. */
function slug(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  )
}

/** PascalCase identifier derived from a free-text label. */
function pascalCase(label: string): string {
  const parts = label
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
  const joined = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const safe = joined || 'Section'
  return /^[0-9]/.test(safe) ? `Section${safe}` : safe
}

/**
 * Short, human-readable brand for the shell header.
 *
 * The directory name is the wrong thing to render verbatim: a dated demo directory
 * (`vercel-dashboard-2026-07-30-take2`) produced a 45-character brand in the top-left of
 * every page. Take the leading words, title-case them, and stop — a brand is a label, not a
 * slug. Bare numbers and `v2`-style segments are dropped rather than counted.
 */
export function brandName(name: string): string {
  const words = name
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w !== '' && !/^\d+$/.test(w) && !/^v\d+$/i.test(w))
  const kept: string[] = []
  for (const word of words) {
    if (kept.length >= 3) break
    if (kept.length > 0 && kept.join(' ').length + 1 + word.length > 24) break
    kept.push(word.charAt(0).toUpperCase() + word.slice(1))
  }
  return kept.join(' ') || 'App'
}

/** Normalize the project name into a valid npm package name. */
function packageName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cascivo-app'
  )
}

/** Turn raw section labels into unique keyed/component-named sections. */
function resolveSections(labels: string[]): Section[] {
  const seenKeys = new Set<string>()
  const seenComponents = new Set<string>()
  const sections: Section[] = []
  for (const label of labels) {
    const trimmed = label.trim()
    if (!trimmed) continue
    let key = slug(trimmed)
    let component = pascalCase(trimmed)
    let n = 2
    while (seenKeys.has(key) || seenComponents.has(component)) {
      key = `${slug(trimmed)}-${n}`
      component = `${pascalCase(trimmed)}${n}`
      n++
    }
    seenKeys.add(key)
    seenComponents.add(component)
    sections.push({ key, label: trimmed, component })
  }
  return sections.length > 0 ? sections : [{ key: 'home', label: 'Home', component: 'Home' }]
}

function packageJson(opts: ScaffoldOptions): string {
  const pkg = {
    name: packageName(opts.name),
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      typecheck: 'tsc --noEmit',
      lint: 'eslint .',
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
    },
    // Prebuilt path (Path B): `@cascivo/react` and `@cascivo/themes` only.
    //
    // `@cascivo/core` and `@cascivo/tokens` are deliberately absent. AI-RULES.md: "**Never**
    // add `@cascivo/core` to a prebuilt-path app's package.json — it is only a transitive
    // dependency there, and everything is re-exported from `@cascivo/react`."
    // GETTING-STARTED.md says the same of `@cascivo/tokens`, which arrives with
    // `@cascivo/themes` as a direct dependency. The scaffold used to declare both and then
    // import from them, so it violated two documented rules and taught the pattern by example.
    //
    // `@preact/signals-react` IS declared: it is a required peer that the generated
    // `App.tsx` calls into via `useSignals()`. It used to be omitted entirely and survived
    // only by hoisting — a phantom dependency that breaks under pnpm's strict layout.
    dependencies: {
      '@cascivo/react': V['@cascivo/react']!,
      '@cascivo/themes': V['@cascivo/themes']!,
      '@preact/signals-react': SIGNALS_PEER,
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@cascivo/eslint-config': V['@cascivo/eslint-config']!,
      '@eslint/js': '^9.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^5.0.0',
      eslint: '^9.0.0',
      'eslint-plugin-react-hooks': '^7.0.0',
      prettier: '^3.0.0',
      typescript: '^5.7.0',
      // Registers the TypeScript parser AND the `files` patterns that make ESLint look at
      // .ts/.tsx at all. Without it ESLint 9's default `files` is **/*.{js,cjs,mjs}, so
      // `lint` on a TypeScript-only app exits 0 having inspected zero files — a green check
      // that proves nothing (2026-08-08 report B).
      'typescript-eslint': '^8.0.0',
      vite: '^7.0.0',
    },
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

/**
 * JSON as Prettier prints it: an array of strings stays on one line. `JSON.stringify` breaks
 * every array across lines, so a fresh app failed its own `format:check` on tsconfig.json.
 */
function formatJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2).replace(
    /\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s*\]/g,
    (_, items: string) => `[${items.split(/,\n\s+/).join(', ')}]`,
  )
  return json + '\n'
}

function tsconfig(): string {
  const cfg = {
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
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
  }
  return formatJson(cfg)
}

function viteConfig(): string {
  return `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
})
`
}

function indexHtml(opts: ScaffoldOptions): string {
  return `<!doctype html>
<html lang="en" data-theme="${opts.theme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName(opts.name)}</title>
    <style>
      @layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component,
        cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.example, cascivo.override;
      /* cascivo.example is this app's own slot — above the component/blocks layers so your
         styles win, below cascivo.override which stays free for one-off hotfixes. The
         generated AGENTS.md tells the agent to write there, and this statement is what makes
         that legal: a layer used but never declared falls to the end of the cascade and
         beats everything, which is the opposite of what the ordering is for. */
      /* Third-party CSS goes in the low-priority vendor layer so it can't beat cascivo:
         @import url('some-lib/styles.css') layer(vendor); — see docs/THIRD-PARTY-CSS.md */
      @layer cascivo.reset {
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
      }
      @layer cascivo.base {
        html,
        body,
        #root {
          height: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

function mainTsx(): string {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
`
}

function viteEnv(): string {
  return `/// <reference types="vite/client" />\n`
}

// No `opts`: the theme import and the brand moved to `Shell.tsx`, which owns the app chrome.
function appTsx(sections: Section[]): string {
  const sectionImports = sections
    .map((s) => `import { ${s.component} } from './sections/${s.component}'`)
    .join('\n')

  const unionType = sections.map((s) => `'${s.key}'`).join(' | ')

  const navItems = sections
    .map(
      (s) => `    {
      label: '${s.label.replace(/'/g, "\\'")}',
      active: section.value === '${s.key}',
      onClick: (e) => {
        e.preventDefault()
        section.value = '${s.key}'
      },
    },`,
    )
    .join('\n')

  const renderedSections = sections
    .map((s) => `      {section.value === '${s.key}' && <${s.component} />}`)
    .join('\n')

  // Everything comes from `@cascivo/react` on the prebuilt path — it re-exports the
  // `@cascivo/core` primitives, so importing from `@cascivo/core` directly would make it a
  // phantom dependency (and AI-RULES.md forbids declaring it here). There is likewise no
  // `import '@cascivo/tokens'`: the tokens arrive with the theme stylesheet.
  return `'use client'
import { signal, useSignals, type SideNavItem } from '@cascivo/react'
import { Shell } from './Shell'
${sectionImports}

type Section = ${unionType}

const section = signal<Section>('${sections[0]!.key}')

export default function App() {
  useSignals()

  const navItems: SideNavItem[] = [
${navItems}
  ]

  return (
    <Shell navItems={navItems}>
${renderedSections}
    </Shell>
  )
}
`
}

/**
 * The app shell, as its own component with a `children` slot.
 *
 * Split out of `App.tsx` because the shell composition — AppShell + ShellHeader + SideNav —
 * is the valuable part of the scaffold, and it used to be welded to the signal-driven
 * section switcher. A 2026-08-14 adopter prompted for "a dashboard with Vite and React
 * Router", then deleted `App.tsx` and all of `src/sections/` — the majority of what `create`
 * generated — and re-derived this wiring by hand.
 *
 * Now adding a router means deleting `App.tsx` + `src/sections/` and rendering `<Shell>` from
 * the root route's layout, with `navItems` carrying `href` instead of `onClick`. Nothing in
 * here needs to change.
 */
function shellTsx(opts: ScaffoldOptions): string {
  return `'use client'
import { AppShell, ShellHeader, SideNav, type SideNavItem } from '@cascivo/react'
import type { ReactNode } from 'react'

import '@cascivo/themes/${opts.theme}.css'
// No '@cascivo/react/styles.css' here. On a bundler build each component imports its
// own CSS, so you ship exactly what you use — this app emits well under 100 kB of entry
// CSS instead of the ~273 kB aggregate sheet. Import the aggregate ONLY if you drop the
// bundler (CDN / single-file setup). See https://cascivo.com/docs/getting-started.md
// The theme import above is always required — themes are never automatic.

export interface ShellProps {
  /** Side-nav entries. Use \`href\` for a routed app, \`onClick\` for local state. */
  navItems: SideNavItem[]
  children: ReactNode
}

/**
 * App shell: header + side nav + a content slot.
 *
 * Adding a router? Keep this file. Delete \`App.tsx\` and \`src/sections/\`, render
 * \`<Shell navItems={…}>\` from your root route's layout with your \`<Outlet />\` as children,
 * and give each nav item an \`href\` instead of an \`onClick\`.
 *
 * For those hrefs to become real router links, call \`setLinkComponent\` ONCE at startup in
 * \`main.tsx\` — see the "Adding a router" section of README.md for the exact snippet, or
 * https://cascivo.com/docs/using-with-a-router.md for the full recipe.
 */
export function Shell({ navItems, children }: ShellProps) {
  return (
${appShellOpenTag(opts, 'navItems')}
      {children}
    </AppShell>
  )
}
`
}

function sectionTsx(section: Section): string {
  // No inline styles: the generated AGENTS.md tells the agent not to write them, and a
  // scaffold that models the opposite teaches the opposite. The page inset comes from
  // AppShell's own \`padding\` prop, and the stacking from \`Flex\` — note \`gap\` takes a
  // NUMBER (a space-scale step), not a string.
  return `import { Card, CardContent, CardHeader, CardTitle, Flex, Heading, Text } from '@cascivo/react'

export function ${section.component}() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>${section.label}</Heading>
        <Text muted>
          Edit <code>src/sections/${section.component}.tsx</code> to build out this page.
        </Text>
      </Flex>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            This page is wired into the app shell. Add components with{' '}
            <code>npx cascivo add &lt;component&gt;</code>.
          </Text>
        </CardContent>
      </Card>
    </Flex>
  )
}
`
}

/**
 * ESLint flat config for the scaffold.
 *
 * `@cascivo/eslint-config` is wired in from the start because
 * `eslint-plugin-react-hooks@7`'s `recommended-latest` reports every `signal.value = next`
 * — the idiom AI-RULES.md mandates and the generated `App.tsx` below uses — as
 * `Error: This value cannot be modified`. Without this, `pnpm lint` on a freshly scaffolded
 * app errors on every piece of state it ships with.
 */
function eslintConfig(): string {
  return `import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import cascivo from '@cascivo/eslint-config'

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  // Registers the TypeScript parser and the .ts/.tsx \`files\` patterns. WITHOUT THIS ESLINT
  // LINTS NOTHING: its default \`files\` is **/*.{js,cjs,mjs}, so every file in this app is
  // skipped with "File ignored because no matching configuration was supplied" and the
  // \`lint\` script exits 0 having checked zero files.
  ...tseslint.configs.recommended,
  // NOTE the \`.flat\` — the plugin exports both \`configs['recommended-latest']\` (the legacy
  // eslintrc shape, which applies NOTHING here and reports no error) and this one.
  reactHooks.configs.flat['recommended-latest'],
  // Spread LAST — flat config is last-wins. This turns off \`react-hooks/immutability\`,
  // which reports cascivo's signal writes (\`signal.value = next\`) as errors. That rule
  // fires on the very first \`signal.value = x\` you write, so this is not optional wiring:
  // see https://cascivo.com/docs/using-with-strict-eslint.md
  ...cascivo,
]
`
}

/** Prettier config matching the style the scaffold's own generated source is written in. */
/**
 * The shell's `<AppShell …>` opening tag, laid out as Prettier lays it out: on one line when it
 * fits in the 100-column print width (a short app name), split over its attributes otherwise.
 * Always writing the split form made a fresh app with a short name fail its own format:check.
 */
function appShellOpenTag(opts: ScaffoldOptions, items: string): string {
  const header = `header={<ShellHeader brand={{ name: '${brandName(opts.name).replace(/'/g, "\\'")}' }} />}`
  const nav = `nav={<SideNav items={${items}} />}`
  const line = `    <AppShell ${header} ${nav}>`
  return line.length <= 100 ? line : `    <AppShell\n      ${header}\n      ${nav}\n    >`
}

function prettierrc(): string {
  return JSON.stringify({ semi: false, singleQuote: true, printWidth: 100 }, null, 2) + '\n'
}

function prettierIgnore(): string {
  return `dist
node_modules
# Vendored cascivo source is formatted upstream — reformatting it makes every
# \`cascivo add\` update a merge conflict.
src/components/ui/
`
}

function gitignore(): string {
  return `node_modules
dist
*.local
.DS_Store
`
}

/**
 * "Share a preview" for a static build: Cloudflare Drop takes the folder with no account, and
 * `wrangler deploy --temporary --assets` is the same thing from a terminal (or an agent).
 */
function staticShareSection(opts: ScaffoldOptions): string {
  const pm = opts.pm ?? 'npm'
  return `
## Share a preview

No Cloudflare account needed. Run \`${runScriptCommand(pm, 'build')}\`, then either:

- drag the \`dist/\` folder onto [Cloudflare Drop](https://www.cloudflare.com/drop/), or
- from a terminal: \`npx wrangler deploy --temporary --assets dist --name ${packageName(opts.name)} --compatibility-date ${COMPATIBILITY_DATE}\`

Either way you get a public URL that lasts 60 minutes. Sign in to Cloudflare within that hour
to keep it.
`
}

function readme(opts: ScaffoldOptions): string {
  const pm = opts.pm ?? 'npm'
  return `# ${opts.name}

A [cascivo](https://cascivo.com) app — Vite + React + TypeScript, pre-wired with
the cascivo app shell, side navigation, and the \`${opts.theme}\` theme.

## Develop

\`\`\`sh
${installAllCommand(pm)}
${runScriptCommand(pm, 'dev')}
\`\`\`

## Structure

- \`src/Shell.tsx\` — the app shell (header + side nav + content slot). Router-agnostic.
- \`src/App.tsx\` — nav items and which section is showing
- \`src/sections/\` — one component per nav item

Add more components with \`npx cascivo add <component>\`.

## Adding a router

This app switches sections with a signal, not a router. To add one (React Router,
TanStack Router, …):

1. **Keep \`src/Shell.tsx\`.** Delete \`src/App.tsx\` and \`src/sections/\`.
2. Render \`<Shell navItems={…}>\` from your root route's layout, with your \`<Outlet />\`
   as its children.
3. Give each nav item an \`href\` instead of \`onClick\`.
4. Register your router's Link **once** at startup, in \`src/main.tsx\`:

\`\`\`tsx
import { setLinkComponent } from '@cascivo/react'
import type { LinkComponentProps } from '@cascivo/react'
import { Link } from 'react-router'

setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
\`\`\`

That one call makes \`SideNav\`, \`ShellHeader\` and \`Breadcrumb\` render real router links.
Links you write in page content use \`<Link asChild>\` instead — two kinds of link, two
mechanisms. Full recipe: https://cascivo.com/docs/using-with-a-router.md
${staticShareSection(opts)}`
}

function agentsMd(opts: ScaffoldOptions): string {
  return `# Agent instructions — ${opts.name}

This is a [cascivo](https://cascivo.com) app. When generating or editing CSS, follow
the **layer contract** — cascivo styles live in cascade layers, and layer order beats
selector specificity.

## CSS layer contract

1. Every declaration goes inside an \`@layer\` block. Unlayered CSS beats all layers
   regardless of specificity — never emit it.
2. Never invent layer names. Write only: your app slot \`cascivo.example\` (declared in
   the order statement in \`index.html\`) for page styles, and
   \`@layer cascivo.override { … }\` for hotfixes / one-off overrides — it beats
   everything cascivo ships.
3. Never nest layers deeper than the shipped \`cascivo.blocks.<name>\` pattern. For
   sub-elements, use native CSS nesting inside one layer block, not new sublayers.
4. Third-party CSS: \`@import url('lib/styles.css') layer(vendor);\` with \`vendor\`
   declared before the cascivo layers. Don't import vendor CSS from JavaScript — route it
   through a CSS file, or use \`@cascivo/vite-plugin\` (\`cascivoLayers\`) to layer it.
5. Style with \`--cascivo-*\` tokens, not raw values.

This app's declared layer order (in \`index.html\`):

\`\`\`css
@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component,
  cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.example, cascivo.override;
\`\`\`

### Worked example — nesting, not new layers

\`\`\`css
@layer cascivo.override {
  .projectCard {
    /* Sub-elements nest inside the one block — no cascivo.card.status sublayer. */
    .statusBadge {
      color: var(--cascivo-color-text-subtle);
      .pulseDot {
        background: var(--cascivo-color-success);
      }
    }
  }
}
\`\`\`

## Routing

If you add a router, keep \`src/Shell.tsx\` and delete \`src/App.tsx\` + \`src/sections/\`.

cascivo links come in **two kinds**, wired two different ways. Do not intercept
\`onClick\`, and do not hand-wrap nav items:

1. **Config-driven navs** (\`SideNav\`, \`ShellHeader\`, \`Breadcrumb\`, \`Switcher\`) render
   through a module singleton. Register your router's Link once, in \`src/main.tsx\`:
   \`setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)\`
2. **Links in page content** use \`asChild\`:
   \`<Link asChild><RouterLink to="/x">x</RouterLink></Link>\`

Full recipe: https://cascivo.com/docs/using-with-a-router.md

## Types

The vocabulary types are on a subpath: \`import type { Tone } from '@cascivo/react/types'\`
(also \`Progress\`, \`SpaceStep\`). \`Status.status\` and \`Badge.variant\` use them, so a
\`Record<MyState, Tone>\` is the supported way to map domain states onto tones. **Never**
add \`@cascivo/core\` to this app's dependencies — it is transitive here.

More: cascivo's machine-readable guide is at https://cascivo.com/llms.txt.
`
}

/** Build the full set of files for a new cascivo app. Pure — no filesystem I/O. */
/* ------------------------------------------------------------------------- *
 * Astro scaffold (`--framework astro`)
 *
 * Shaped around what Astro is actually for, rather than transliterating the Vite SPA:
 * pages are real routes (no router to add later), page CONTENT is cascivo components
 * rendered with no client directive at all — server HTML, zero JS — and the only island
 * is the shell, which needs JS for its mobile nav drawer.
 *
 * The `astro.config.mjs` this emits carries one non-obvious required line —
 * `vite.resolve.noExternal` — without which SSR'd islands render unstyled. Baking that in
 * is most of why this scaffold is worth having; see the comment on `astroConfig` and
 * docs/USING-WITH-ASTRO.md.
 * ------------------------------------------------------------------------- */

/** Route for a section. The first section owns the index route. */
function sectionPath(section: Section, index: number): string {
  return index === 0 ? '/' : `/${section.key}`
}

/** Page file for a section, relative to `src/pages/`. */
function sectionPageFile(section: Section, index: number): string {
  return index === 0 ? 'index.astro' : `${section.key}.astro`
}

function astroPackageJson(opts: ScaffoldOptions): string {
  const pkg = {
    name: packageName(opts.name),
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
      typecheck: 'astro check',
      lint: 'eslint .',
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
    },
    // Same prebuilt-path rule as the Vite scaffold: `@cascivo/react` + `@cascivo/themes`
    // only. `@cascivo/core` and `@cascivo/tokens` are transitive and must not be declared.
    dependencies: {
      '@astrojs/react': '^5.0.0',
      '@cascivo/react': V['@cascivo/react']!,
      '@cascivo/themes': V['@cascivo/themes']!,
      '@preact/signals-react': SIGNALS_PEER,
      astro: '^7.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@astrojs/check': '^0.9.0',
      '@cascivo/eslint-config': V['@cascivo/eslint-config']!,
      '@eslint/js': '^9.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      eslint: '^9.0.0',
      'eslint-plugin-react-hooks': '^7.0.0',
      prettier: '^3.0.0',
      typescript: '^5.7.0',
      'typescript-eslint': '^8.0.0',
    },
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

function astroConfig(): string {
  return `// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      // REQUIRED, and the single least obvious line in this app.
      //
      // Vite externalizes node_modules packages in its server build, so an externalized
      // @cascivo/react is imported by Node at runtime and its module graph is never walked
      // — and Astro collects a page's CSS by walking that graph. Without this, SSR'd
      // islands (client:load, client:visible) render with correct class names and no rules
      // anywhere in the output. Nothing warns; it reads as a theming problem.
      //
      // It must be \`resolve.noExternal\`, NOT \`ssr.noExternal\`: Astro prerenders static
      // routes in its own Vite environment, which \`ssr.*\` does not reach.
      // https://cascivo.com/docs/using-with-astro.md
      noExternal: [/^@cascivo\\//],
    },
  },
})
`
}

function astroTsconfig(): string {
  const cfg = {
    extends: 'astro/tsconfigs/strict',
    include: ['.astro/types.d.ts', '**/*'],
    exclude: ['dist'],
    compilerOptions: { jsx: 'react-jsx' },
  }
  return JSON.stringify(cfg, null, 2) + '\n'
}

/**
 * The cascade layer order plus this app's own slot.
 *
 * A standalone CSS file imported BEFORE the theme, rather than a `<style>` in the layout:
 * layers take their order from first appearance, so a statement that lands after the
 * theme's CSS cannot reorder anything, and `vendor` would end up winning over every
 * cascivo layer instead of losing to all of them.
 */
function astroLayersCss(): string {
  return `/* Cascade layer order. Must load before any cascivo CSS — see the note in
   src/layouts/Layout.astro. Later layers beat earlier ones regardless of specificity.

   cascivo.example is this app's own slot: above the component and blocks layers so your
   page styles win, below cascivo.override which stays free for one-off hotfixes.
   Third-party CSS goes in vendor so it cannot beat cascivo:
     @import url('some-lib/styles.css') layer(vendor);
   See https://cascivo.com/docs/third-party-css.md */
@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component,
  cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.example, cascivo.override;

@layer cascivo.reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

@layer cascivo.base {
  html,
  body {
    block-size: 100%;
  }
}
`
}

function astroLayout(opts: ScaffoldOptions): string {
  return `---
// Import order matters: the layer statement must be established before any cascivo CSS.
import '../styles/layers.css'
import '@cascivo/themes/${opts.theme}.css'

// No '@cascivo/react/styles.css'. Each component brings its own CSS through the module
// graph, so you ship only what your pages use. Import the aggregate ONLY if you drop the
// bundler entirely. The theme import above is always required — themes are never automatic.

interface Props {
  title: string
}

const { title } = Astro.props
---

<!doctype html>
<html lang="en" data-theme="${opts.theme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} · ${brandName(opts.name)}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
`
}

/**
 * The app shell — the ONLY island in the scaffold.
 *
 * It is hydrated because AppShell's nav drawer is interactive on small screens. Page
 * content is slotted in as children and stays server-rendered HTML, so a page costs the
 * shell's JS and nothing more.
 */
function astroShellTsx(opts: ScaffoldOptions, sections: Section[]): string {
  const navItems = sections
    .map((s, i) => `  { label: '${s.label.replace(/'/g, "\\'")}', href: '${sectionPath(s, i)}' },`)
    .join('\n')

  return `import { AppShell, ShellHeader, SideNav, type SideNavItem } from '@cascivo/react'
import type { ReactNode } from 'react'

const NAV: { label: string; href: string }[] = [
${navItems}
]

export interface ShellProps {
  /** Current route, e.g. \`Astro.url.pathname\`. Marks the matching nav item active. */
  activePath: string
  children: ReactNode
}

/**
 * Header + side nav + a content slot.
 *
 * Nav items carry \`href\`, so navigation is a real page load and Astro's router handles
 * it — there is no client router to register and no \`setLinkComponent\` call to make.
 */
export function Shell({ activePath, children }: ShellProps) {
  const items: SideNavItem[] = NAV.map((item) => ({
    ...item,
    active: item.href === activePath,
  }))

  return (
${appShellOpenTag(opts, 'items')}
      {children}
    </AppShell>
  )
}
`
}

/**
 * A section's content as a plain React component with NO \`'use client'\`.
 *
 * Astro renders it on the server and ships no JavaScript for it. Add a client directive at
 * the call site in the page only when a section actually needs interactivity.
 */
function astroSectionTsx(section: Section): string {
  return `import { Card, CardContent, CardHeader, CardTitle, Flex, Heading, Text } from '@cascivo/react'

export function ${section.component}() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>${section.label}</Heading>
        <Text muted>
          Edit <code>src/components/${section.component}.tsx</code> to build out this page.
        </Text>
      </Flex>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            This page is server-rendered — no JavaScript ships for it. Add components with{' '}
            <code>npx cascivo add &lt;component&gt;</code>.
          </Text>
        </CardContent>
      </Card>
    </Flex>
  )
}
`
}

function astroPage(section: Section, index: number): string {
  return `---
import Layout from '../layouts/Layout.astro'
import { Shell } from '../components/Shell'
import { ${section.component} } from '../components/${section.component}'
---

<Layout title="${section.label}">
  {/* client:load hydrates the shell for its mobile nav drawer. The section below stays
      server-rendered HTML — it is slotted in as children and ships no JS. */}
  <Shell client:load activePath="${sectionPath(section, index)}">
    <${section.component} />
  </Shell>
</Layout>
`
}

function astroGitignore(): string {
  return `node_modules
dist
.astro
*.local
.DS_Store
`
}

function astroReadme(opts: ScaffoldOptions, sections: Section[]): string {
  const pm = opts.pm ?? 'npm'
  const routes = sections
    .map((s, i) => `- \`${sectionPath(s, i)}\` — \`src/pages/${sectionPageFile(s, i)}\``)
    .join('\n')

  return `# ${opts.name}

A [cascivo](https://cascivo.com) app — Astro + React islands + TypeScript, pre-wired with
the cascivo app shell, side navigation, and the \`${opts.theme}\` theme.

## Develop

\`\`\`sh
${installAllCommand(pm)}
${runScriptCommand(pm, 'dev')}
\`\`\`

## Routes

${routes}

Add a page by dropping a new \`.astro\` file in \`src/pages/\` — Astro routes it by filename.
Add it to \`NAV\` in \`src/components/Shell.tsx\` to get a nav entry.

## What hydrates, and what doesn't

Only \`Shell\` carries a client directive (\`client:load\`), because its nav drawer is
interactive on small screens. Everything inside it is slotted in as children and stays
server-rendered HTML, so a page ships the shell's JavaScript and nothing else.

Need a section to be interactive? Give it a directive at the call site in the page:

\`\`\`astro
<${sections[0]!.component} client:visible />
\`\`\`

A component that reads \`signal.value\` during render must also call \`useSignals()\` from
\`@cascivo/react\` as its first statement — Astro applies no signals transform.

## Styling

\`src/styles/layers.css\` declares the cascade layer order and this app's own
\`cascivo.example\` slot. It is imported **before** the theme in \`src/layouts/Layout.astro\`,
and that order matters: layers take their position from first appearance, so a statement
loaded after the theme cannot reorder anything.

Add more components with \`npx cascivo add <component>\`.
${staticShareSection(opts)}`
}

/* ------------------------------------------------------------------------- *
 * Cloudflare scaffold (`--framework cloudflare`)
 *
 * A client-rendered app and its API, deployed as ONE Worker with static assets. No SSR:
 * the browser gets the SPA, `/api/*` reaches the Worker, and `@cloudflare/vite-plugin`
 * runs that Worker in workerd during `vite dev`, so dev and production execute the same
 * runtime. The shape comes from `apps/examples/chat` (its FINDINGS.md), not from a design
 * exercise: the source is typed against React and the runtime is picked in the bundler,
 * shared wire types live in one file both sides import, and streaming goes through
 * `@cascivo/data`.
 * ------------------------------------------------------------------------- */

/** Workers runtime date the scaffold targets. Bump deliberately, never to "today". */
const COMPATIBILITY_DATE = '2026-09-01'

function cfPackageJson(opts: ScaffoldOptions): string {
  const pm = opts.pm ?? 'npm'
  const agent = hasExample(opts, 'agent')
  const workerTypes = needsWorkerTypes(opts)
  const preact = runtimeOf(opts) === 'preact'
  const pkg = {
    name: packageName(opts.name),
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: workerTypes ? 'tsc && tsc -p tsconfig.worker.json && vite build' : 'tsc && vite build',
      preview: 'vite preview',
      deploy: `${runScriptCommand(pm, 'build')} && wrangler deploy`,
      // No account: a temporary one, live for 60 minutes unless claimed (see README).
      'deploy:preview': `${runScriptCommand(pm, 'build')} && wrangler deploy --temporary`,
      typecheck: workerTypes
        ? 'tsc --noEmit && tsc --noEmit -p tsconfig.worker.json'
        : 'tsc --noEmit',
      lint: 'eslint .',
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
    },
    // Same prebuilt-path rules as the Vite scaffold (see `packageJson`): no @cascivo/core,
    // no @cascivo/tokens. `@cascivo/app` is the router + typed API this app imports;
    // `@cascivo/data` arrives with it.
    dependencies: {
      '@cascivo/app': V['@cascivo/app']!,
      '@cascivo/react': V['@cascivo/react']!,
      '@cascivo/themes': V['@cascivo/themes']!,
      '@preact/signals-react': SIGNALS_PEER,
      ...(preact ? { preact: '^10.29.0' } : { react: '^19.0.0', 'react-dom': '^19.0.0' }),
      // The /usage and /ops pages' charts.
      ...(hasExample(opts, 'usage') || hasExample(opts, 'live')
        ? { '@cascivo/charts': V['@cascivo/charts']! }
        : {}),
      // The /report page's PDF/PNG export drives Browser Run through Cloudflare's puppeteer.
      ...(hasExample(opts, 'export') ? { '@cloudflare/puppeteer': '^1.4.0' } : {}),
      // The /notes page keeps its room in IndexedDB.
      ...(hasExample(opts, 'notes') ? { '@cascivo/storage': V['@cascivo/storage']! } : {}),
      // The /assistant page: Cloudflare's Agents SDK on the AI SDK, and @cascivo/render to
      // draw (and validate) the views the model builds.
      ...(agent
        ? {
            '@ai-sdk/react': '^4.0.0',
            '@cascivo/render': V['@cascivo/render']!,
            '@cloudflare/ai-chat': '^0.12.1',
            agents: '^0.26.0',
            ai: '^7.0.0',
            'workers-ai-provider': '^4.0.0',
            zod: '^4.0.0',
          }
        : {}),
      // The /voice page: the Agents SDK's voice pipeline and its browser client.
      ...(hasExample(opts, 'voice') && !agent ? { agents: '^0.26.0' } : {}),
      // The /publish page and published pages render views with @cascivo/render.
      ...(hasExample(opts, 'publish') && !agent
        ? { '@cascivo/render': V['@cascivo/render']! }
        : {}),
      // The Worker renders receipts and newsletters with @cascivo/email (react-dom/server
      // underneath).
      ...(hasExample(opts, 'checkout') || hasExample(opts, 'newsletter')
        ? { '@cascivo/email': V['@cascivo/email']! }
        : {}),
      // The Worker server-renders published pages and emails; under Preact, react-dom/server
      // is preact/compat/server, which needs this.
      ...((hasExample(opts, 'publish') ||
        hasExample(opts, 'checkout') ||
        hasExample(opts, 'newsletter')) &&
      preact
        ? { 'preact-render-to-string': '^6.5.0' }
        : {}),
    },
    devDependencies: {
      '@cascivo/eslint-config': V['@cascivo/eslint-config']!,
      '@cloudflare/vite-plugin': '^1.62.0',
      // Types for worker/ (tsconfig.worker.json): the Agents SDK and Workflows extend runtime
      // classes only these declare. Kept out of the app's DOM-typed tsconfig.
      ...(workerTypes ? { '@cloudflare/workers-types': '^5.0.0' } : {}),
      '@eslint/js': '^9.0.0',
      // The source is typed against React even when Preact runs it (see vite.config.ts), so
      // React's types are always installed. Under Preact, `react`/`react-dom` are dev-only:
      // they satisfy cascivo's peer ranges and are aliased away at build time.
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      ...(preact
        ? {
            '@babel/core': '^7.0.0',
            '@preact/preset-vite': '^2.10.0',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
          }
        : { '@vitejs/plugin-react': '^6.0.0' }),
      eslint: '^9.0.0',
      'eslint-plugin-react-hooks': '^7.0.0',
      prettier: '^3.0.0',
      typescript: '^5.7.0',
      'typescript-eslint': '^8.0.0',
      vite: '^8.0.0',
      wrangler: '^4.143.0',
    },
  }
  const bindings = cfBindingDescriptions(opts)
  return (
    JSON.stringify(
      Object.keys(bindings).length > 0 ? { ...pkg, cloudflare: { bindings } } : pkg,
      null,
      2,
    ) + '\n'
  )
}

function cfTsconfig(opts: ScaffoldOptions): string {
  const cfg = JSON.parse(tsconfig()) as { include: string[] }
  // `worker/` is type-checked with the app: it imports `src/api.ts`, and a contract change
  // should fail `tsc` on whichever side was not updated. When the Worker needs Cloudflare's
  // runtime types (see needsWorkerTypes), which clash with the DOM's, it gets its own config
  // (tsconfig.worker.json) and both run in `typecheck`.
  cfg.include = needsWorkerTypes(opts) ? ['src'] : ['src', 'worker']
  return formatJson(cfg)
}

function cfWorkerTsconfig(): string {
  return formatJson({
    extends: './tsconfig.json',
    compilerOptions: {
      lib: ['ES2022'],
      types: ['@cloudflare/workers-types', 'vite/client'],
    },
    include: ['worker'],
  })
}

function cfViteConfig(runtime: Runtime, opts: ScaffoldOptions): string {
  const agent = hasExample(opts, 'agent')
  const ai = usesWorkersAi(opts)
  const plugin =
    runtime === 'preact'
      ? `import preact from '@preact/preset-vite'`
      : `import react from '@vitejs/plugin-react'`
  const call = runtime === 'preact' ? 'preact()' : 'react()'
  const note =
    runtime === 'preact'
      ? `// The source is written against React's types; @preact/preset-vite aliases react and
// react-dom to preact/compat, so the bundle runs on Preact (about a third of React's JS in
// this starter: ~27 KB gzip against ~85 KB). To run on React instead, swap this plugin
// for @vitejs/plugin-react — no source changes.`
      : agent
        ? `// Runs on React: the /assistant page uses the Agents SDK's hooks, which call React 19's
// use() — preact/compat does not implement it, so this app cannot switch to Preact.`
        : `// Runs on React. To ship Preact instead (about a third of the JS in this starter), swap
// this plugin for @preact/preset-vite — it aliases react/react-dom to preact/compat; no
// source changes.`
  return `${plugin}
import { cascivoRoutes } from '@cascivo/app/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

${note}
//
// cascivoRoutes() writes src/routes.gen.ts from src/routes/ — one file per page.
// cloudflare() runs worker/index.ts in workerd during \`vite dev\` and builds it with the
// client, so dev and production execute the same runtime. Request routing is in wrangler.jsonc.${
    ai
      ? `
//
// Workers AI has no local mode: with remote bindings on, \`vite dev\` needs a Cloudflare login.
// So they are off, ${
          hasExample(opts, 'search')
            ? `and:${[
                agent ? 'the assistant answers from worker/scripted-model.ts' : '',
                hasExample(opts, 'voice')
                  ? 'the voice page uses the stand-ins in worker/scripted-voice.ts'
                  : '',
                'search runs by keyword, on SQLite full-text search (worker/search.ts)',
              ]
                .filter(Boolean)
                .map((clause) => `\n// - ${clause}`)
                .join('')}`
            : agent && hasExample(opts, 'voice')
              ? `the assistant answers from worker/scripted-model.ts, and the voice
// page uses the stand-ins in worker/scripted-voice.ts`
              : agent
                ? 'and the assistant answers from worker/scripted-model.ts'
                : 'and the voice page uses the stand-ins in worker/scripted-voice.ts'
        }. Run
// \`VITE_REAL_AI=1 vite dev\` (after \`wrangler login\`) to use Workers AI.`
      : ''
  }
export default defineConfig({
${
  ai
    ? `  plugins: [
    ${call},
    cascivoRoutes(),
    cloudflare({ remoteBindings: process.env['VITE_REAL_AI'] === '1' }),
  ],`
    : `  plugins: [${call}, cascivoRoutes(), cloudflare()],`
}${
    hasExample(opts, 'publish')
      ? `
  // A published page's HTML links the stylesheets its route needs, found in this manifest
  // (worker/page-html.ts), so the page is styled for readers without JavaScript too.
  build: { manifest: 'asset-manifest.json' },`
      : ''
  }
})
`
}

/** A JSONC array property laid out as Prettier does: one line when it fits in 100 columns. */
function jsoncArray(indent: string, key: string, items: string[]): string {
  const line = `${indent}"${key}": [${items.join(', ')}],`
  if (line.length <= 100) return line
  return `${indent}"${key}": [\n${items.map((i) => `${indent}  ${i},`).join('\n')}\n${indent}],`
}

function wranglerJsonc(opts: ScaffoldOptions): string {
  const publish = hasExample(opts, 'publish')
  const rooms = usesRooms(opts)
  const agent = hasExample(opts, 'agent')
  const ai = usesAgents(opts)
  // One Durable Object class per example; a fresh app declares them all in one migration.
  const objects = [
    ...(rooms ? [{ name: 'ROOMS', className: 'SyncRoom' }] : []),
    ...(agent ? [{ name: 'Assistant', className: 'Assistant' }] : []),
    ...(hasExample(opts, 'live') ? [{ name: 'LIVE', className: 'LiveRoom' }] : []),
    ...(hasExample(opts, 'voice') ? [{ name: 'Voice', className: 'Voice' }] : []),
  ]
  const comments = [
    ...(rooms ? ['// ROOMS: one SyncRoom per room (@cascivo/app/sync-server).'] : []),
    ...(agent
      ? ['// Assistant: one AIChatAgent per conversation; it stores the messages in SQLite.']
      : []),
    ...(hasExample(opts, 'live')
      ? ["// LIVE: the /ops dashboard's per-second totals (@cascivo/app/live-server)."]
      : []),
    ...(hasExample(opts, 'voice')
      ? ['// Voice: one voice agent per conversation (agents/voice); it stores the transcript.']
      : []),
  ]
  return `// Cloudflare deploy config. \`${runExplicitCommand(opts.pm ?? 'npm', 'deploy')}\` builds and ships the SPA and
// the Worker together. https://developers.cloudflare.com/workers/wrangler/configuration/
{
  "name": "${packageName(opts.name)}",
  "main": "./worker/index.ts",
  "compatibility_date": "${COMPATIBILITY_DATE}",
  "assets": {
    // Client-side app: an unknown path serves index.html, and the client renders it.
    "not_found_handling": "single-page-application",
    // ${
      publish
        ? 'Only the API and published pages reach the Worker; static assets are served\n    // without invoking it.'
        : 'Only the API reaches the Worker; static assets are served without invoking it.'
    }
    "run_worker_first": [${['"/api/*"', ...(ai ? ['"/agents/*"'] : []), ...(publish ? ['"/p/*"'] : [])].join(', ')}],${
      publish
        ? `
    // The Worker reads index.html through this to put a published page into it.
    "binding": "ASSETS",`
        : ''
    }
  },
  "observability": { "enabled": true },${
    objects.length > 0
      ? `
  ${comments.join('\n  ')}
  "durable_objects": {
${jsoncArray(
  '    ',
  'bindings',
  objects.map((o) => `{ "name": "${o.name}", "class_name": "${o.className}" }`),
)}
  },
${jsoncArray('  ', 'migrations', [`{ "tag": "v1", "new_sqlite_classes": [${objects.map((o) => `"${o.className}"`).join(', ')}] }`])}`
      : ''
  }${
    hasExample(opts, 'files') || hasExample(opts, 'social')
      ? `
  // ${[
    hasExample(opts, 'files')
      ? 'Uploaded files, and Cloudflare Images for their resized previews'
      : '',
    hasExample(opts, 'social') ? 'Images attached to social posts (worker/social.ts)' : '',
  ]
    .filter(Boolean)
    .join('; ')}.
${jsoncArray('  ', 'r2_buckets', [
  ...(hasExample(opts, 'files')
    ? [`{ "binding": "FILES", "bucket_name": "${packageName(opts.name)}-files" }`]
    : []),
  ...(hasExample(opts, 'social')
    ? [`{ "binding": "SOCIAL_MEDIA", "bucket_name": "${packageName(opts.name)}-social-media" }`]
    : []),
])}${hasExample(opts, 'files') ? '\n  "images": { "binding": "IMAGES" },' : ''}`
      : ''
  }${
    usesLimiter(opts)
      ? `
  // ${[
    hasExample(opts, 'files') ? 'Uploads' : '',
    hasExample(opts, 'export') ? 'exports' : '',
    hasExample(opts, 'publish') ? 'published pages' : '',
    hasExample(opts, 'digest') ? 'digests sent now' : '',
    hasExample(opts, 'search') ? 'search indexing' : '',
    hasExample(opts, 'checkout') ? 'checkouts started' : '',
    hasExample(opts, 'newsletter') ? 'newsletter sign-ups and composer requests' : '',
    hasExample(opts, 'social') ? 'connecting accounts, posts and image uploads' : '',
    emailSignIn(opts) ? 'sign-in emails' : '',
  ]
    .filter(Boolean)
    .join(', ')
    .replace(/^./, (c) => c.toUpperCase())} per caller: 20 a minute.
  // namespace_id is any number unique within your account:
  // https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
${jsoncArray('  ', 'ratelimits', ['{ "name": "LIMITER", "namespace_id": "1001", "simple": { "limit": 20, "period": 60 } }'])}`
      : ''
  }${wranglerVars(opts)}${
    hasExample(opts, 'digest') || hasExample(opts, 'social')
      ? `
  // ${[
    hasExample(opts, 'digest') ? 'The weekly digest: Mondays at 08:00 UTC (worker/digest.ts)' : '',
    hasExample(opts, 'social')
      ? 'Threads tokens renewed and reconnect reminders sent, daily at 04:17 UTC (worker/social.ts)'
      : '',
  ]
    .filter(Boolean)
    .join('; ')}.
  "triggers": { "crons": [${[
    hasExample(opts, 'digest') ? '"0 8 * * 1"' : '',
    hasExample(opts, 'social') ? `"${SOCIAL_CRON}"` : '',
  ]
    .filter(Boolean)
    .join(', ')}] },`
      : ''
  }${
    usesD1(opts)
      ? `
  // Tables for ${[
    hasExample(opts, 'crud') ? 'customers' : '',
    hasExample(opts, 'publish') ? 'published pages' : '',
    hasExample(opts, 'webhooks') ? 'webhook deliveries' : '',
    hasExample(opts, 'digest') ? 'digest runs' : '',
    hasExample(opts, 'search') ? 'help articles' : '',
    hasExample(opts, 'checkout') ? 'orders' : '',
    hasExample(opts, 'newsletter') ? 'newsletter subscribers and issues' : '',
    hasAccounts(opts) ? 'accounts' : '',
  ]
    .filter(Boolean)
    .join(', ')}.
  // No database_id: wrangler creates the database on first deploy, and the Worker applies its
  // own schema on its first query (\`migrate\`).
${jsoncArray('  ', 'd1_databases', [`{ "binding": "DB", "database_name": "${packageName(opts.name)}-db" }`])}`
      : ''
  }${
    hasExample(opts, 'usage')
      ? `
  // Every API request is recorded here (worker/index.ts); /usage reads it back.
  "analytics_engine_datasets": [{ "binding": "USAGE", "dataset": "${usageDataset(opts)}" }],`
      : ''
  }${wranglerQueues(opts)}${
    hasExample(opts, 'import') || hasExample(opts, 'social')
      ? `
  // ${[
    hasExample(opts, 'import')
      ? 'The CSV import runs as a Workflow (worker/import-job.ts); its progress is a room.'
      : '',
    hasExample(opts, 'social')
      ? 'Each scheduled post is a Workflow that waits until it is due (worker/social-post.ts).'
      : '',
  ]
    .filter(Boolean)
    .join('\n  // ')}
${jsoncArray('  ', 'workflows', [
  ...(hasExample(opts, 'import')
    ? ['{ "name": "import-job", "binding": "IMPORT_JOB", "class_name": "ImportJob" }']
    : []),
  ...(hasExample(opts, 'social')
    ? [
        `{ "name": "${packageName(opts.name)}-social-post", "binding": "SOCIAL_POST", "class_name": "SocialPost" }`,
      ]
    : []),
])}`
      : ''
  }${
    usesWorkersAi(opts)
      ? `
  // Workers AI, which the ${[agent ? 'assistant' : '', hasExample(opts, 'voice') ? 'voice agent' : '', hasExample(opts, 'search') ? 'search page' : ''].filter(Boolean).join(' and ')} call${[agent, hasExample(opts, 'voice'), hasExample(opts, 'search')].filter(Boolean).length > 1 ? '' : 's'}.
  "ai": { "binding": "AI" },`
      : ''
  }${
    hasExample(opts, 'search')
      ? `
  // The help articles' embeddings (worker/search.ts). Create it once before deploying (README).
${jsoncArray('  ', 'vectorize', [`{ "binding": "ARTICLES_INDEX", "index_name": "${packageName(opts.name)}-articles" }`])}`
      : ''
  }${
    hasExample(opts, 'export')
      ? `
  // Browser Run: renders pages to PDF/PNG for /api/export.
  "browser": { "binding": "BROWSER" },`
      : ''
  }${
    ai || hasExample(opts, 'export')
      ? `
  // ${[ai ? 'The Agents SDK' : '', hasExample(opts, 'export') ? "Cloudflare's puppeteer" : ''].filter(Boolean).join(' and ')} use${ai && hasExample(opts, 'export') ? '' : 's'} Node.js APIs.
  "compatibility_flags": ["nodejs_compat"],`
      : ''
  }
  // Add bindings here (KV, D1, R2, Durable Objects, Workers AI) and read them from the
  // \`env\` argument of the Worker's fetch handler.
}
`
}

/**
 * wrangler.jsonc's plain-text settings, in one `vars` object (a second one would replace the
 * first), and the Email Service binding when anything sends mail.
 */
function wranglerVars(opts: ScaffoldOptions): string {
  const digest = hasExample(opts, 'digest')
  const social = hasExample(opts, 'social')
  const checkout = hasExample(opts, 'checkout')
  const newsletter = hasExample(opts, 'newsletter')
  const emailAuth = emailSignIn(opts)
  const comments = [
    ...(opts.auth === 'access'
      ? ['Cloudflare Access (README). Until both are set, the Worker refuses every request.']
      : []),
    ...(emailAuth
      ? [
          'Sign-in links go out through Email Service (README). AUTH_FROM must be an address on a',
          'domain you have onboarded; until it is set, sign-in fails with a clear error.',
        ]
      : []),
    ...(digest
      ? [
          "The weekly digest (README): who gets it, who sends it, and the deployed app's URL,",
          'which the browser opens. Until they are set, each run is recorded as skipped.',
        ]
      : []),
    ...(social
      ? [
          'Reminders to connect LinkedIn again go out through Email Service from REMINDER_FROM, an',
          `address on a domain you have onboarded, with links to APP_URL (README). Until both are`,
          'set, no reminder is sent.',
        ]
      : []),
    ...(checkout
      ? [
          'Receipts for paid orders go out through Email Service from RECEIPT_FROM, an address',
          'on a domain you have onboarded (README). Until it is set, no receipt is sent.',
        ]
      : []),
    ...(newsletter
      ? [
          'The newsletter sends through Amazon SES (README): the region your sending identity is',
          'verified in, its From address, and the SNS topic SES reports bounces and complaints to.',
        ]
      : []),
  ]
  const names = [
    ...(opts.auth === 'access' ? ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD'] : []),
    ...(emailAuth ? ['AUTH_FROM'] : []),
    ...(digest ? ['DIGEST_TO', 'DIGEST_FROM', 'APP_URL'] : []),
    ...(social ? ['REMINDER_FROM', ...(digest ? [] : ['APP_URL'])] : []),
    ...(checkout ? ['RECEIPT_FROM'] : []),
    ...(newsletter ? ['AWS_REGION', 'NEWSLETTER_FROM', 'SNS_TOPIC_ARN'] : []),
  ]
  if (names.length === 0) return ''
  const entries = names.map((name) => `"${name}": ""`)
  const line = `  "vars": { ${entries.join(', ')} },`
  const vars =
    line.length <= 100
      ? line
      : `  "vars": {\n${entries.map((entry) => `    ${entry},`).join('\n')}\n  },`
  return `
${comments.map((comment) => `  // ${comment}`).join('\n')}${emailAuth || digest || checkout || social ? '\n  "send_email": [{ "name": "EMAIL" }],' : ''}
${vars}`
}

/** One `queues` object for every example that has a queue (a second one would replace the first). */
function wranglerQueues(opts: ScaffoldOptions): string {
  const queues = [
    ...(hasExample(opts, 'live')
      ? [
          {
            comment: [
              "Events for /ops: POST /api/events sends them, and the Worker's queue handler takes them in",
              'batches of up to 100, or whatever arrived within a second.',
            ],
            binding: 'EVENTS',
            queue: `${packageName(opts.name)}-events`,
            consumer: ['"max_batch_size": 100', '"max_batch_timeout": 1'],
          },
        ]
      : []),
    ...(hasExample(opts, 'newsletter')
      ? [
          {
            comment: [
              'Newsletter sends (worker/newsletter.ts): one message of 25 readers at a time, so SES',
              'is called at a steady pace. A throttled message is retried after 30 seconds.',
            ],
            binding: 'NEWSLETTER',
            queue: newsletterQueue(opts),
            consumer: [
              '"max_batch_size": 1',
              '"max_concurrency": 1',
              '"max_retries": 10',
              '"retry_delay": 30',
            ],
          },
        ]
      : []),
  ]
  if (queues.length === 0) return ''
  return `
${queues.flatMap((q) => q.comment.map((line) => `  // ${line}`)).join('\n')}
  "queues": {
${jsoncArray(
  '    ',
  'producers',
  queues.map((q) => `{ "binding": "${q.binding}", "queue": "${q.queue}" }`),
)}
    "consumers": [
${queues
  .map(
    (q) => `      {
        "queue": "${q.queue}",
${q.consumer.map((line) => `        ${line},`).join('\n')}
      },`,
  )
  .join('\n')}
    ],
  },`
}

/** A subscription plan needs an account to belong to: checkout with accounts bills one. */
function usesBilling(opts: ScaffoldOptions): boolean {
  return hasExample(opts, 'checkout') && hasAccounts(opts)
}

/** Accounts of any kind: users, sessions, and API writes that need a signed-in user. */
function hasAccounts(opts: ScaffoldOptions): boolean {
  return emailSignIn(opts) || oauthSignIn(opts)
}

/** Sign-in by an emailed one-time link (`handleAuth`). */
function emailSignIn(opts: ScaffoldOptions): boolean {
  return opts.auth === 'email' || opts.auth === 'email,oauth'
}

/**
 * `--auth`: `access`, `email`, `oauth`, or `email,oauth` (either order); `null` when absent,
 * `'invalid'` for anything else, including `access` combined with a sign-in method.
 */
export function parseAuth(raw: string | undefined): Auth | null | 'invalid' {
  const parts = [
    ...new Set(
      (raw ?? '')
        .toLowerCase()
        .split(',')
        .map((p) => p.trim()),
    ),
  ].filter(Boolean)
  if (parts.length === 0) return null
  const key = parts.sort().join(',')
  return key === 'access' || key === 'email' || key === 'oauth' || key === 'email,oauth'
    ? key
    : 'invalid'
}

/** Sign-in with GitHub, Google and LinkedIn (`handleOAuth`). */
function oauthSignIn(opts: ScaffoldOptions): boolean {
  return opts.auth === 'oauth' || opts.auth === 'email,oauth'
}

/** The newsletter's queue, named after the app like every other resource. */
function newsletterQueue(opts: ScaffoldOptions): string {
  return `${packageName(opts.name)}-newsletter`
}

function hasExample(opts: ScaffoldOptions, example: Example): boolean {
  return opts.examples?.includes(example) ?? false
}

/**
 * Examples that live in `SyncRoom`s: the board and the notes (at /api/rooms/:name), and the
 * import's job progress (a read-only room at /api/jobs/:id).
 */
/** The Analytics Engine dataset for `--example usage`: one per app, named after it. */
function usageDataset(opts: ScaffoldOptions): string {
  return `${packageName(opts.name)
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[^a-z_]/, '_$&')}_usage`
}

/**
 * Examples with requests that cost money (storage, a browser) or put content on the app's
 * origin (a published page): rate-limited per caller.
 */
function usesLimiter(opts: ScaffoldOptions): boolean {
  return (
    hasExample(opts, 'files') ||
    hasExample(opts, 'export') ||
    hasExample(opts, 'publish') ||
    hasExample(opts, 'digest') ||
    hasExample(opts, 'search') ||
    hasExample(opts, 'checkout') ||
    hasExample(opts, 'newsletter') ||
    hasExample(opts, 'social') ||
    emailSignIn(opts)
  )
}

/** Examples that keep tables in D1, bound as DB. */
function usesD1(opts: ScaffoldOptions): boolean {
  return (
    hasExample(opts, 'crud') ||
    hasExample(opts, 'publish') ||
    hasExample(opts, 'webhooks') ||
    hasExample(opts, 'digest') ||
    hasExample(opts, 'search') ||
    hasExample(opts, 'checkout') ||
    hasExample(opts, 'newsletter') ||
    hasAccounts(opts)
  )
}

/** Examples that call Workers AI: the Agents SDK ones, and search's embeddings. */
function usesWorkersAi(opts: ScaffoldOptions): boolean {
  return usesAgents(opts) || hasExample(opts, 'search')
}

/** Examples on Cloudflare's Agents SDK: routed under /agents/*, calling Workers AI. */
function usesAgents(opts: ScaffoldOptions): boolean {
  return hasExample(opts, 'agent') || hasExample(opts, 'voice')
}

function usesRooms(opts: ScaffoldOptions): boolean {
  return (
    hasExample(opts, 'board') ||
    hasExample(opts, 'notes') ||
    hasExample(opts, 'import') ||
    hasExample(opts, 'webhooks') ||
    hasExample(opts, 'checkout') ||
    hasExample(opts, 'newsletter')
  )
}

/**
 * Worker code that extends a runtime class (the Agents SDK's Durable Object, a Workflow)
 * needs Cloudflare's runtime types, which clash with the DOM's: those apps type-check
 * worker/ on its own (tsconfig.worker.json).
 */
function needsWorkerTypes(opts: ScaffoldOptions): boolean {
  return usesAgents(opts) || hasExample(opts, 'import') || hasExample(opts, 'social')
}

/**
 * The client runtime. Preact by default; React with the `agent` example, because the Agents
 * SDK's hooks (`useAgent`, `useAgentChat`) call React 19's `use()`, which preact/compat
 * does not implement — the build fails on the missing export.
 */
function runtimeOf(opts: ScaffoldOptions): Runtime {
  return opts.runtime ?? (hasExample(opts, 'agent') ? 'react' : 'preact')
}

function cfApiTs(opts: ScaffoldOptions): string {
  const imports = hasExample(opts, 'import')
  const files = hasExample(opts, 'files')
  const usage = hasExample(opts, 'usage')
  const crud = hasExample(opts, 'crud')
  const live = hasExample(opts, 'live')
  const publish = hasExample(opts, 'publish')
  const webhooks = hasExample(opts, 'webhooks')
  const digest = hasExample(opts, 'digest')
  const search = hasExample(opts, 'search')
  const checkout = hasExample(opts, 'checkout')
  const newsletter = hasExample(opts, 'newsletter')
  const billing = usesBilling(opts)
  const social = hasExample(opts, 'social')
  return `import { defineApi, ${imports || files || usage || crud || live || publish || webhooks || digest || search || checkout || newsletter || social ? 'endpoint, ' : ''}stream } from '@cascivo/app/api'
${crud ? `import { parseTablePage, parseTableQuery } from '@cascivo/app/db'\n` : ''}${files ? `import { parseStoredFile } from '@cascivo/app/uploads'\n` : ''}${imports ? `import { parseImportRequest, parseStarted } from './import-job'\n` : ''}${usage ? `import { parseUsageReport } from './usage'\n` : ''}${crud ? `import { parseCustomer, parseCustomerInput, parseDeleted } from './customers'\n` : ''}${live ? `import { ops, parseAccepted } from './ops'\n` : ''}${publish ? `import { parsePage, parsePageInput, parsePageSummary } from './pages'\n` : ''}${webhooks ? `import { parseDeliveries, parseTestResult } from './webhooks'\n` : ''}${digest ? `import { parseDigestRun, parseDigestRuns } from './digest'\n` : ''}${search ? `import { parseIndexed, parseSearchQuery, parseSearchResult } from './search'\n` : ''}${billing ? `import { parseBilling, parseRedirect, parseSyncInput } from './billing'\n` : ''}${checkout ? `import { parseCheckoutStarted, parseOrder } from './checkout'\n` : ''}${
    newsletter
      ? `import {
  parseConfirmed,
  parseEmailInput,
  parseIssue,
  parseIssueInput,
  parseKeyInput,
  parseOverview,
  parsePreview,
  parseSubscribed,
  parseTokenInput,
} from './newsletter'\n`
      : ''
  }${social ? `import { parsePostInput, parseScheduledPost, parseSocial } from './social'\n` : ''}
/**
 * The contract between the browser and the Worker. Both import this file: the Worker serves
 * it with \`createHandler\`, the app calls it with \`createClient\`, and a change that breaks
 * either side is a type error. Add an endpoint here, then its handler in worker/index.ts.
 */

/** How many ticks one stream sends before it ends. */
export const TICKS_PER_STREAM = 30

export interface Tick {
  n: number
  /** ISO timestamp, set by the Worker. */
  at: string
}

/**
 * Parses one streamed tick. It crosses the network, so it is checked rather than cast —
 * \`JSON.parse\` returns \`any\`, and \`as Tick\` would prove nothing.
 */
export function parseTick(raw: unknown): Tick {
  if (typeof raw === 'object' && raw !== null) {
    const { n, at } = raw as Record<string, unknown>
    if (typeof n === 'number' && typeof at === 'string') return { n, at }
  }
  throw new Error('Malformed tick')
}

export const api = defineApi({
  ticks: stream({ method: 'GET', path: '/api/ticks', event: parseTick }),${
    imports
      ? `
  // Starts a CSV import; returns the job id to watch (src/import-page.ts).
  startImport: endpoint({
    method: 'POST',
    path: '/api/import',
    input: parseImportRequest,
    output: parseStarted,
  }),`
      : ''
  }${
    files
      ? `
  // The stored files (the uploads themselves are \`handleUploads\` in the Worker).
  listFiles: endpoint({
    method: 'GET',
    path: '/api/files',
    output: (raw) => {
      if (!Array.isArray(raw)) throw new Error('Expected a list of files')
      return raw.map(parseStoredFile)
    },
  }),`
      : ''
  }${
    usage
      ? `
  // The last 24 hours of API usage, read from Analytics Engine by the Worker.
  usage: endpoint({ method: 'GET', path: '/api/usage', output: parseUsageReport }),`
      : ''
  }${
    live
      ? `
  // Events for the /ops dashboard, at most 100 at a time, onto the EVENTS queue.
  sendEvents: endpoint({
    method: 'POST',
    path: '/api/events',
    input: ops.parseEvents,
    output: parseAccepted,
  }),`
      : ''
  }${
    publish
      ? `
  // Publishes a view as a page (checked against the manifests), and reads one back.
  publishPage: endpoint({
    method: 'POST',
    path: '/api/pages',
    input: parsePageInput,
    output: parsePageSummary,
  }),
  getPage: endpoint({ method: 'GET', path: '/api/pages/:slug', output: parsePage }),`
      : ''
  }${
    webhooks
      ? `
  // The last 50 webhook deliveries (they arrive at /api/webhooks/github, signed).
  listDeliveries: endpoint({ method: 'GET', path: '/api/webhooks', output: parseDeliveries }),
  // Signs a sample delivery with WEBHOOK_SECRET and runs it through the same path.
  sendTestDelivery: endpoint({
    method: 'POST',
    path: '/api/webhook-test',
    output: parseTestResult,
  }),`
      : ''
  }${
    digest
      ? `
  // The weekly digest's recent runs, and one run now (the Cron Trigger runs it on Mondays).
  digestRuns: endpoint({ method: 'GET', path: '/api/digest/runs', output: parseDigestRuns }),
  runDigest: endpoint({ method: 'POST', path: '/api/digest/run', output: parseDigestRun }),`
      : ''
  }${
    search
      ? `
  // Help articles by meaning (Vectorize), or by keyword in vite dev.
  search: endpoint({
    method: 'POST',
    path: '/api/search',
    input: parseSearchQuery,
    output: parseSearchResult,
  }),
  // Embeds every article into the Vectorize index.
  indexArticles: endpoint({ method: 'POST', path: '/api/search/index', output: parseIndexed }),`
      : ''
  }${
    checkout
      ? `
  // Opens a Stripe Checkout page for the product; the browser goes to its url.
  startCheckout: endpoint({ method: 'POST', path: '/api/checkout', output: parseCheckoutStarted }),
  // An order, checked with Stripe while it is pending (Stripe's webhook settles it too).
  getOrder: endpoint({ method: 'GET', path: '/api/orders/:id', output: parseOrder }),`
      : ''
  }${
    billing
      ? `
  // The signed-in user's subscription (worker/billing.ts), and the ways to change it.
  getBilling: endpoint({ method: 'GET', path: '/api/billing', output: parseBilling }),
  startSubscription: endpoint({
    method: 'POST',
    path: '/api/billing/subscribe',
    output: parseRedirect,
  }),
  syncBilling: endpoint({
    method: 'POST',
    path: '/api/billing/sync',
    input: parseSyncInput,
    output: parseBilling,
  }),
  openBillingPortal: endpoint({
    method: 'POST',
    path: '/api/billing/portal',
    output: parseRedirect,
  }),`
      : ''
  }${
    newsletter
      ? `
  // Signing up sends a confirmation link; only confirmed readers get issues.
  subscribe: endpoint({
    method: 'POST',
    path: '/api/newsletter/subscribe',
    input: parseEmailInput,
    output: parseSubscribed,
  }),
  confirmSubscription: endpoint({
    method: 'POST',
    path: '/api/newsletter/confirm',
    input: parseTokenInput,
    output: parseConfirmed,
  }),
  // The composer's calls, each carrying NEWSLETTER_KEY.
  newsletterOverview: endpoint({
    method: 'POST',
    path: '/api/newsletter/overview',
    input: parseKeyInput,
    output: parseOverview,
  }),
  previewIssue: endpoint({
    method: 'POST',
    path: '/api/newsletter/preview',
    input: parseIssueInput,
    output: parsePreview,
  }),
  sendIssue: endpoint({
    method: 'POST',
    path: '/api/newsletter/issues',
    input: parseIssueInput,
    output: parseIssue,
  }),`
      : ''
  }${
    crud
      ? `
  // One page of customers for DataTable's query (sort, search, filters, page).
  customers: endpoint({
    method: 'POST',
    path: '/api/customers/query',
    input: parseTableQuery,
    output: (raw) => parseTablePage(raw, parseCustomer),
  }),
  createCustomer: endpoint({
    method: 'POST',
    path: '/api/customers',
    input: parseCustomerInput,
    output: parseCustomer,
  }),
  updateCustomer: endpoint({
    method: 'PUT',
    path: '/api/customers/:id',
    input: parseCustomerInput,
    output: parseCustomer,
  }),
  deleteCustomer: endpoint({ method: 'DELETE', path: '/api/customers/:id', output: parseDeleted }),`
      : ''
  }${
    social
      ? `
  // The signed-in user's connected accounts and posts (worker/social.ts).
  getSocial: endpoint({ method: 'GET', path: '/api/social', output: parseSocial }),
  schedulePost: endpoint({
    method: 'POST',
    path: '/api/social/posts',
    input: parsePostInput,
    output: parseScheduledPost,
  }),
  cancelPost: endpoint({
    method: 'POST',
    path: '/api/social/posts/:id/cancel',
    output: parseScheduledPost,
  }),`
      : ''
  }
})
`
}

function cfWorkerTs(opts: ScaffoldOptions): string {
  const rooms = usesRooms(opts)
  const agent = hasExample(opts, 'agent')
  const imports = hasExample(opts, 'import')
  const files = hasExample(opts, 'files')
  const exports = hasExample(opts, 'export')
  const usage = hasExample(opts, 'usage')
  const crud = hasExample(opts, 'crud')
  const live = hasExample(opts, 'live')
  const voice = hasExample(opts, 'voice')
  const publish = hasExample(opts, 'publish')
  const webhooks = hasExample(opts, 'webhooks')
  const digest = hasExample(opts, 'digest')
  const search = hasExample(opts, 'search')
  const checkout = hasExample(opts, 'checkout')
  const newsletter = hasExample(opts, 'newsletter')
  const billing = usesBilling(opts)
  const d1 = usesD1(opts)
  const ai = usesAgents(opts)
  const limiter = usesLimiter(opts)
  const access = opts.auth === 'access'
  const emailAuth = emailSignIn(opts)
  const oauth = oauthSignIn(opts)
  const accounts = hasAccounts(opts)
  const social = hasExample(opts, 'social')
  const guards = [
    ...(access ? ['requireAccess'] : []),
    ...(limiter ? ['clientIp', 'rateLimit'] : []),
  ]
  const custom = rooms || ai || files || exports || access || live || limiter || publish || accounts
  const isAsync =
    ai ||
    files ||
    exports ||
    access ||
    limiter ||
    webhooks ||
    publish ||
    checkout ||
    newsletter ||
    accounts
  // Rooms the server writes: never opened through /api/rooms/:name, where clients may write.
  const serverRooms = [
    ...(imports ? ['job-'] : []),
    ...(webhooks ? ['webhooks$'] : []),
    ...(checkout ? ['order-'] : []),
    ...(newsletter ? ['issue-'] : []),
  ]
  // Writes that need no signed-in user even with accounts: webhooks carry a signature instead of a
  // session, and a newsletter's readers have no account.
  const signedPaths = [
    ...(webhooks ? ['/api/webhooks/'] : []),
    ...(checkout ? ['/api/stripe/'] : []),
    ...(newsletter ? ['/api/sns/'] : []),
  ]
  const readerPaths = newsletter
    ? ['/api/newsletter/subscribe', '/api/newsletter/confirm', '/api/newsletter/unsubscribe']
    : []
  const openPaths = [...signedPaths, ...readerPaths]
  return `${usage ? `import type { AnalyticsDataset } from '@cascivo/app/analytics'\n` : ''}${d1 ? `import type { Database } from '@cascivo/app/db'\n` : ''}${exports ? `import { handleExport } from '@cascivo/app/export'\n` : ''}import { createHandler${publish ? ', HttpError' : ''} } from '@cascivo/app/api'
${accounts ? `import { ${emailAuth ? 'handleAuth, ' : ''}requireUser } from '@cascivo/app/auth-server'\n` : ''}${oauth ? `import { github, google, linkedin } from '@cascivo/app/oauth'\nimport type { OAuthProvider } from '@cascivo/app/oauth'\nimport { handleOAuth } from '@cascivo/app/oauth-server'\n` : ''}${guards.length > 0 || webhooks || accounts ? `import { ${[...guards, 'guardResponse'].sort().join(', ')} } from '@cascivo/app/guard'\n${limiter ? `import type { RateLimiter } from '@cascivo/app/guard'\n` : ''}` : ''}${imports ? `import { jobReporter } from '@cascivo/app/jobs-server'\n` : ''}${
    files
      ? `import { handleUploads, listUploads } from '@cascivo/app/uploads-server'
import type { ImageResizer, UploadBucket } from '@cascivo/app/uploads-server'
`
      : ''
  }${
    live
      ? `import { recordLive } from '@cascivo/app/live-server'
import type { LiveBatch, LiveQueue } from '@cascivo/app/live-server'
`
      : ''
  }${
    rooms || live
      ? `import { roomResponse } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
`
      : ''
  }${
    exports
      ? `import puppeteer from '@cloudflare/puppeteer'
import type { BrowserWorker } from '@cloudflare/puppeteer'
`
      : ''
  }${ai ? `import { routeAgentRequest } from 'agents'\n` : ''}import { api, TICKS_PER_STREAM } from '../src/api'
import type { Tick } from '../src/api'
${imports ? `import { importJob } from '../src/import-job'\n` : ''}${files ? `import { uploads } from '../src/upload-policy'\n` : ''}${usage ? `import { usageMetrics } from '../src/usage'\nimport { usageReport } from './usage'\n` : ''}${live ? `import { OPS_ROOM, ops } from '../src/ops'\n` : ''}${emailAuth ? `import { sendSignInLink } from './auth'\nimport type { SignInSender } from './auth'\n` : ''}${crud ? `import * as customerStore from './customers'\n` : ''}${publish ? `import * as pageStore from './pages'\nimport { renderPageHtml } from './page-html'\nimport type { Assets } from './page-html'\n${exports ? `import { pagePreview } from './page-preview'\n` : ''}` : ''}${webhooks ? `import * as webhookStore from './webhooks'\nimport { DELIVERIES_ROOM } from '../src/webhooks'\n` : ''}${digest ? `import * as digestJob from './digest'\nimport type { DigestSender } from './digest'\n` : ''}${search ? `import * as articleSearch from './search'\nimport type { ${ai ? '' : 'Embedder, '}VectorIndex } from './search'\n` : ''}${billing ? `import * as billingStore from './billing'\n` : ''}${social ? `import * as socialStore from './social'\nimport type { ReminderSender, SocialMediaBucket, SocialPostParams } from './social'\n` : ''}${checkout ? `import * as orderStore from './checkout'\nimport type { ReceiptSender } from './checkout'\nimport { ORDER_ID, orderRoom } from '../src/checkout'\n` : ''}${newsletter ? `import * as newsletterStore from './newsletter'\nimport type { NewsletterBatch, NewsletterQueue } from './newsletter'\nimport { ISSUE_ID, issueRoom } from '../src/newsletter'\n` : ''}${
    rooms
      ? `
// The Durable Object class behind every room. wrangler.jsonc binds it as ROOMS, and it must be
// exported from the Worker's main module.
export { SyncRoom } from '@cascivo/app/sync-server'
`
      : ''
  }${
    agent
      ? `
// The Durable Object behind /assistant: one per conversation (worker/assistant.ts).
export { Assistant } from './assistant'
`
      : ''
  }${
    voice
      ? `
// The Durable Object behind /voice: one per conversation (worker/voice.ts).
export { Voice } from './voice'
`
      : ''
  }${
    live
      ? `
// The Durable Object behind /ops: the last two minutes, per second (src/ops.ts).
export { LiveRoom } from '@cascivo/app/live-server'
`
      : ''
  }${
    imports
      ? `
// The Workflow behind /import (worker/import-job.ts), bound as IMPORT_JOB.
export { ImportJob } from './import-job'
`
      : ''
  }${
    social
      ? `
// The Workflow behind each scheduled post (worker/social-post.ts), bound as SOCIAL_POST.
export { SocialPost } from './social-post'
`
      : ''
  }
/**
 * Add bindings (KV, D1, R2, Durable Objects, Workers AI) in wrangler.jsonc and type them
 * here; every handler receives them as \`env\`.
 */
${
  rooms ||
  ai ||
  files ||
  exports ||
  usage ||
  d1 ||
  access ||
  live ||
  accounts ||
  social ||
  webhooks ||
  digest ||
  search ||
  checkout ||
  newsletter
    ? `export interface Env {${ai ? '\n  /** Workers AI, bound in wrangler.jsonc. */\n  AI: Ai' : search ? '\n  /** Workers AI, bound in wrangler.jsonc. */\n  AI: Embedder' : ''}${search ? '\n  ARTICLES_INDEX: VectorIndex' : ''}${rooms ? '\n  ROOMS: RoomNamespace<unknown>' : ''}${imports ? '\n  IMPORT_JOB: Workflow<{ csv: string }>' : ''}${files ? '\n  FILES: UploadBucket\n  IMAGES: ImageResizer' : ''}${exports ? '\n  BROWSER: BrowserWorker' : ''}${usage ? '\n  USAGE: AnalyticsDataset\n  /** Secrets for reading Analytics Engine back (see README). */\n  CF_ACCOUNT_ID?: string\n  CF_API_TOKEN?: string' : ''}${d1 ? '\n  DB: Database' : ''}${publish ? '\n  ASSETS: Assets' : ''}${live ? '\n  LIVE: RoomNamespace<unknown>\n  EVENTS: LiveQueue' : ''}${limiter ? '\n  LIMITER: RateLimiter' : ''}${access ? '\n  /** Set in wrangler.jsonc (see README). */\n  ACCESS_TEAM_DOMAIN: string\n  ACCESS_AUD: string' : ''}${webhooks ? '\n  /** The webhook signing secret: `wrangler secret put WEBHOOK_SECRET` (.dev.vars locally). */\n  WEBHOOK_SECRET: string' : ''}${emailAuth || digest || checkout || social ? `\n  EMAIL: ${[emailAuth ? 'SignInSender' : '', digest ? 'DigestSender' : '', checkout ? 'ReceiptSender' : '', social ? 'ReminderSender' : ''].filter(Boolean).join(' & ')}` : ''}${emailAuth ? '\n  /** The From address of sign-in emails, set in wrangler.jsonc. */\n  AUTH_FROM: string' : ''}${oauth ? '\n  /** Sign-in with GitHub, Google and LinkedIn: `wrangler secret put` (.dev.vars locally). A provider is\n   * offered once both its id and secret are set; AUTH_SECRET seals the sign-in state. */\n  AUTH_SECRET?: string\n  GITHUB_CLIENT_ID?: string\n  GITHUB_CLIENT_SECRET?: string\n  GOOGLE_CLIENT_ID?: string\n  GOOGLE_CLIENT_SECRET?: string\n  LINKEDIN_CLIENT_ID?: string\n  LINKEDIN_CLIENT_SECRET?: string' : social ? "\n  /** Seals connected accounts' tokens, and LinkedIn's app: `wrangler secret put` (.dev.vars\n   * locally). LinkedIn is offered once both its values are set. */\n  AUTH_SECRET?: string\n  LINKEDIN_CLIENT_ID?: string\n  LINKEDIN_CLIENT_SECRET?: string" : ''}${social ? '\n  /** Bluesky: an ES256 private JWK (README); unset, the app is a public client. */\n  BLUESKY_PRIVATE_JWK?: string\n  /** A Buffer app client (README); Buffer is offered once its id is set. */\n  BUFFER_CLIENT_ID?: string\n  BUFFER_CLIENT_SECRET?: string\n  /** A Meta app with the Threads use case (README); Threads is offered once both are set. */\n  THREADS_APP_ID?: string\n  THREADS_APP_SECRET?: string\n  SOCIAL_POST: Workflow<SocialPostParams>\n  SOCIAL_MEDIA: SocialMediaBucket\n  /** Reconnect reminders (worker/social.ts), set in wrangler.jsonc. */\n  REMINDER_FROM: string' + (digest ? '' : '\n  APP_URL: string') : ''}${digest ? '\n  /** The weekly digest (worker/digest.ts), set in wrangler.jsonc. */\n  DIGEST_TO: string\n  DIGEST_FROM: string\n  APP_URL: string' : ''}${checkout ? '\n  /** The From address of receipts, set in wrangler.jsonc. */\n  RECEIPT_FROM: string\n  /** Stripe secrets: `wrangler secret put` (.dev.vars locally). Unset until you add them. */\n  STRIPE_SECRET_KEY?: string\n  STRIPE_WEBHOOK_SECRET?: string' : ''}${newsletter ? '\n  NEWSLETTER: NewsletterQueue\n  /** The newsletter (worker/newsletter.ts), set in wrangler.jsonc. */\n  AWS_REGION: string\n  NEWSLETTER_FROM: string\n  SNS_TOPIC_ARN: string\n  /** Secrets: `wrangler secret put` (.dev.vars locally). Unset until you add them. */\n  AWS_ACCESS_KEY_ID?: string\n  AWS_SECRET_ACCESS_KEY?: string\n  NEWSLETTER_KEY?: string' : ''}
}`
    : `// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- bindings are added as members
export interface Env {}`
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
${
  oauth
    ? `
/** The sign-in providers with both an id and a secret set; the others are not offered. */
function oauthProviders(env: Env): OAuthProvider[] {
  const providers: OAuthProvider[] = []
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.push(
      github({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }),
    )
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    )
  }
  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    providers.push(
      linkedin({ clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET }),
    )
  }
  return providers
}
`
    : ''
}${
    limiter
      ? `
/**
 * Requests that each count against LIMITER:
${[
  emailAuth ? 'a sign-in email' : '',
  digest ? 'a digest sent now (it starts a browser)' : '',
  search ? 'indexing the articles (it embeds every one)' : '',
  checkout ? 'a checkout started (it creates a Stripe session and an order)' : '',
  billing ? 'a subscription checkout or billing portal opened' : '',
  newsletter ? 'a newsletter sign-up (it sends an email), and each use of the newsletter key' : '',
  files ? 'a new upload (not each part of one)' : '',
  exports ? 'an export' : '',
  publish ? 'a published page' : '',
  social ? 'connecting an account (Mastodon registers the app with the server), or a post' : '',
]
  .filter(Boolean)
  .map((item) => ` * - ${item}`)
  .join('\n')}
 */
function countsAgainstLimit(request: Request): boolean {
  const url = new URL(request.url)${
    search
      ? `
  if (url.pathname === '/api/search/index') return request.method === 'POST'`
      : ''
  }${
    digest
      ? `
  if (url.pathname === '/api/digest/run') return request.method === 'POST'`
      : ''
  }${
    checkout
      ? `
  if (url.pathname === '/api/checkout') return request.method === 'POST'`
      : ''
  }${
    billing
      ? `
  if (url.pathname === '/api/billing/subscribe' || url.pathname === '/api/billing/portal') {
    return request.method === 'POST'
  }`
      : ''
  }${
    newsletter
      ? `
  if (/^\\/api\\/newsletter\\/(subscribe|overview|preview|issues)$/.test(url.pathname)) {
    return request.method === 'POST'
  }`
      : ''
  }${
    emailAuth
      ? `
  if (url.pathname === '/api/auth/start') return request.method === 'POST'`
      : ''
  }${
    social
      ? `
  if (/^\\/api\\/connections\\/[a-z-]+$/.test(url.pathname)) return request.method === 'GET'
  if (url.pathname === '/api/social/posts') return request.method === 'POST'
  if (url.pathname.startsWith('/api/social/images')) return request.method !== 'GET'`
      : ''
  }${
    publish
      ? `
  if (url.pathname === '/api/pages') return request.method === 'POST'`
      : ''
  }${
    files
      ? `
  if (url.pathname === uploads.path) {
    const step = url.searchParams.get('multipart')
    return (request.method === 'PUT' && step === null) || step === 'start'
  }`
      : ''
  }
  return ${exports ? "url.pathname === '/api/export'" : 'false'}
}
`
      : ''
  }
/**
 * One handler per endpoint in src/api.ts, typed from it. A stream handler is an async
 * generator: each \`yield\` is one server-sent event, and returning ends the stream. When the
 * client disconnects, \`signal\` aborts.
 */
const handleApi = createHandler<typeof api, Env>(api, {
  ticks: async function* ({ signal }) {
    for (let n = 1; n <= TICKS_PER_STREAM && !signal.aborted; n++) {
      const tick: Tick = { n, at: new Date().toISOString() }
      yield tick
      await sleep(1000)
    }
  },${
    imports
      ? `
  // The job's room exists (as "queued") before the Workflow starts, so the page has
  // something to show at once.
  startImport: async ({ body, env }) => {
    const id = crypto.randomUUID()
    await jobReporter(importJob, env.ROOMS, id).queued()
    await env.IMPORT_JOB.create({ id, params: { csv: body.csv } })
    return { id }
  },`
      : ''
  }${files ? `\n  listFiles: ({ env }) => listUploads(env.FILES),` : ''}${
    usage
      ? `
  usage: ({ env }) =>
    usageReport(
      env.CF_ACCOUNT_ID && env.CF_API_TOKEN
        ? { accountId: env.CF_ACCOUNT_ID, apiToken: env.CF_API_TOKEN }
        : null,
    ),`
      : ''
  }${
    crud
      ? `
  customers: ({ body, env }) => customerStore.listCustomers(env.DB, body),
  createCustomer: ({ body, env }) => customerStore.createCustomer(env.DB, body),
  updateCustomer: ({ params, body, env }) => customerStore.updateCustomer(env.DB, params.id, body),
  deleteCustomer: ({ params, env }) => customerStore.deleteCustomer(env.DB, params.id),`
      : ''
  }${
    publish
      ? `
  publishPage: ({ body, env }) => pageStore.publishPage(env.DB, body),
  getPage: ({ params, env }) => pageStore.getPage(env.DB, params.slug),`
      : ''
  }${
    webhooks
      ? `
  listDeliveries: ({ env }) => webhookStore.listDeliveries(env.DB),
  sendTestDelivery: ({ request, env }) => webhookStore.sendTestDelivery(request.url, env),`
      : ''
  }${
    search
      ? `
  search: ({ body, env }) => articleSearch.search(env, body.q),
  indexArticles: ({ env }) => articleSearch.indexArticles(env),`
      : ''
  }${
    checkout
      ? `
  startCheckout: ({ request, env }) => orderStore.startCheckout(env, new URL(request.url).origin),
  getOrder: ({ params, request, env }) =>
    orderStore.getOrder(env, params.id, new URL(request.url).origin),`
      : ''
  }${
    billing
      ? `
  getBilling: ({ request, env }) => billingStore.getBilling(env, request),
  startSubscription: ({ request, env }) =>
    billingStore.startSubscription(env, request, new URL(request.url).origin),
  syncBilling: ({ body, request, env }) => billingStore.syncBilling(env, request, body.sessionId),
  openBillingPortal: ({ request, env }) =>
    billingStore.openPortal(env, request, new URL(request.url).origin),`
      : ''
  }${
    newsletter
      ? `
  subscribe: ({ body, request, env }) =>
    newsletterStore.subscribe(env, body.email, new URL(request.url).origin),
  confirmSubscription: ({ body, env }) => newsletterStore.confirm(env, body.token),
  newsletterOverview: ({ body, env }) => newsletterStore.overview(env, body.key),
  previewIssue: ({ body, request, env }) =>
    newsletterStore.preview(env, body, new URL(request.url).origin),
  sendIssue: ({ body, request, env }) =>
    newsletterStore.sendIssue(env, body, new URL(request.url).origin),`
      : ''
  }${
    social
      ? `
  getSocial: ({ request, env }) => socialStore.getSocial(env, request),
  schedulePost: ({ body, request, env }) => socialStore.schedulePost(env, request, body),
  cancelPost: ({ params, request, env }) => socialStore.cancelPost(env, request, params.id),`
      : ''
  }${
    digest
      ? `
  digestRuns: ({ env }) => digestJob.listRuns(env.DB),
  runDigest: ({ request, env }) =>
    digestJob.runDigest(
      env,
      () => puppeteer.launch(env.BROWSER),
      'manual',
      new URL(request.url).origin,
    ),`
      : ''
  }${
    live
      ? `
  // Each event is placed by the Worker's clock: a browser's is not trusted to say when.
  sendEvents: async ({ body, env }) => {
    const at = Date.now()
    if (body.length > 0) {
      await env.EVENTS.sendBatch(body.map((event) => ({ body: { at, values: event.values } })))
    }
    return { accepted: body.length }
  },`
      : ''
  }
})
${
  usage
    ? `
/** Every API request, recorded in Analytics Engine; src/usage.ts names the columns. */
async function handleAndRecord(request: Request, env: Env): Promise<Response> {
  const started = Date.now()
  const response = await handleApi(request, env)
  usageMetrics.write(env.USAGE, {
    path: new URL(request.url).pathname,
    method: request.method,
    status: response.status,
    duration_ms: Date.now() - started,
  })
  return response
}
`
    : ''
}
// wrangler.jsonc routes only ${ai ? '/api/* and /agents/*' : '/api/*'} here; everything else is a static asset or index.html.
export default {
${
  custom
    ? `  ${isAsync ? 'async ' : ''}fetch(request: Request, env: Env): Promise<Response>${isAsync ? '' : ' | Response'} {${
        access
          ? `
    // Cloudflare Access is in front of the app (README); this refuses a request that came
    // around it (straight to *.workers.dev, say). \`vite dev\` has no Access, so not there.
    if (!import.meta.env.DEV) {
      try {
        await requireAccess(request, {
          teamDomain: env.ACCESS_TEAM_DOMAIN,
          audience: env.ACCESS_AUD,
        })
      } catch (error) {
        return guardResponse(error)
      }
    }`
          : ''
      }${
        limiter
          ? `
    if (countsAgainstLimit(request)) {
      try {
        await rateLimit(env.LIMITER, clientIp(request))
      } catch (error) {
        return guardResponse(error)
      }
    }`
          : ''
      }${
        accounts
          ? `${
              emailAuth
                ? `
    // Sign-in links and sessions: /api/auth/* is answered here (worker/auth.ts sends mail).
    const signIn = await handleAuth(env.DB, {
      sendLink: (email, url) => sendSignInLink(env.EMAIL, env.AUTH_FROM, email, url),
      exposeLink: import.meta.env.DEV,
    })(request)
    if (signIn) return signIn`
                : ''
            }${
              oauth
                ? `
    // Sign-in with GitHub, Google and LinkedIn: /api/auth/oauth/* (and /me, /signout). A failed
    // sign-in lands on /account with ?error=.
    const signInWith = await handleOAuth(env.DB, {
      secret: env.AUTH_SECRET ?? '',
      providers: oauthProviders(env),
      errorPath: '/account',
    })(request)
    if (signInWith) return signInWith`
                : ''
            }
    // Every other API write needs a signed-in user; reads stay public.${signedPaths.length > 0 ? '\n    // Webhooks carry a signature instead of a session, and are checked by it.' : ''}${readerPaths.length > 0 ? '\n    // Newsletter readers sign up, confirm and unsubscribe without an account.' : ''}
    if (${
      openPaths.length > 0
        ? `
      request.method !== 'GET' &&
      request.method !== 'HEAD' &&${openPaths
        .map((prefix) => `\n      !new URL(request.url).pathname.startsWith('${prefix}')`)
        .join(' &&')}
    `
        : "request.method !== 'GET' && request.method !== 'HEAD'"
    }) {
      try {
        await requireUser(env.DB, request)
      } catch (error) {
        return guardResponse(error)
      }
    }${
      social
        ? `
    // The accounts a user connects to post with (worker/social.ts): /api/connections/*, and
    // the client metadata Bluesky's servers read.
    const blueskyClient = socialStore.blueskyClient(env, request)
    if (blueskyClient) return blueskyClient
    const connected = await socialStore.connections(env)(request)
    if (connected) return connected
    // Images for posts: the user's own uploads, and the signed links Threads and Buffer fetch.
    const image =
      (await socialStore.images(env, request)) ?? (await socialStore.media(env, request))
    if (image) return image`
        : ''
    }`
          : ''
      }${
        ai
          ? `
    // /agents/<agent>/<conversation>: the WebSocket ${[agent ? 'useAgent()' : '', voice ? 'VoiceClient' : ''].filter(Boolean).join(' or ')} opens.
    const agent = await routeAgentRequest(request, env)
    if (agent) return agent`
          : ''
      }${
        files
          ? `
    // Uploads into R2 and the files they stored.${access ? '' : ' Anyone can upload: see README.'}
    const upload = await handleUploads(uploads, env.FILES, { images: env.IMAGES })(request)
    if (upload) return upload`
          : ''
      }${
        exports
          ? `
    // /api/export?page=/report&format=pdf — each export starts a browser.
    const exported = await handleExport(request, { launch: () => puppeteer.launch(env.BROWSER) })
    if (exported) return exported`
          : ''
      }${
        live
          ? `
    // The /ops dashboard's room: browsers watch it, and only the queue handler writes to it.
    if (new URL(request.url).pathname === '/api/live') {
      return roomResponse(request, env.LIVE, OPS_ROOM, { readOnly: true })
    }`
          : ''
      }${
        publish
          ? `
    // A published page: its HTML carries the page's title, description and content, for link
    // previews and readers without JavaScript (worker/page-html.ts). An unknown slug gets the
    // app itself, which says so.
    const pagePath = new URL(request.url).pathname
    const published = /^\\/p\\/([a-z0-9]{10})$/.exec(pagePath)
    if (published && request.method === 'GET') {
      try {
        const page = await pageStore.getPage(env.DB, published[1]!)${
          exports
            ? `
        const image = new URL(\`/api/pages/\${page.slug}/preview.png\`, request.url).href
        return await renderPageHtml(request, page, env.ASSETS, image)`
            : `
        return await renderPageHtml(request, page, env.ASSETS, null)`
        }
      } catch (error) {
        if (!(error instanceof HttpError)) throw error
        return env.ASSETS.fetch(request)
      }
    }${
      exports
        ? `
    // Its link-preview image, rendered once by Browser Run (worker/page-preview.ts).
    const preview = /^\\/api\\/pages\\/([a-z0-9]{10})\\/preview\\.png$/.exec(pagePath)
    if (preview && request.method === 'GET') {
      try {
        return await pagePreview(env.DB, preview[1]!, new URL(request.url).origin, () =>
          puppeteer.launch(env.BROWSER),
        )
      } catch (error) {
        return guardResponse(error)
      }
    }`
        : ''
    }`
          : ''
      }${
        webhooks
          ? `
    const path = new URL(request.url).pathname
    // Signed deliveries from GitHub (worker/webhooks.ts); a bad signature is a 401.
    if (path === webhookStore.GITHUB_WEBHOOK_PATH && request.method === 'POST') {
      try {
        return await webhookStore.receiveGithub(request, env)
      } catch (error) {
        return guardResponse(error)
      }
    }
    // New deliveries, pushed to the /webhooks page: it may watch, never write.
    if (path === '/api/webhooks/live') {
      return roomResponse(request, env.ROOMS, DELIVERIES_ROOM, { readOnly: true })
    }`
          : ''
      }${
        checkout
          ? `
    const checkoutPath = new URL(request.url).pathname
    // Stripe's webhook (worker/checkout.ts); a bad signature is a 401.
    if (checkoutPath === orderStore.STRIPE_WEBHOOK_PATH && request.method === 'POST') {
      try {
        return await orderStore.receiveStripe(request, env${
          billing ? ', billingStore.billingHooks(env)' : ''
        })
      } catch (error) {
        return guardResponse(error)
      }
    }
    // An order's page watches its room for what Stripe reports: it may watch, never write.
    const orderLive = /^\\/api\\/orders\\/([^/]+)\\/live$/.exec(checkoutPath)
    if (orderLive && ORDER_ID.test(orderLive[1]!)) {
      return roomResponse(request, env.ROOMS, orderRoom(orderLive[1]!), { readOnly: true })
    }`
          : ''
      }${
        newsletter
          ? `
    const newsletterPath = new URL(request.url).pathname
    // One-click unsubscribe (RFC 8058) and the unsubscribe page's button.
    if (newsletterPath === '/api/newsletter/unsubscribe' && request.method === 'POST') {
      return newsletterStore.unsubscribe(request, env)
    }
    // SES bounces and complaints, delivered by SNS (worker/newsletter.ts); verified by signature.
    if (newsletterPath === '/api/sns/ses' && request.method === 'POST') {
      try {
        return await newsletterStore.receiveFeedback(request, env)
      } catch (error) {
        return guardResponse(error)
      }
    }
    // An issue's sending progress, for the composer: it may watch, never write.
    const issueLive = /^\\/api\\/newsletter\\/issues\\/([^/]+)\\/live$/.exec(newsletterPath)
    if (issueLive && ISSUE_ID.test(issueLive[1]!)) {
      return roomResponse(request, env.ROOMS, issueRoom(issueLive[1]!), { readOnly: true })
    }`
          : ''
      }${
        hasExample(opts, 'board') || hasExample(opts, 'notes')
          ? `
    const room = /^\\/api\\/rooms\\/([^/]+)$/.exec(new URL(request.url).pathname)${
      serverRooms.length > 0
        ? `
    // Rooms only the server writes are watched read-only at their own routes, never opened
    // here: ${[imports ? "a job's progress" : '', webhooks ? 'webhook deliveries' : '', checkout ? 'orders' : '', newsletter ? 'newsletter issues' : ''].filter(Boolean).join(', ')}.
    if (room && !/^(${serverRooms.join('|')})/.test(room[1]!)) {
      return roomResponse(request, env.ROOMS, room[1]!)
    }`
        : `
    if (room) return roomResponse(request, env.ROOMS, room[1]!)`
    }`
          : ''
      }${
        imports
          ? `
    // A job's progress: the browser may watch its room, never write to it.
    const job = /^\\/api\\/jobs\\/([\\w-]{1,60})$/.exec(new URL(request.url).pathname)
    if (job) {
      return roomResponse(request, env.ROOMS, importJob.roomName(job[1]!), { readOnly: true })
    }`
          : ''
      }
    return ${usage ? 'handleAndRecord' : 'handleApi'}(request, env)
  },`
    : `  fetch: ${usage ? 'handleAndRecord' : 'handleApi'},`
}${
    digest && social
      ? `
  // The Cron Triggers in wrangler.jsonc, told apart by their schedule.
  async scheduled(event: { cron: string }, env: Env): Promise<void> {
    // Threads tokens renewed, and reminders for those that cannot be (worker/social.ts).
    if (event.cron === '${SOCIAL_CRON}') {
      await socialStore.renewConnections(env)
      return socialStore.remindExpiring(env)
    }
    // The weekly digest, recorded whatever happens.
    await digestJob.runDigest(env, () => puppeteer.launch(env.BROWSER), 'cron')
  },`
      : digest
        ? `
  // The Cron Trigger in wrangler.jsonc: the weekly digest, recorded whatever happens.
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await digestJob.runDigest(env, () => puppeteer.launch(env.BROWSER), 'cron')
  },`
        : social
          ? `
  // The Cron Trigger in wrangler.jsonc: Threads tokens renewed, then reminders for the ones
  // that cannot be (LinkedIn).
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await socialStore.renewConnections(env)
    await socialStore.remindExpiring(env)
  },`
          : ''
  }${
    live && newsletter
      ? `
  // Two queues, one handler: each batch says which queue it came from. A throw retries it.
  async queue(batch: LiveBatch & NewsletterBatch & { queue: string }, env: Env): Promise<void> {
    // NEWSLETTER: one message of readers at a time, through SES (worker/newsletter.ts).
    if (batch.queue === '${newsletterQueue(opts)}') return newsletterStore.deliver(env, batch)
    // EVENTS: into the dashboard's room.
    await recordLive(
      ops,
      env.LIVE,
      OPS_ROOM,
      batch.messages.map((message) => message.body),
    )
  },`
      : live
        ? `
  // The EVENTS queue, a batch at a time, into the dashboard's room. A throw retries the batch.
  async queue(batch: LiveBatch, env: Env): Promise<void> {
    await recordLive(
      ops,
      env.LIVE,
      OPS_ROOM,
      batch.messages.map((message) => message.body),
    )
  },`
        : newsletter
          ? `
  // The NEWSLETTER queue: one message of readers at a time, through SES
  // (worker/newsletter.ts). A throw retries the message; readers already sent are skipped.
  async queue(batch: NewsletterBatch, env: Env): Promise<void> {
    await newsletterStore.deliver(env, batch)
  },`
          : ''
  }
}
`
}

/** Route pattern for a section: the first is `/`, the rest by key. */
function cfSectionPath(section: Section, index: number): string {
  return index === 0 ? '/' : `/${section.key}`
}

/** Route file for a section, relative to `src/routes/`. */
function cfSectionFile(section: Section, index: number): string {
  return index === 0 ? 'index.tsx' : `${section.key}.tsx`
}

function cfAppTsx(sections: Section[], recipes: string[], opts: ScaffoldOptions): string {
  const items = [
    ...sections.map((s, i) => ({ label: s.label, href: cfSectionPath(s, i) })),
    ...recipes.flatMap((recipe) => loadRecipe(recipe).nav),
  ]
  const navItems = items
    .map(
      (item) => `    {
      label: '${item.label.replace(/'/g, "\\'")}',
      href: '${item.href}',
      active: path === '${item.href}',
    },`,
    )
    .join('\n')
  const exports = hasExample(opts, 'export')
  return `import { RouterView } from '@cascivo/app'
${exports ? `import { isExporting } from '@cascivo/app/export'\n` : ''}import { Spinner, useSignals, type SideNavItem } from '@cascivo/react'
import { router } from './router'
import { Shell } from './Shell'

export default function App() {
  useSignals()
  const path = router.pathname.value

  // \`href\`s, not click handlers: main.tsx registers the router's Link, so these navigate
  // client-side while middle-click and "open in new tab" still work.
  const navItems: SideNavItem[] = [
${navItems}
  ]
${
  exports
    ? `
  // Rendered by /api/export: the page alone, without the shell (which gave it its padding).
  if (isExporting()) {
    return (
      <div style={{ padding: 'var(--cascivo-space-8)' }}>
        <RouterView router={router} fallback={<Spinner label="Loading" />} />
      </div>
    )
  }
`
    : ''
}
  return (
    <Shell navItems={navItems}>
      <RouterView router={router} fallback={<Spinner label="Loading" />} />
    </Shell>
  )
}
`
}

function cfFirstRouteTsx(section: Section): string {
  return `import { Flex, Heading, Text } from '@cascivo/react'
import { LiveCard } from '../LiveCard'

export default function ${section.component}() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>${section.label}</Heading>
        <Text muted>
          Edit <code>src/routes/index.tsx</code> to build out this page.
        </Text>
      </Flex>
      <LiveCard />
    </Flex>
  )
}
`
}

function cfRouteTsx(section: Section, index: number): string {
  // The Vite scaffold's section, as a route file: a default export, at its own URL.
  return sectionTsx(section)
    .replace(
      `export function ${section.component}()`,
      `export default function ${section.component}()`,
    )
    .replace(`src/sections/${section.component}.tsx`, `src/routes/${cfSectionFile(section, index)}`)
}

/* --- `--example social`: scheduled posts to connected LinkedIn and Mastodon accounts --- */

/** Daily, off the hour: renews Threads tokens in their last 30 days (\`renewConnections\`). */
const SOCIAL_CRON = '17 4 * * *'

function cfAccountRouteTsx(opts: ScaffoldOptions): string {
  const email = emailSignIn(opts)
  const oauth = oauthSignIn(opts)
  const lead = email
    ? oauth
      ? 'Continue with GitHub, Google or LinkedIn, or get a one-time link by email. No password.'
      : 'No password: we email you a link that signs you in once.'
    : 'Continue with GitHub, Google or LinkedIn. No password.'
  return `import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,${email ? '\n  Input,\n  Link,' : ''}
  Spinner,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
${email ? "import type { FormEvent } from 'react'\n" : ''}import { auth } from '../auth'${oauth ? "\nimport { router } from '../router'" : ''}
${
  email
    ? `
const sentTo = signal<string | null>(null)
/** Set only in \`vite dev\`, where no email is sent: the link to open instead. */
const devLink = signal<string | null>(null)
const failure = signal<string | null>(null)
const sending = signal(false)

async function start(event: FormEvent<HTMLFormElement>): Promise<void> {
  event.preventDefault()
  const email = new FormData(event.currentTarget).get('email')
  if (typeof email !== 'string') return
  failure.value = null
  sending.value = true
  try {
    const { link } = await auth.start(email)
    sentTo.value = email
    devLink.value = link
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not send the link'
  } finally {
    sending.value = false
  }
}
`
    : ''
}${
    oauth
      ? `
const LABELS: Record<string, string> = { github: 'GitHub', google: 'Google', linkedin: 'LinkedIn' }

/** The providers the Worker offers: those with an id and a secret set (README). */
const providers = signal<string[] | null>(null)
auth.providers().then(
  (list) => {
    providers.value = list
  },
  () => {
    providers.value = []
  },
)

/** Why the last sign-in with a provider failed: the Worker sends it back as \`?error=\`. */
const REASONS: Record<string, string> = {
  denied: 'You did not allow access, so you are not signed in.',
  expired: 'The sign-in took too long, or started in another browser. Try again.',
  state_mismatch: 'That sign-in did not match the one this browser started. Try again.',
  provider_error: 'The provider did not confirm who you are. Try again, or use another way in.',
  identity_in_use: 'That account is already linked to another user here.',
}
`
      : ''
  }
export default function Account() {
  useSignals()
  const user = auth.user.value${
    oauth
      ? `
  const reason = new URLSearchParams(router.search.value).get('error')`
      : ''
  }

  if (user === undefined) return <Spinner label="Loading" />
  if (user) {
    return (
      <Flex gap={4}>
        <Heading level={1}>Account</Heading>
        <Card>
          <CardContent>
            <Flex gap={3}>
              <Text>{user.email ? \`Signed in as \${user.email}\` : 'Signed in'}</Text>
              <Flex direction="horizontal">
                <Button variant="secondary" onClick={() => void auth.signOut()}>
                  Sign out
                </Button>
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    )
  }
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Sign in</Heading>
        ${
          // Prettier's width: a lead too long for one line goes on its own.
          `<Text muted>${lead}</Text>`.length + 8 > 100
            ? `<Text muted>\n          ${lead}\n        </Text>`
            : `<Text muted>${lead}</Text>`
        }
      </Flex>${
        oauth
          ? `
      {reason ? (
        <Alert variant="destructive" title="Not signed in">
          {REASONS[reason] ?? 'Sign-in failed. Try again.'}
        </Alert>
      ) : null}
      {providers.value === null ? (
        <Spinner label="Loading" />
      ) : providers.value.length === 0 ? (
        <Alert variant="info" title="No provider is set up yet">
          Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, or the GOOGLE_ pair, in .dev.vars (README).
        </Alert>
      ) : (
        <Flex direction="horizontal" gap={2} wrap>
          {providers.value.map((id) => (
            // A plain link: the Worker redirects to the provider, and back here afterwards.
            <Button key={id} asChild variant="secondary">
              <a href={auth.signInUrl(id, '/account')}>Continue with {LABELS[id] ?? id}</a>
            </Button>
          ))}
        </Flex>
      )}`
          : ''
      }${
        email
          ? `
      {sentTo.value ? (
        <Alert variant="success" title="Check your email">
          We sent a sign-in link to {sentTo.value}. It works once, for 15 minutes.
        </Alert>
      ) : null}
      {devLink.value ? (
        <Alert variant="info" title="vite dev sends no email">
          <Link href={devLink.value}>Open the sign-in link</Link>
        </Alert>
      ) : null}
      {failure.value ? (
        <Alert variant="destructive" title="Not sent">
          {failure.value}
        </Alert>
      ) : null}
      <form onSubmit={(event) => void start(event)}>
        <Flex direction="horizontal" align="end" gap={2} wrap>
          <Input name="email" type="email" label="Email" autoComplete="email" required />
          <Button type="submit" loading={sending.value}>
            Email me a link
          </Button>
        </Flex>
      </form>`
          : ''
      }
    </Flex>
  )
}
`
}

function cfPrettierIgnore(): string {
  return `${prettierIgnore()}# Rewritten by @cascivo/app/vite whenever a route file changes.
src/routes.gen.ts
`
}

function cfGitignore(): string {
  return `node_modules
dist
.wrangler
.dev.vars*
!.dev.vars.example
*.local
.DS_Store
`
}

function cfReadme(opts: ScaffoldOptions): string {
  const pm = opts.pm ?? 'npm'
  const runtime = runtimeOf(opts)
  return `# ${opts.name}

A [cascivo](https://cascivo.com) app on Cloudflare: a client-rendered
${runtime === 'preact' ? 'Preact' : 'React'} app and its API, deployed as one Worker.
There is no server rendering; the browser gets the app, and \`/api/*\` reaches the Worker.

## Develop

\`\`\`sh
${installAllCommand(pm)}
${runScriptCommand(pm, 'dev')}
\`\`\`

\`vite dev\` runs \`worker/index.ts\` in workerd, the same runtime as production, via
\`@cloudflare/vite-plugin\`.

## Deploy

\`\`\`sh
npx wrangler login   # once
${runExplicitCommand(pm, 'deploy')}
\`\`\`

## Share a preview (no account)

\`\`\`sh
${runExplicitCommand(pm, 'deploy:preview')}
\`\`\`

This builds the app, then deploys it to a temporary Cloudflare account with
\`wrangler deploy --temporary\`. You need no sign-up. It prints two URLs:

- **A public \`workers.dev\` URL** for the app.
- **A claim URL.** Open it and sign in within 60 minutes to keep the deployment; otherwise it is deleted.

It works only while wrangler is logged out. If you are logged in, use \`deploy\` instead.
A temporary account supports Workers, static assets, KV, D1 and Durable Objects. It does not
support Workers AI, R2, Workflows or Browser Run.${
    usesAgents(opts)
      ? ` So a preview serves the app, but its ${hasExample(opts, 'agent') ? 'assistant' : 'voice page'} cannot reach the model: deploy it\nto your own account for that.`
      : ''
  }

## Structure

- \`src/routes/\` — one file per page. \`index.tsx\` is \`/\`, \`settings.tsx\` is
  \`/settings\`, \`c/[id].tsx\` is \`/c/:id\` (it receives \`params.id\`), \`404.tsx\` is
  everything else. \`src/routes.gen.ts\` is rewritten from this folder; do not edit it.
- \`src/api.ts\` — the API contract both sides import: endpoints, their paths, and parsers
  for what crosses the network.
- \`worker/index.ts\` — the API's handlers, typed from \`src/api.ts\`. Add bindings (KV,
  D1, R2, Durable Objects, Workers AI) in \`wrangler.jsonc\`; handlers receive them as \`env\`.
- \`src/live.ts\` + \`src/LiveCard.tsx\` — a streaming endpoint read through the typed
  client into signals.
- \`src/App.tsx\` — the nav (real \`href\`s) and the \`RouterView\`.
- \`src/Shell.tsx\` — the app shell (header + side nav + content slot).

Persist client state with \`persistedSignal\` from \`@cascivo/storage\` (localStorage or
IndexedDB).${
    hasExample(opts, 'board')
      ? `

## Board (multiplayer)

\`/board\` is a shared board. Open it in two windows: notes, edits and cursors sync live.

- \`src/board.ts\` — \`connectRoom('/api/rooms/<name>')\` from \`@cascivo/app/sync\`; \`room.map('notes', parseNote)\`
  is a signal every visitor shares, and \`room.presence\` carries cursors.
- \`worker/index.ts\` — exports \`SyncRoom\`, one Durable Object per room, and routes
  \`/api/rooms/:name\` to it (bound as \`ROOMS\` in \`wrangler.jsonc\`).
- \`/board?room=team\` is a separate board.

Each path (one note) is last-writer-wins in the order the room receives writes, so two people
editing the same note at once settle on one value; editing different notes never collides.
Durable Objects work on a temporary account, so \`deploy:preview\` shares a live board with
no Cloudflare account.`
      : ''
  }${
    hasExample(opts, 'notes')
      ? `

## Notes (local-first)

\`/notes\` keeps working when the connection drops. Edits are saved on this device and sync
when the room is reachable again; a badge shows how many are still waiting.

- \`src/notes.ts\` — \`connectRoom(url, { storage: indexedDBDriver() })\`: the room's last
  state and every unconfirmed edit are kept in IndexedDB, so offline edits survive a reload
  or a closed tab and go out on the next connection. \`room.unsynced\` counts them. (Opening
  the app with no network at all also needs its files cached, by a service worker.)
- The list is \`/notes?list=<name>\`. Without one, each browser makes its own and remembers
  it; open the same \`?list=\` on another device to sync with it.
- It uses the same \`SyncRoom\` Durable Object as any other room (\`ROOMS\` in
  \`wrangler.jsonc\`). To query notes across lists, override \`SyncRoom.onWrite\` and mirror
  each write into D1.

A note is last-writer-wins: an edit made offline replaces whatever the note held when it
arrives. Edits to different notes never collide.`
      : ''
  }${
    hasExample(opts, 'import')
      ? `

## Import (background job)

\`/import\` runs a CSV import as a Cloudflare Workflow and shows its progress live.

- \`worker/import-job.ts\` — \`ImportJob\`, the Workflow. Each \`step.do\` is retried on its own
  and its result kept, so a failure or a deploy resumes the job where it was. Put your writes
  in \`importContacts\`.
- \`src/import-job.ts\` — the job (\`defineJob\` from \`@cascivo/app/jobs\`): its steps and the
  parser for its result, shared by both sides.
- Progress is a read-only room: the Workflow reports with \`jobReporter\`
  (\`@cascivo/app/jobs-server\`), and the page watches \`/api/jobs/:id\` with \`watchJob\`. The job
  id is in the URL, so a reload or another tab picks the job back up.

Report from inside a \`step.do\`: a Workflow replays \`run()\` from the top after each step, and
a report outside one would run again. Workflows run in \`vite dev\` locally, but not on a
temporary account, so \`deploy:preview\` serves the page without starting imports.`
      : ''
  }${
    hasExample(opts, 'files')
      ? `

## Files (uploads)

\`/files\` uploads into R2 through the Worker, with progress, and shows resized previews.

- \`src/upload-policy.ts\` — what the app accepts (types, size), shared by both sides: the page
  checks a file before sending it, and the Worker enforces the same policy. SVG and HTML are
  refused by design; served from your origin they would run script.
- \`worker/index.ts\` — \`handleUploads\` (\`@cascivo/app/uploads-server\`) stores uploads, in
  parts above 16 MiB, under keys the Worker chooses, and serves them back with headers that
  stop any file running script. \`?w=320\` returns a WebP preview from Cloudflare Images.
- \`src/files.ts\` — \`startUpload\` gives each file progress and status signals.

Each caller (by IP) may start 20 uploads a minute (\`ratelimits\` in \`wrangler.jsonc\`).${
          opts.auth
            ? ''
            : `
**It has no auth.** Anyone who can reach the app can upload: put Cloudflare Access in front of
it (\`--auth access\`), add accounts (\`--auth email\`), or check who is asking in
\`worker/index.ts\` before \`handleUploads\` runs.`
        } Create the bucket once before deploying:
\`npx wrangler r2 bucket create ${packageName(opts.name)}-files\`. R2 and Images do not run on a
temporary account.`
      : ''
  }${
    hasExample(opts, 'export')
      ? `

## Report (PDF and PNG export)

\`/report\` has "Download PDF" and "Download PNG" buttons. The Worker renders the page in
Cloudflare's Browser Run and returns the file.

- \`worker/index.ts\` — \`handleExport\` (\`@cascivo/app/export\`) serves
  \`/api/export?page=/report&format=pdf\`. It opens the page at this app's own origin with
  \`?export=1\`, waits for the network to go quiet, and prints it. Only paths of this app
  outside \`/api/\` can be exported.
- \`src/App.tsx\` — \`isExporting()\` drops the shell, so the file holds the page alone.
- For a scheduled report, call \`exportPage\` from a Cron Trigger and attach the PDF to an
  email (\`sendEmail\` from \`@cascivo/email\` takes \`attachments\`).

The browser opens the page without the visitor's cookies, so a page that needs a session
renders signed out. Each export starts a browser session, which is billed, so each caller
(by IP) may start 20 a minute (\`ratelimits\` in \`wrangler.jsonc\`). In \`vite dev\` Browser Run starts a local Chrome (downloaded on
first use); it does not run on a temporary account.`
      : ''
  }${
    hasExample(opts, 'live')
      ? `

## Ops (live dashboard)

\`/ops\` charts orders, revenue and errors per second, and every open copy of the page moves
together as events arrive.

- \`src/ops.ts\` — \`defineLive\` (\`@cascivo/app/live\`): the metrics, and two minutes of
  per-second history.
- \`worker/index.ts\` — \`POST /api/events\` puts events on the \`EVENTS\` queue. The \`queue\`
  handler adds each batch into a \`LiveRoom\` Durable Object with \`recordLive\`, which keeps
  per-second totals and sends each change to the browsers watching \`/api/live\` (read-only).
- \`src/routes/ops.tsx\` — \`watchLive\` gives the window as a signal; the page sends simulated
  traffic while its switch is on. Real producers are anything with the queue binding: another
  Worker, a cron, a webhook handler.

A new viewer, or one back from a dropped connection, starts with the whole window. Delivery is
at least once: a batch retried after a lost reply counts twice. \`/api/events\` has no auth, so
anyone can move the numbers: check who is sending before real use (\`--auth access\` puts
Cloudflare Access in front of the Worker). Create the queue once before deploying:
\`npx wrangler queues create ${packageName(opts.name)}-events\`.`
      : ''
  }${
    hasExample(opts, 'usage')
      ? `

## Usage (analytics)

Every API request is recorded in Workers Analytics Engine, and \`/usage\` charts the last
24 hours: requests per hour, the busiest routes, errors and latency.

- \`src/usage.ts\` — \`defineMetrics\` (\`@cascivo/app/analytics\`) names the columns once
  (\`path\`, \`method\`, \`status\`, \`duration_ms\`), so writes and queries never disagree about
  which blob is which.
- \`worker/index.ts\` — \`handleAndRecord\` writes one data point per API request.
- \`worker/usage.ts\` — the queries, over Analytics Engine's SQL API.

Writing needs only the binding. **Reading needs two secrets**, because the SQL API is HTTP
with an account token:

\`\`\`sh
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN   # a token with Account Analytics: Read
\`\`\`

For \`vite dev\`, put both in \`.dev.vars\`. Data written locally is not in your account's
dataset, so in development the charts show what your deployed app recorded. Until the secrets
exist, the page says what to set.`
      : ''
  }${
    hasExample(opts, 'search')
      ? `

## Search (by meaning)

\`/search\` finds help articles by what a question means: "how do I get my money back" finds
Refunds, though they share no words. Each article is embedded with Workers AI
(\`@cf/baai/bge-base-en-v1.5\`) into a Vectorize index; a question is embedded the same way
and matched against it.

- \`worker/articles.ts\` — the articles, seeded into D1. Replace them with your own content.
- \`worker/search.ts\` — \`search\` and \`indexArticles\`. "Index articles" on the page embeds
  every article; Vectorize applies writes a few seconds later.

Create the index once before deploying, with the embedding model's dimensions:
\`npx wrangler vectorize create ${packageName(opts.name)}-articles --dimensions=768 --metric=cosine\`.
Neither Vectorize nor Workers AI runs locally, so \`vite dev\` searches by keyword with SQLite's
full-text search instead, and the page says so. \`VITE_REAL_AI=1 ${runScriptCommand(pm, 'dev')}\` uses the real ones
(after \`npx wrangler login\`). Workers AI and Vectorize bill per use beyond their free
allocations, and a temporary account has neither.`
      : ''
  }${
    hasExample(opts, 'digest')
      ? `

## Weekly digest (Cron Trigger)

Every Monday at 08:00 UTC (\`triggers.crons\` in \`wrangler.jsonc\`), the Worker renders
\`/report\` to a PDF with Browser Run and emails it. \`/digest\` lists each run — sent,
skipped or failed, and why — and "Send now" runs one at once.

- \`worker/digest.ts\` — \`runDigest\`: \`exportPage\` (\`@cascivo/app/export\`), then Email
  Service with the PDF attached. Every run is recorded in D1, so a digest that did not arrive
  says why.
- \`worker/index.ts\` — the \`scheduled\` handler the Cron Trigger calls.

Set \`DIGEST_TO\` (comma-separated), \`DIGEST_FROM\` (an address on a domain onboarded to Email
Service) and \`APP_URL\` (the deployed app's origin: a cron has no request to read it from) in
\`wrangler.jsonc\`. Until they are set, runs are recorded as skipped. To fire the cron in
\`vite dev\`, open \`/cdn-cgi/handler/scheduled\`; "Send now" uses the page's own origin, so it
needs no \`APP_URL\`. Browser Run starts a local Chrome in development.`
      : ''
  }${
    hasExample(opts, 'webhooks')
      ? `

## Webhooks

\`/webhooks\` lists GitHub webhook deliveries as they arrive. Point a repository's webhook at
\`https://<your app>/api/webhooks/github\` (content type \`application/json\`) with a secret, and
give the Worker the same secret:
\`npx wrangler secret put WEBHOOK_SECRET\`. Locally it is in \`.dev.vars\`, and "Send a test
delivery" signs one with it.

- \`worker/webhooks.ts\` — \`verifyWebhook\` (\`@cascivo/app/guard\`) checks the
  \`X-Hub-Signature-256\` HMAC over the raw body before anything is parsed, and refuses a bad
  signature with a 401. Each delivery is stored in D1 under GitHub's delivery id, so a retry is ignored, and a
  new one is written to a read-only room the page watches.
- \`verifyWebhook\` also checks Stripe (\`scheme: 'stripe'\`) and Standard Webhooks
  (\`'standard'\`: Svix, Clerk, Resend…), both with a five-minute timestamp window against
  replays.

The page answers within milliseconds, well inside GitHub's ten seconds. For slow work, send the
delivery to a Queue from \`receiveGithub\` and answer at once.`
      : ''
  }${
    hasExample(opts, 'checkout')
      ? `

## Checkout (Stripe)

\`/checkout\` sells one product on Stripe's hosted Checkout page: the card never touches this
app. Stripe tells the Worker when the payment succeeds; the Worker marks the order paid, pushes
it to the order page, and emails a receipt rendered with \`@cascivo/email\`.

1. In the Stripe dashboard, in test mode, copy the secret key (\`sk_test_…\`) into \`.dev.vars\`
   as \`STRIPE_SECRET_KEY\`, then run the app and buy with the card \`4242 4242 4242 4242\`.
   The order page confirms the payment by reading the session back from Stripe, so this works
   before any webhook is set up.
2. To receive the webhook locally, run
   \`stripe listen --forward-to localhost:5173/api/stripe/webhook\` (the Stripe CLI) and put the
   \`whsec_…\` secret it prints in \`.dev.vars\` as \`STRIPE_WEBHOOK_SECRET\`.
3. Deployed: \`npx wrangler secret put STRIPE_SECRET_KEY\` and
   \`npx wrangler secret put STRIPE_WEBHOOK_SECRET\`. In the dashboard, add a webhook endpoint
   at \`https://<your app>/api/stripe/webhook\` for \`checkout.session.completed\`,
   \`checkout.session.async_payment_succeeded\`, \`checkout.session.async_payment_failed\`,
   \`checkout.session.expired\`, \`charge.refunded\`, \`charge.dispute.created\` and
   \`charge.dispute.closed\`; its signing secret is \`STRIPE_WEBHOOK_SECRET\`.
4. Receipts: set \`RECEIPT_FROM\` in \`wrangler.jsonc\` to an address on a domain you have
   onboarded to Email Service. \`vite dev\` renders each receipt and logs it instead.

What you sell is \`PRODUCT\` in \`src/checkout.ts\`. The Worker sends that price to Stripe, so a
browser cannot change it.

- \`worker/checkout.ts\` — \`createStripe\` (\`@cascivo/app/stripe\`) creates the session, with
  the order id as its idempotency key. The webhook is checked by \`verifyWebhook\` (scheme
  \`stripe\`: signature and a five-minute window) before \`parseStripeEvent\` reads it.
- An order moves from \`pending\` to \`paid\`, \`failed\` or \`expired\` once. A retried event, or
  the page getting there before the webhook, changes nothing, so the receipt goes out once.
  Orders are found by Stripe's session id, never by \`client_reference_id\`, which a buyer can
  set on a Payment Link.
- A bank debit completes the session as \`unpaid\`: the order stays pending until
  \`async_payment_succeeded\` or \`async_payment_failed\` arrives, possibly days later.
- Refunds are made in the Stripe dashboard (or with \`createRefund\`); \`charge.refunded\` records
  the amount, and an order refunded in full becomes \`refunded\`. A chargeback makes it
  \`disputed\` until it is decided: answer it with evidence in the dashboard. Both find the
  order by the payment it stored when it was paid.
- \`src/routes/checkout/[order].tsx\` — where Stripe sends the buyer back. It watches the
  order's read-only room, so it updates when the webhook arrives.

Each caller (by IP) may start 20 checkouts a minute.${
          usesBilling(opts)
            ? `

### Subscriptions (\`/billing\`)

Signed-in users subscribe to \`PLAN\` (\`src/billing.ts\`) on Stripe's checkout and change,
pause or cancel it in Stripe's hosted billing portal, so the app has no billing screens to build.

1. Add \`customer.subscription.created\`, \`customer.subscription.updated\`,
   \`customer.subscription.deleted\` and \`invoice.payment_failed\` to the webhook endpoint's
   events.
2. In the Stripe dashboard, save the Customer Portal's settings once (test mode too): until
   then, Stripe refuses to open it.
3. Gate a paid feature in the Worker with \`await billingStore.requirePlan(env, request)\` (402
   without the plan), never on what the page shows.

- \`worker/billing.ts\` — the subscription names its user in its metadata, which only the
  Worker sets (\`client_reference_id\` can be set by a buyer on a Payment Link). Every
  subscription event is read back from Stripe before it is stored, because events arrive out of
  order, and a late event about an older subscription cannot end a live one.
- Back from checkout, \`/billing\` reads the session and its subscription at once, so it is right
  before the webhook arrives, and only for the user the subscription names.
- A renewal that cannot be charged leaves the plan on (\`past_due\`) while Stripe retries, and
  emails the customer once per attempt with Stripe's page to pay with another card. How long
  Stripe retries, and whether it then cancels, is set in the dashboard (Billing → Subscriptions
  and emails); turn off Stripe's own failed-payment emails there, or customers get two.`
            : `

Subscriptions need an account to belong to: \`cascivo create --framework cloudflare
--example checkout --auth email\` adds a \`/billing\` page with a monthly plan and Stripe's
billing portal.`
        }`
      : ''
  }${
    hasExample(opts, 'newsletter')
      ? `

## Newsletter (Amazon SES)

\`/newsletter\` signs readers up; \`/newsletter/send\` writes an issue in Markdown, previews it
as the email it will be (rendered with \`@cascivo/email\`), and sends it to every confirmed
reader through Amazon SES. It runs in \`vite dev\` with nothing set up: emails are logged instead
of sent, and the sign-up page shows the confirmation link. The composer's key is in
\`.dev.vars\` (\`NEWSLETTER_KEY\`).

To send for real:

1. In SES, verify the domain you send from (SES gives DNS records for DKIM; add them in
   Cloudflare DNS, with an SPF and a DMARC record), and ask AWS to move the account out of the
   sandbox, where it can mail only verified addresses.
2. Create an IAM user allowed \`ses:SendEmail\` and nothing else, and give its keys to the
   Worker: \`npx wrangler secret put AWS_ACCESS_KEY_ID\` and \`AWS_SECRET_ACCESS_KEY\` (in
   \`.dev.vars\` locally). Set \`AWS_REGION\` and \`NEWSLETTER_FROM\` in \`wrangler.jsonc\`, and
   \`npx wrangler secret put NEWSLETTER_KEY\` to a long random value.
3. Bounces and complaints: create an SNS topic, set it as the SES identity's bounce and
   complaint notification topic, and subscribe \`https://<your app>/api/sns/ses\` to it (HTTPS).
   Put the topic's ARN in \`SNS_TOPIC_ARN\`. The Worker confirms the subscription itself.
4. Create the queue once: \`npx wrangler queues create ${newsletterQueue(opts)}\`.

- \`worker/newsletter.ts\` — double opt-in: a sign-up gets a confirmation link (valid a day,
  resent at most every ten minutes) and gets no issue until it is opened. Sending stores the
  issue and puts its readers on the \`NEWSLETTER\` queue, 25 per message; the consumer sends
  them one by one through \`createSes\` (\`@cascivo/app/ses\`), handed to \`sendEmail\` from
  \`@cascivo/email\`, which checks each message before it leaves, one message at a time. Each
  send is recorded, so a message retried after SES throttling skips whoever already has it.
- Every issue carries \`List-Unsubscribe\` and \`List-Unsubscribe-Post\` (one-click
  unsubscribe, RFC 8058, which Gmail and Yahoo require of bulk senders) and a footer link to
  \`/newsletter/unsubscribe\`.
- \`handleSns\` checks each SNS message's signature against SNS's certificate before
  \`parseSesNotification\` reads it. A permanent bounce or a complaint suppresses the address
  for good: mailing it again is what gets an SES account reviewed.
- \`worker/newsletter-email.ts\` — the issue and confirmation emails. The body is Markdown drawn
  through the email primitives; raw HTML in it stays literal text.

Sign-ups and every use of the newsletter key count against the rate limit (20 a minute per
IP). Sending reads every confirmed address into memory; past a few hundred thousand readers,
page through them instead.`
      : ''
  }${
    hasExample(opts, 'social')
      ? `

## Social posts

\`/social\` connects Bluesky, Buffer, LinkedIn, Mastodon and Threads accounts and posts to them,
now or at a time you pick.

- \`worker/social.ts\` — \`handleConnections\` (\`@cascivo/app/oauth-server\`) answers
  \`/api/connections/*\`: connect, list, remove. Tokens are sealed in D1 with \`AUTH_SECRET\`.
  Scheduling checks that each account is yours and connected, and that each network's
  publisher (\`@cascivo/app/social\`) accepts the post, before anything is stored.
- \`worker/social-post.ts\` — \`SocialPost\`, a Workflow per post: it sleeps until the post
  is due, then posts to each account in its own step. Bluesky and Mastodon steps retry, safely:
  Mastodon takes an idempotency key, and a Bluesky post's record key is fixed by its time and
  id. Buffer, LinkedIn and Threads steps never do: they cannot deduplicate, so an interrupted
  post there is reported for you to check rather than sent twice.
- \`src/social.ts\` — the shared types, and the publishers the page also runs, so what a
  network would refuse shows while you type.
- Images: the composer uploads them into the \`SOCIAL_MEDIA\` R2 bucket through the Worker
  (\`@cascivo/app/uploads\`), each user under their own prefix; up to 4, JPEG or PNG, 1 MB each
  (Bluesky's limit), each with a description. Bluesky, LinkedIn and Mastodon get the bytes.
  Threads and Buffer fetch images by URL, so they get a link to \`/api/social/media/…\` signed
  with \`AUTH_SECRET\`. It is valid until a day after the post is due, and needs \`APP_URL\` set
  to the deployed app. Uploads stay in R2: add a lifecycle rule
  (\`wrangler r2 bucket lifecycle add\`) to expire old ones.

**Bluesky** needs no set-up either: people type their handle. Bluesky's servers read this
app's client metadata from \`/api/bluesky/client-metadata.json\`, so the deployed app must be
reachable at its URL. In \`vite dev\` the app is Bluesky's development client, which may only
return to \`127.0.0.1\`: open \`http://127.0.0.1:5173\`, not \`localhost\`. Without a key the app is a
public client and sessions end after two weeks; for sessions that last, make a key and set it
as the \`BLUESKY_PRIVATE_JWK\` secret:

\`\`\`sh
node -e "crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign']).then(k=>crypto.subtle.exportKey('jwk',k.privateKey)).then(j=>console.log(JSON.stringify({...j,kid:'k1'})))"
\`\`\`

**Mastodon** needs no set-up: people type their server, and the app registers itself there
on first use.

**Buffer** reaches the networks connected there (X, Instagram, TikTok, …): register an app
client at https://publish.buffer.com/settings/api with \`…/api/connections/buffer/callback\` as
its redirect URL, and set \`BUFFER_CLIENT_ID\` (and \`BUFFER_CLIENT_SECRET\` for a confidential
client). Each channel in a connected Buffer is an account in the composer, checked against
its network's limit. Buffer counts every request against your plan's budget (100 per 15
minutes on every plan), for all your users together, so the channel list is kept for an hour.
Buffer cannot deduplicate, so its posts are never retried, like LinkedIn's. **LinkedIn** needs an app at https://www.linkedin.com/developers/apps with the
"Share on LinkedIn" product${oauthSignIn(opts) ? ' (the same app as sign-in works, with both products)' : ''}; add
\`…/api/connections/linkedin/callback\` as a redirect URL and set \`LINKEDIN_CLIENT_ID\` and
\`LINKEDIN_CLIENT_SECRET\`. LinkedIn tokens last 60 days and cannot be renewed: the page shows
"expires soon" a week ahead, and connecting again renews the account in place. The daily Cron
Trigger also emails the owner once, a week ahead, with a link to connect again
(\`remindExpiring\`): set \`REMINDER_FROM\` in \`wrangler.jsonc\` to an address on a domain you
have onboarded to Email Service, and \`APP_URL\` to the deployed app. People whose provider shared
no email see the page's notice only.

**Threads** needs a Meta app with the "Access the Threads API" use case
(https://developers.facebook.com/apps), the \`threads_basic\` and \`threads_content_publish\`
permissions, and \`…/api/connections/threads/callback\` as a redirect callback URL; set
\`THREADS_APP_ID\` and \`THREADS_APP_SECRET\` (the Threads app id and secret, not the Meta
app's). Until Meta's App Review and business verification pass, only people added as testers
on the app can connect. A Threads token lasts 60 days and renews itself only while it still
works, so a daily Cron Trigger (\`${SOCIAL_CRON}\`, \`renewConnections\`) renews those in their last
30 days; try it in \`vite dev\` at \`/cdn-cgi/handler/scheduled\`. Threads takes 500 characters,
counting an emoji as several, and cannot deduplicate either.

Connecting an account and posting count against the rate limit (20 a minute per IP).
Workflows need a real Cloudflare account to deploy.`
      : ''
  }${
    hasAccounts(opts)
      ? `

## Accounts (${emailSignIn(opts) ? (oauthSignIn(opts) ? 'email, GitHub, Google and LinkedIn sign-in' : 'email sign-in') : 'GitHub, Google and LinkedIn sign-in'})

${
  emailSignIn(opts) && oauthSignIn(opts)
    ? 'Anyone can create an account by continuing with GitHub, Google or LinkedIn, or with their email address, on `/account`.'
    : oauthSignIn(opts)
      ? 'Anyone can create an account by continuing with GitHub, Google or LinkedIn on `/account`.'
      : 'Anyone can create an account with their email address: `/account` emails a one-time link, and opening it signs them in with a session cookie.'
} **Every API write needs a signed-in user; reads stay public.**

- \`worker/index.ts\` — ${[emailSignIn(opts) ? '`handleAuth` (`@cascivo/app/auth-server`)' : '', oauthSignIn(opts) ? '`handleOAuth` (`@cascivo/app/oauth-server`)' : ''].filter(Boolean).join(' and ')} answer${emailSignIn(opts) && oauthSignIn(opts) ? '' : 's'} \`/api/auth/*\`, and
  \`requireUser\` refuses any other write without a session (401) or from another site (403).
  Call \`requireUser(env.DB, request)\` in a handler to know who is asking.${
    emailSignIn(opts)
      ? `
- \`worker/auth.ts\` — sends the link through Email Service. Set \`AUTH_FROM\` in
  \`wrangler.jsonc\` to an address on a domain you have onboarded to Email Service.`
      : ''
  }
- \`src/auth.ts\` — \`auth.user\`, a signal every page can read. \`user.email\` is \`null\` for
  someone whose provider shared no verified address.${
    emailSignIn(opts)
      ? `
- \`src/routes/signin/verify.tsx\` — the page a link opens. It signs in on a button press,
  because mail scanners open every link in a message.`
      : ''
  }

Users${emailSignIn(opts) ? ', links' : ''} and sessions live in D1, stored as hashes. ${emailSignIn(opts) ? 'Links expire after 15 minutes and work once; sessions' : 'Sessions'} last 30 days.${emailSignIn(opts) ? ' Each caller (by IP) may request 20 links a minute. In `vite dev` no email is sent: the Account page shows the link instead.' : ''} WebSocket connections
(rooms, agents) are not covered by the write rule; check \`currentUser\` before forwarding them
if they need a user.${
          oauthSignIn(opts)
            ? `

### GitHub, Google and LinkedIn

1. **GitHub**: create an OAuth App at https://github.com/settings/developers with the
   callback URL \`http://localhost:5173/api/auth/oauth/github/callback\` for \`vite dev\`
   (an OAuth App takes one callback URL, so make a second app for the deployed one).
2. **Google**: in the Google Cloud console, create an OAuth client of type "Web application"
   with the redirect URIs \`http://localhost:5173/api/auth/oauth/google/callback\` and
   \`https://<your app>/api/auth/oauth/google/callback\`.
3. **LinkedIn**: create an app at https://www.linkedin.com/developers/apps, add the product
   "Sign In with LinkedIn using OpenID Connect", and under Auth add both redirect URLs
   (\`…/api/auth/oauth/linkedin/callback\` on localhost and on your app).
4. Put the ids and secrets in \`.dev.vars\`. Deployed: \`npx wrangler secret put\` each
   \`*_CLIENT_ID\` and \`*_CLIENT_SECRET\` you use, and \`AUTH_SECRET\` (a random one:
   \`openssl rand -base64 32\`). A provider is offered once both its values are set.

People are matched by their account at the provider, not by email. A new sign-in joins an
existing account only through an email the provider has verified (GitHub's primary verified
address, Google's and LinkedIn's \`email_verified\`). A signed-in user who follows another provider's link
adds it to their account.`
            : ''
        }`
      : ''
  }${
    opts.auth === 'access'
      ? `

## Access (who may use the app)

The Worker refuses every request Cloudflare Access did not let through: \`requireAccess\`
(\`@cascivo/app/guard\`) at the top of \`worker/index.ts\` verifies the token Access signs.

1. In Cloudflare One (Zero Trust), add a self-hosted Access application for this app's
   hostname, with a policy saying who may sign in.
2. Put your team domain (\`<team>.cloudflareaccess.com\`) and the application's Audience (AUD)
   tag in \`vars\` in \`wrangler.jsonc\`, and deploy.

Until both are set, every API request answers 500 ("Access is not configured"). Access guards
the pages at the edge; the Worker's check also refuses API calls that reach it around Access,
at \`*.workers.dev\` for example (set \`"workers_dev": false\` if the app should have no public
address at all). \`vite dev\` skips the check. A temporary account has no Access, so an app made
with \`--auth access\` cannot use \`deploy:preview\`.`
      : ''
  }${
    hasExample(opts, 'crud')
      ? `

## Customers (D1)

\`/customers\` is a D1 table behind \`DataTable\`'s server mode: sorting, search, the name and
seats filters, and paging all run as SQL in the Worker, and the page shows one page at a time.

- \`src/customers.ts\` — \`defineTable\` (\`@cascivo/app/db\`) lists what may be sorted, searched and
  filtered. \`queryTable\` builds SQL from that list only, with every value a bound parameter:
  a query for any other column is refused with a 400.
- \`worker/migrations.ts\` — the schema and 60 sample rows. The Worker applies them itself on its
  first query (\`migrate\`), so a fresh deploy, the Deploy button and \`deploy:preview\` need no
  migration step. Append migrations; never edit one that has shipped.
- \`worker/customers.ts\` — create, update and delete, each checked by \`parseCustomerInput\`.

D1 works on a temporary account, so \`deploy:preview\` shares the table with no sign-up. If you
prefer wrangler's own migrations (\`wrangler d1 migrations apply\`), move the SQL into
\`migrations/\` and drop the \`migrate\` call.`
      : ''
  }${
    hasExample(opts, 'agent')
      ? `

## Assistant (generative UI)

\`/assistant\` is a chat whose answers can be UI. The model calls a \`show_view\` tool with a view
config; the Worker checks it against the component manifests (\`validateView\` from
\`@cascivo/render/validate\`) and returns any errors to the model, which fixes them and calls
again. The page renders the result with \`<CascivoView>\`: real components, no generated code.

- \`worker/assistant.ts\` — \`Assistant\`, an \`AIChatAgent\` (Cloudflare's Agents SDK): one
  Durable Object per conversation, which stores the messages and streams replies to every open
  tab. The system prompt, the \`show_view\` tool and the model (\`MODEL\`, any Workers AI model
  with tool calling) are here.
- \`src/assistant.ts\` — \`checkView\`, the one check both sides run on a view.
- \`src/routes/assistant.tsx\` — \`useAgent\` + \`useAgentChat\`; one conversation per browser.
- \`worker/scripted-model.ts\` — \`vite dev\` answers from this scripted model, so the page works
  offline and without an account. \`VITE_REAL_AI=1 ${runScriptCommand(pm, 'dev')}\` uses Workers AI instead
  (after \`npx wrangler login\`); a deployed Worker always does.

Workers AI bills per use beyond its free daily allocation.`
      : ''
  }${
    hasExample(opts, 'publish')
      ? `

## Publish (views as pages)

\`/publish\` turns a view — the JSON that \`<CascivoView>\` renders, which an agent can write
too — into a page at \`/p/<slug>\`, with no deploy. A view is data, not code: it can only
arrange this app's components with props their manifests allow, so a published page runs no
code of its author's and needs no sandbox.

- \`src/pages.ts\` — \`parsePageInput\` checks a page with \`validateView\`
  (\`@cascivo/render/validate\`): known components and props, and no link or image URL that
  could run script. The Worker runs it before storing a page; \`<CascivoView>\` checks again
  before rendering one.
- \`worker/pages.ts\` — pages in D1, under a random ten-character slug.
- \`src/routes/publish.tsx\` — the editor, with a live preview.
- \`src/routes/p/[slug].tsx\` — a published page.
- \`worker/page-html.ts\` — the Worker answers \`/p/<slug>\` with index.html carrying the
  page's title, description and Open Graph tags, so a shared link previews properly, and the
  rendered page in a \`<noscript>\` for readers without JavaScript.${
    hasExample(opts, 'export')
      ? `
- \`worker/page-preview.ts\` — the preview image (\`og:image\`, 1200 × 630): Browser Run
  renders the page once, and D1 keeps the PNG.`
      : ''
  }

${
  opts.auth
    ? ''
    : `**Anyone who can reach the app can publish**, and a page is served from your domain: put
Cloudflare Access in front (\`--auth access\`), add accounts (\`--auth email\`), or check who
is publishing in \`worker/index.ts\`. `
}Each caller (by IP) may publish 20 pages a minute (\`ratelimits\` in
\`wrangler.jsonc\`). D1 works on a temporary account.`
      : ''
  }${
    hasExample(opts, 'voice')
      ? `

## Voice

\`/voice\` is a voice assistant: press "Start call", talk, and it answers aloud. Talk over a
reply to interrupt it. Typed messages work too.

- \`worker/voice.ts\` — \`Voice\`, an Agent with the Agents SDK's voice pipeline
  (\`withVoice\` from \`agents/voice\`): Workers AI speech to text (Flux, which also decides when
  you have finished speaking), a text model (\`MODEL\`) and text to speech. One Durable Object
  per conversation stores the transcript, which the model gets as context.
- \`src/voice.ts\` — \`VoiceClient\` (\`agents/voice/client\`) captures the microphone, streams
  it, and plays the replies; its events become signals the page reads.
- \`worker/scripted-voice.ts\` — \`vite dev\` stand-ins, because Workers AI has no local mode:
  the transcriber "hears" a fixed question for every three seconds of sound, and the replies
  are text only. \`VITE_REAL_AI=1 ${runScriptCommand(pm, 'dev')}\` uses Workers AI instead (after
  \`npx wrangler login\`); a deployed Worker always does.

Browsers allow the microphone only on a secure origin: \`localhost\` or HTTPS. Workers AI
bills per use beyond its free daily allocation, and a temporary account has no Workers AI.`
      : ''
  }

Add more components with \`npx cascivo add <component>\`.

## ${runtime === 'preact' ? 'Preact or React' : 'React or Preact'}

${
  hasExample(opts, 'agent')
    ? `This app runs on React. The Agents SDK's hooks call React 19's \`use()\`, which
Preact's compat layer does not implement, so the assistant page needs React. (The other pages
would run on Preact unchanged: the source is typed against React either way.)`
    : `The source is typed against React. The runtime is one plugin in \`vite.config.ts\`:
\`@preact/preset-vite\` runs it on Preact, \`@vitejs/plugin-react\` on React. Switching
needs no source changes; swap the plugin and the matching dependencies. For this starter,
Preact ships about a third of the client JS (~27 KB gzip against ~85 KB).`
}
`
}

function cfAgentsMd(opts: ScaffoldOptions): string {
  return `${agentsMd(opts)}
## Server

The API contract is \`src/api.ts\` (\`defineApi\` from \`@cascivo/app/api\`); its handlers are
\`worker/index.ts\` (\`createHandler\`), and the app calls it through \`createClient\`. Add an
endpoint to the contract first, with a parser for its input and output: parse every payload
that crosses the network, never cast it. A streaming endpoint's handler is an async
generator. \`wrangler.jsonc\` routes only \`/api/*\` to the Worker.

## Pages

A page is a file in \`src/routes/\` with a default export: \`c/[id].tsx\` serves \`/c/:id\` and
receives \`{ params }: RouteProps<'/c/:id'>\`. Never edit \`src/routes.gen.ts\`. Link with
\`href\`s (SideNav items, \`router.Link\`); navigate from code with \`router.navigate(path)\`,
and build a path with \`buildPath('/c/:id', { id })\`, both from \`@cascivo/app\`.

## Sharing

To show the user a running version, run \`${runExplicitCommand(opts.pm ?? 'npm', 'deploy:preview')}\`.
It needs no Cloudflare account. Give the user both URLs it prints: the live one, and the
claim URL. The deployment is public, and it is deleted after 60 minutes unless the user
opens the claim URL and signs in.
`
}

function cfShellTsx(opts: ScaffoldOptions): string {
  const shell = shellTsx(opts)
  const start = shell.indexOf(' * Adding a router?')
  const end = shell.indexOf(' */\nexport function Shell')
  // This app already routes, so the Vite scaffold's "adding a router" advice does not apply.
  return (
    shell.slice(0, start) +
    ' * Routing lives in src/router.ts; nav items carry `href`s, and main.tsx registers the\n' +
    " * router's Link so they navigate client-side.\n" +
    shell.slice(end)
  )
}

/** Local secrets for `vite dev` (.gitignore'd); deployed, each is a `wrangler secret`. */
function cfDevVars(opts: ScaffoldOptions): string {
  return [
    ...(hasExample(opts, 'webhooks')
      ? [
          '# The secret vite dev signs and checks test webhook deliveries with.',
          'WEBHOOK_SECRET=dev-only-webhook-secret',
        ]
      : []),
    ...(hasExample(opts, 'checkout')
      ? [
          '# Stripe, in test mode (README): the secret key from the dashboard, and the signing',
          '# secret `stripe listen` prints.',
          'STRIPE_SECRET_KEY=',
          'STRIPE_WEBHOOK_SECRET=',
        ]
      : []),
    ...(hasExample(opts, 'newsletter')
      ? [
          '# The key /newsletter/send asks for. Deployed, choose a long random one.',
          'NEWSLETTER_KEY=dev-only-newsletter-key',
          '# An IAM user allowed ses:SendEmail (README). Without them, vite dev logs each email.',
          'AWS_ACCESS_KEY_ID=',
          'AWS_SECRET_ACCESS_KEY=',
        ]
      : []),
    ...(oauthSignIn(opts)
      ? [
          '# Seals the sign-in state between the redirect and the callback. Deployed, a random one:',
          '# openssl rand -base64 32',
          'AUTH_SECRET=dev-only-auth-secret-0123456789abcdef',
          '# A GitHub OAuth App, a Google OAuth client and a LinkedIn app (README).',
          '# Each provider is offered once both its id and secret are set.',
          'GITHUB_CLIENT_ID=',
          'GITHUB_CLIENT_SECRET=',
          'GOOGLE_CLIENT_ID=',
          'GOOGLE_CLIENT_SECRET=',
          'LINKEDIN_CLIENT_ID=',
          'LINKEDIN_CLIENT_SECRET=',
        ]
      : hasExample(opts, 'social')
        ? [
            "# Seals connected accounts' tokens. Deployed, a random one: openssl rand -base64 32",
            'AUTH_SECRET=dev-only-auth-secret-0123456789abcdef',
            '# A LinkedIn app with "Share on LinkedIn" (README). Mastodon needs nothing.',
            'LINKEDIN_CLIENT_ID=',
            'LINKEDIN_CLIENT_SECRET=',
          ]
        : []),
    ...(hasExample(opts, 'social')
      ? [
          '# Optional: an ES256 private JWK with a kid, so Bluesky sessions last (README).',
          'BLUESKY_PRIVATE_JWK=',
          '# Optional: a Buffer app client (publish.buffer.com/settings/api), to post to its channels.',
          'BUFFER_CLIENT_ID=',
          'BUFFER_CLIENT_SECRET=',
          '# Optional: a Meta app with the Threads use case (README), to post to Threads.',
          'THREADS_APP_ID=',
          'THREADS_APP_SECRET=',
        ]
      : []),
  ]
    .map((line) => `${line}\n`)
    .join('')
}

/**
 * The secrets the app reads, with no values: committed, unlike .dev.vars. The "Deploy to
 * Cloudflare" button asks for each one it lists; `cp .dev.vars.example .dev.vars` starts a
 * fresh clone.
 */
function cfDevVarsExample(opts: ScaffoldOptions): string {
  return cfDevVars(opts)
    .split('\n')
    .map((line) => (line.startsWith('#') ? line : line.replace(/=.*$/, '=')))
    .join('\n')
}

/**
 * What each setting is for, in package.json's \`cloudflare.bindings\`: the "Deploy to Cloudflare"
 * button shows it beside the field it asks the deployer to fill in.
 */
function cfBindingDescriptions(opts: ScaffoldOptions): Record<string, { description: string }> {
  const describe = (entries: [string, string][]) =>
    Object.fromEntries(entries.map(([name, description]) => [name, { description }]))
  return {
    ...(hasExample(opts, 'webhooks')
      ? describe([
          [
            'WEBHOOK_SECRET',
            'The secret of the GitHub webhook that posts to `/api/webhooks/github`.',
          ],
        ])
      : {}),
    ...(hasExample(opts, 'checkout')
      ? describe([
          [
            'STRIPE_SECRET_KEY',
            'Your Stripe secret key, from the [API keys page](https://dashboard.stripe.com/test/apikeys). A test key (`sk_test_…`) takes test cards only.',
          ],
          [
            'STRIPE_WEBHOOK_SECRET',
            'The signing secret (`whsec_…`) of a Stripe webhook endpoint at `https://<this app>/api/stripe/webhook`. No endpoint yet? Enter `later`: orders are confirmed on their own page without it. Set the real one with `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.',
          ],
          [
            'RECEIPT_FROM',
            'The From address of receipts, on a domain onboarded to Cloudflare Email Service. Leave it empty to send none.',
          ],
        ])
      : {}),
    ...(hasExample(opts, 'newsletter')
      ? describe([
          [
            'NEWSLETTER_KEY',
            'The key `/newsletter/send` asks for. Make a long random one: `openssl rand -hex 32`.',
          ],
          ['AWS_ACCESS_KEY_ID', 'An IAM user allowed `ses:SendEmail` and nothing else (README).'],
          ['AWS_SECRET_ACCESS_KEY', "That IAM user's secret access key."],
          ['AWS_REGION', 'The SES region your sending domain is verified in, e.g. `eu-west-1`.'],
          ['NEWSLETTER_FROM', 'The From address of issues, on your SES-verified domain.'],
          [
            'SNS_TOPIC_ARN',
            'The SNS topic SES reports bounces and complaints to, subscribed to `https://<this app>/api/sns/ses`.',
          ],
        ])
      : {}),
    ...(oauthSignIn(opts)
      ? describe([
          [
            'AUTH_SECRET',
            'Seals the sign-in state between the redirect to GitHub, Google or LinkedIn and the way back. Make a random one: `openssl rand -base64 32`.',
          ],
          [
            'GITHUB_CLIENT_ID',
            'The client id of a [GitHub OAuth App](https://github.com/settings/developers) whose callback URL is `https://<this app>/api/auth/oauth/github/callback`. Leave it empty to offer no GitHub sign-in.',
          ],
          ['GITHUB_CLIENT_SECRET', "That OAuth App's client secret."],
          [
            'GOOGLE_CLIENT_ID',
            'The client id of a Google OAuth client (Web application) with the redirect URI `https://<this app>/api/auth/oauth/google/callback`. Leave it empty to offer no Google sign-in.',
          ],
          ['GOOGLE_CLIENT_SECRET', "That OAuth client's secret."],
          [
            'LINKEDIN_CLIENT_ID',
            'The client id of a LinkedIn app with the "Sign In with LinkedIn using OpenID Connect" product and the redirect URL `https://<this app>/api/auth/oauth/linkedin/callback`. Leave it empty to offer no LinkedIn sign-in.',
          ],
          ['LINKEDIN_CLIENT_SECRET', "That LinkedIn app's primary client secret."],
        ])
      : hasExample(opts, 'social')
        ? describe([
            [
              'AUTH_SECRET',
              'Seals the tokens of the accounts people connect. Make a random one: `openssl rand -base64 32`.',
            ],
            [
              'LINKEDIN_CLIENT_ID',
              'The client id of a LinkedIn app with the "Share on LinkedIn" product and the redirect URL `https://<this app>/api/connections/linkedin/callback`. Leave it empty to offer no LinkedIn.',
            ],
            ['LINKEDIN_CLIENT_SECRET', "That LinkedIn app's primary client secret."],
          ])
        : {}),
    ...(hasExample(opts, 'social')
      ? describe([
          [
            'BLUESKY_PRIVATE_JWK',
            'Optional. An ES256 private key as a JWK with a `kid` (README shows how to make one). With it, Bluesky sessions last until revoked; without it, two weeks.',
          ],
          [
            'BUFFER_CLIENT_ID',
            'Optional. A Buffer app client (https://publish.buffer.com/settings/api) with the redirect URL `https://<this app>/api/connections/buffer/callback`. Leave it empty to offer no Buffer.',
          ],
          ['BUFFER_CLIENT_SECRET', "That Buffer app client's secret (none for a public client)."],
          [
            'THREADS_APP_ID',
            'Optional. The Threads app id of a Meta app with the Threads use case, and `https://<this app>/api/connections/threads/callback` as its redirect callback URL. Leave it empty to offer no Threads.',
          ],
          ['THREADS_APP_SECRET', "That Threads app's secret."],
        ])
      : {}),
  }
}

/**
 * The recipes (`packages/cli/recipes/<name>`) a cloudflare scaffold may add after its base, in
 * the order their pages appear in the side nav.
 */
const CLOUDFLARE_RECIPES = [
  'agent',
  'board',
  'notes',
  'import',
  'files',
  'export',
  'usage',
  'crud',
  'live',
  'voice',
  'publish',
  'publish-preview',
  'webhooks',
  'digest',
  'search',
  'checkout',
  'billing',
  'newsletter',
  'social',
  'accounts',
  'auth-email',
] as const

/** Each example is its own recipe; the rest are what two choices bring together. */
function includesRecipe(
  recipe: (typeof CLOUDFLARE_RECIPES)[number],
  opts: ScaffoldOptions,
): boolean {
  switch (recipe) {
    case 'publish-preview':
      return hasExample(opts, 'publish') && hasExample(opts, 'export')
    case 'billing':
      return usesBilling(opts)
    case 'accounts':
      return hasAccounts(opts)
    case 'auth-email':
      return emailSignIn(opts)
    default:
      return hasExample(opts, recipe)
  }
}

function cloudflareRecipes(opts: ScaffoldOptions): string[] {
  return ['cloudflare', ...CLOUDFLARE_RECIPES.filter((recipe) => includesRecipe(recipe, opts))]
}

function buildCloudflareScaffold(opts: ScaffoldOptions, sections: Section[]): ScaffoldFile[] {
  const runtime = runtimeOf(opts)
  const recipes = cloudflareRecipes(opts)
  const recipeOutput = recipes.flatMap((recipe) =>
    recipeFiles(recipe, {
      brand: brandName(opts.name),
      appName: opts.name.replace(/[\\']/g, ''),
      usageDataset: usageDataset(opts),
    }),
  )
  const routeFiles = [
    ...sections.map((s, i) => ({
      file: cfSectionFile(s, i),
      contents: i === 0 ? cfFirstRouteTsx(s) : cfRouteTsx(s, i),
    })),
    ...(hasAccounts(opts) ? [{ file: 'account.tsx', contents: cfAccountRouteTsx(opts) }] : []),
  ]
  const routes = [
    ...routeFiles.map((r) => r.file),
    ...recipeOutput
      .filter((f) => f.path.startsWith('src/routes/'))
      .map((f) => f.path.slice('src/routes/'.length)),
  ]
  return [
    { path: 'package.json', contents: cfPackageJson(opts) },
    { path: 'tsconfig.json', contents: cfTsconfig(opts) },
    ...(needsWorkerTypes(opts)
      ? [{ path: 'tsconfig.worker.json', contents: cfWorkerTsconfig() }]
      : []),
    { path: 'vite.config.ts', contents: cfViteConfig(runtime, opts) },
    { path: 'wrangler.jsonc', contents: wranglerJsonc(opts) },
    { path: 'index.html', contents: indexHtml(opts) },
    { path: 'eslint.config.js', contents: eslintConfig() },
    { path: '.prettierrc', contents: prettierrc() },
    { path: '.prettierignore', contents: cfPrettierIgnore() },
    { path: '.gitignore', contents: cfGitignore() },
    { path: 'README.md', contents: cfReadme(opts) },
    { path: 'AGENTS.md', contents: cfAgentsMd(opts) },
    { path: 'worker/index.ts', contents: cfWorkerTs(opts) },
    { path: 'src/api.ts', contents: cfApiTs(opts) },
    { path: 'src/vite-env.d.ts', contents: viteEnv() },
    { path: 'src/App.tsx', contents: cfAppTsx(sections, recipes, opts) },
    { path: 'src/Shell.tsx', contents: cfShellTsx(opts) },
    ...(hasExample(opts, 'webhooks') ||
    hasExample(opts, 'checkout') ||
    hasExample(opts, 'newsletter') ||
    hasExample(opts, 'social') ||
    oauthSignIn(opts)
      ? [
          { path: '.dev.vars', contents: cfDevVars(opts) },
          { path: '.dev.vars.example', contents: cfDevVarsExample(opts) },
        ]
      : []),
    ...recipeOutput,
    ...routeFiles.map(({ file, contents }) => ({ path: `src/routes/${file}`, contents })),
    // Written now so \`tsc\` passes before the first \`vite\` run; the plugin keeps it current.
    { path: 'src/routes.gen.ts', contents: generateRoutes(routes, './routes') },
  ]
}

export function buildScaffold(opts: ScaffoldOptions): ScaffoldFile[] {
  const sections = resolveSections(opts.sections)
  if (opts.framework === 'astro') return buildAstroScaffold(opts, sections)
  if (opts.framework === 'cloudflare') {
    // The digest emails the report page the export example adds, so it brings that along.
    const examples =
      opts.examples?.includes('digest') && !opts.examples.includes('export')
        ? [...opts.examples, 'export' as const]
        : opts.examples
    // Social posts belong to a user: without --auth, it brings sign-in with providers.
    const auth = opts.auth ?? (examples?.includes('social') ? 'oauth' : undefined)
    return buildCloudflareScaffold(
      { ...opts, ...(examples ? { examples } : {}), ...(auth ? { auth } : {}) },
      sections,
    )
  }
  return [
    { path: 'package.json', contents: packageJson(opts) },
    { path: 'tsconfig.json', contents: tsconfig() },
    { path: 'vite.config.ts', contents: viteConfig() },
    { path: 'index.html', contents: indexHtml(opts) },
    // No `cascivo.config.ts`. It configures where `cascivo add` copies source, which a
    // prebuilt-path app never does — and its presence was how `doctor` decided a project
    // was copy-paste, so the scaffolder's own output failed `doctor --ci` and was told to
    // install the two packages the docs forbid. `cascivo add` writes the config itself the
    // first time it is used.
    { path: 'eslint.config.js', contents: eslintConfig() },
    { path: '.prettierrc', contents: prettierrc() },
    { path: '.prettierignore', contents: prettierIgnore() },
    { path: '.gitignore', contents: gitignore() },
    { path: 'README.md', contents: readme(opts) },
    { path: 'AGENTS.md', contents: agentsMd(opts) },
    { path: 'src/main.tsx', contents: mainTsx() },
    { path: 'src/vite-env.d.ts', contents: viteEnv() },
    { path: 'src/App.tsx', contents: appTsx(sections) },
    { path: 'src/Shell.tsx', contents: shellTsx(opts) },
    ...sections.map((s) => ({
      path: `src/sections/${s.component}.tsx`,
      contents: sectionTsx(s),
    })),
  ]
}

function buildAstroScaffold(opts: ScaffoldOptions, sections: Section[]): ScaffoldFile[] {
  return [
    { path: 'package.json', contents: astroPackageJson(opts) },
    { path: 'tsconfig.json', contents: astroTsconfig() },
    { path: 'astro.config.mjs', contents: astroConfig() },
    { path: 'eslint.config.js', contents: eslintConfig() },
    { path: '.prettierrc', contents: prettierrc() },
    { path: '.prettierignore', contents: prettierIgnore() },
    { path: '.gitignore', contents: astroGitignore() },
    { path: 'README.md', contents: astroReadme(opts, sections) },
    { path: 'AGENTS.md', contents: agentsMd(opts) },
    { path: 'src/styles/layers.css', contents: astroLayersCss() },
    { path: 'src/layouts/Layout.astro', contents: astroLayout(opts) },
    { path: 'src/components/Shell.tsx', contents: astroShellTsx(opts, sections) },
    ...sections.map((s, i) => ({
      path: `src/pages/${sectionPageFile(s, i)}`,
      contents: astroPage(s, i),
    })),
    ...sections.map((s) => ({
      path: `src/components/${s.component}.tsx`,
      contents: astroSectionTsx(s),
    })),
  ]
}

const DEFAULT_SECTIONS = ['Dashboard', 'Reports', 'Settings']

export async function create(args: string[], cwd: string = process.cwd()): Promise<void> {
  const yes = args.includes('--yes') || args.includes('-y')
  // Skip flag values (e.g. `bun` in `--pm bun`) so the project name is the first
  // real positional, not a flag's argument.
  const nameArg = positionalArgs(args, [
    'pm',
    'package-manager',
    'theme',
    'sections',
    'template',
    'framework',
    'runtime',
    'example',
    'auth',
  ])[0]
  const themeArg = flagValue(args, 'theme')
  const sectionsArg = flagValue(args, 'sections')

  const frameworkArg = (flagValue(args, 'framework') ?? '').toLowerCase()
  if (frameworkArg && !(FRAMEWORKS as readonly string[]).includes(frameworkArg)) {
    console.error(`Unknown framework "${frameworkArg}". Expected one of: ${FRAMEWORKS.join(', ')}.`)
    process.exitCode = 1
    return
  }

  const runtimeArg = (flagValue(args, 'runtime') ?? '').toLowerCase()
  if (runtimeArg && !isRuntime(runtimeArg)) {
    console.error(`Unknown runtime "${runtimeArg}". Expected one of: ${RUNTIMES.join(', ')}.`)
    process.exitCode = 1
    return
  }

  const exampleArgs = (flagValue(args, 'example') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const badExample = exampleArgs.find((e) => !isExample(e))
  if (badExample) {
    console.error(`Unknown example "${badExample}". Expected one of: ${EXAMPLES.join(', ')}.`)
    process.exitCode = 1
    return
  }

  const authArg = parseAuth(flagValue(args, 'auth'))
  if (authArg === 'invalid') {
    console.error(
      `Unknown auth "${flagValue(args, 'auth') ?? ''}". Expected: access, email, oauth or email,oauth.`,
    )
    process.exitCode = 1
    return
  }

  const pmFlag = resolvePackageManagerFlag(args)
  if ('error' in pmFlag) {
    console.error(pmFlag.error)
    process.exitCode = 1
    return
  }
  // The new project has no lock file of its own, but the directory it lands IN usually does
  // — scaffolding into an existing workspace is the common case. `preferLockfileOverUserAgent`
  // makes that walk-up outrank `npm_config_user_agent`, which `npx` always reports as npm no
  // matter what the surrounding repo uses (2026-08-14 §11). With no lock file anywhere up the
  // tree, detection still falls back to the launcher.
  const pm = detectPackageManager(cwd, {
    preferLockfileOverUserAgent: true,
    ...(pmFlag.pm ? { override: pmFlag.pm } : {}),
  })

  const interactive = !yes && stdin.isTTY
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null

  try {
    let name = nameArg
    if (!name && rl) {
      name = (await rl.question('Project name? [my-cascivo-app]: ')).trim()
    }
    name = name || 'my-cascivo-app'

    let theme = (themeArg ?? '').toLowerCase()
    if (!(THEMES as readonly string[]).includes(theme) && rl) {
      theme = (await rl.question(`Theme? (${THEMES.join('/')}) [light]: `)).trim().toLowerCase()
    }
    const resolvedTheme: ThemeName = (THEMES as readonly string[]).includes(theme)
      ? (theme as ThemeName)
      : 'light'

    let sectionsInput = sectionsArg
    if (!sectionsInput && rl) {
      sectionsInput = (
        await rl.question(`Nav sections? (comma-separated) [${DEFAULT_SECTIONS.join(', ')}]: `)
      ).trim()
    }
    const sections = (sectionsInput ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    let framework = frameworkArg
    if (!framework && rl) {
      framework = (await rl.question(`Framework? (${FRAMEWORKS.join('/')}) [react-vite]: `))
        .trim()
        .toLowerCase()
    }
    const resolvedFramework: Framework = (FRAMEWORKS as readonly string[]).includes(framework)
      ? (framework as Framework)
      : 'react-vite'

    if (exampleArgs.length > 0 && resolvedFramework !== 'cloudflare') {
      console.error('--example needs --framework cloudflare (it adds a Worker-backed page).')
      process.exitCode = 1
      return
    }
    if (exampleArgs.includes('social') && authArg === 'access') {
      console.error(
        '--example social needs accounts (posts belong to a user): use --auth email, oauth or ' +
          'email,oauth, or leave --auth out to get oauth.',
      )
      process.exitCode = 1
      return
    }
    if (authArg && resolvedFramework !== 'cloudflare') {
      console.error('--auth needs --framework cloudflare (it guards the Worker).')
      process.exitCode = 1
      return
    }
    if (exampleArgs.includes('agent') && runtimeArg === 'preact') {
      console.error(
        "--example agent needs --runtime react: the Agents SDK's hooks call React 19's use(), " +
          'which Preact does not implement.',
      )
      process.exitCode = 1
      return
    }

    const opts: ScaffoldOptions = {
      name,
      framework: resolvedFramework,
      theme: resolvedTheme,
      sections: sections.length > 0 ? sections : DEFAULT_SECTIONS,
      pm,
      ...(isRuntime(runtimeArg) ? { runtime: runtimeArg } : {}),
      ...(exampleArgs.length > 0 ? { examples: exampleArgs.filter(isExample) } : {}),
      ...(authArg ? { auth: authArg } : {}),
    }

    const targetDir = join(cwd, name)
    if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
      console.error(`Target directory "${name}" already exists and is not empty.`)
      process.exitCode = 1
      return
    }

    const files = buildScaffold(opts)
    for (const file of files) {
      await writeFileSafe(join(targetDir, file.path), file.contents)
    }

    console.log(
      `\nCreated ${name} (${resolvedFramework}) with the ${resolvedTheme} theme ` +
        `(${files.length} files).`,
    )

    const templateSpec = flagValue(args, 'template')
    if (templateSpec) {
      const { add } = await import('./add.js')
      const { loadConfig } = await import('../utils/config.js')
      console.log(`\nInstalling template "${templateSpec}"…`)
      await add([templateSpec], await loadConfig(), { cwd: targetDir, pm })
    }

    console.log('\nNext steps:')
    console.log(`  cd ${name}`)
    console.log(`  ${installAllCommand(pm)}`)
    console.log(`  ${runScriptCommand(pm, 'dev')}`)
    // Two things the output used to leave the adopter to discover (2026-08-14 §11, §1).
    console.log('\nGood to know:')
    console.log('  No cascivo.config.ts is written — this app uses the prebuilt @cascivo/react')
    console.log('  packages and never copies source. `cascivo add <component>` writes the')
    console.log('  config itself the first time you vendor a component.')
    if (resolvedFramework === 'cloudflare') {
      console.log('\n  worker/index.ts is the API (wrangler.jsonc routes /api/* to it); `dev`')
      console.log('  runs it in workerd. Deploy with `npx wrangler login` once, then the')
      console.log(`  deploy script: ${runExplicitCommand(pm, 'deploy')}`)
      console.log('\n  No account yet? Share a 60-minute preview, claimable into a free account:')
      console.log(`  ${runExplicitCommand(pm, 'deploy:preview')}`)
    } else if (resolvedFramework === 'astro') {
      console.log('\n  Pages are real Astro routes — no client router to add. Only src/')
      console.log('  components/Shell.tsx hydrates (client:load, for the mobile nav drawer);')
      console.log('  page content is server-rendered and ships no JS. See')
      console.log('  https://cascivo.com/docs/using-with-astro.md')
    } else {
      console.log('\n  Adding a router? Keep src/Shell.tsx, delete src/App.tsx + src/sections/,')
      console.log('  and register your Link once with setLinkComponent — see')
      console.log('  https://cascivo.com/docs/using-with-a-router.md')
    }
  } finally {
    rl?.close()
  }
}
