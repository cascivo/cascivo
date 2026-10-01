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
   * did not let through. `email`: accounts with emailed sign-in links; every API write needs
   * a signed-in user.
   */
  auth?: 'access' | 'email'
}

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
            '@cloudflare/ai-chat': '^0.12.0',
            agents: '^0.24.0',
            ai: '^7.0.0',
            'workers-ai-provider': '^4.0.0',
            zod: '^4.0.0',
          }
        : {}),
      // The /voice page: the Agents SDK's voice pipeline and its browser client.
      ...(hasExample(opts, 'voice') && !agent ? { agents: '^0.24.0' } : {}),
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
    hasExample(opts, 'files')
      ? `
  // Uploaded files, and Cloudflare Images for their resized previews.
${jsoncArray('  ', 'r2_buckets', [`{ "binding": "FILES", "bucket_name": "${packageName(opts.name)}-files" }`])}
  "images": { "binding": "IMAGES" },`
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
    opts.auth === 'email' ? 'sign-in emails' : '',
  ]
    .filter(Boolean)
    .join(', ')
    .replace(/^./, (c) => c.toUpperCase())} per caller: 20 a minute.
  // namespace_id is any number unique within your account:
  // https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
${jsoncArray('  ', 'ratelimits', ['{ "name": "LIMITER", "namespace_id": "1001", "simple": { "limit": 20, "period": 60 } }'])}`
      : ''
  }${wranglerVars(opts)}${
    hasExample(opts, 'digest')
      ? `
  // The weekly digest: Mondays at 08:00 UTC (worker/digest.ts).
  "triggers": { "crons": ["0 8 * * 1"] },`
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
    opts.auth === 'email' ? 'accounts' : '',
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
    hasExample(opts, 'import')
      ? `
  // The CSV import runs as a Workflow (worker/import-job.ts); its progress is a room.
  "workflows": [{ "name": "import-job", "binding": "IMPORT_JOB", "class_name": "ImportJob" }],`
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
  const checkout = hasExample(opts, 'checkout')
  const newsletter = hasExample(opts, 'newsletter')
  const emailAuth = opts.auth === 'email'
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
${comments.map((comment) => `  // ${comment}`).join('\n')}${emailAuth || digest || checkout ? '\n  "send_email": [{ "name": "EMAIL" }],' : ''}
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

/** A subscription plan needs an account to belong to: checkout with --auth email bills one. */
function usesBilling(opts: ScaffoldOptions): boolean {
  return hasExample(opts, 'checkout') && opts.auth === 'email'
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
    opts.auth === 'email'
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
    opts.auth === 'email'
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
  return usesAgents(opts) || hasExample(opts, 'import')
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
  return `import { defineApi, ${imports || files || usage || crud || live || publish || webhooks || digest || search || checkout || newsletter ? 'endpoint, ' : ''}stream } from '@cascivo/app/api'
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
  }
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
  const emailAuth = opts.auth === 'email'
  const guards = [
    ...(access ? ['requireAccess'] : []),
    ...(limiter ? ['clientIp', 'rateLimit'] : []),
  ]
  const custom = rooms || ai || files || exports || access || live || limiter || publish
  const isAsync =
    ai || files || exports || access || limiter || webhooks || publish || checkout || newsletter
  // Rooms the server writes: never opened through /api/rooms/:name, where clients may write.
  const serverRooms = [
    ...(imports ? ['job-'] : []),
    ...(webhooks ? ['webhooks$'] : []),
    ...(checkout ? ['order-'] : []),
    ...(newsletter ? ['issue-'] : []),
  ]
  // Writes --auth email does not ask to sign in: webhooks carry a signature instead of a
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
${emailAuth ? `import { handleAuth, requireUser } from '@cascivo/app/auth-server'\n` : ''}${guards.length > 0 || webhooks ? `import { ${[...guards, 'guardResponse'].sort().join(', ')} } from '@cascivo/app/guard'\n${limiter ? `import type { RateLimiter } from '@cascivo/app/guard'\n` : ''}` : ''}${imports ? `import { jobReporter } from '@cascivo/app/jobs-server'\n` : ''}${
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
${imports ? `import { importJob } from '../src/import-job'\n` : ''}${files ? `import { uploads } from '../src/upload-policy'\n` : ''}${usage ? `import { usageMetrics } from '../src/usage'\nimport { usageReport } from './usage'\n` : ''}${live ? `import { OPS_ROOM, ops } from '../src/ops'\n` : ''}${emailAuth ? `import { sendSignInLink } from './auth'\nimport type { SignInSender } from './auth'\n` : ''}${crud ? `import * as customerStore from './customers'\n` : ''}${publish ? `import * as pageStore from './pages'\nimport { renderPageHtml } from './page-html'\nimport type { Assets } from './page-html'\n${exports ? `import { pagePreview } from './page-preview'\n` : ''}` : ''}${webhooks ? `import * as webhookStore from './webhooks'\nimport { DELIVERIES_ROOM } from '../src/webhooks'\n` : ''}${digest ? `import * as digestJob from './digest'\nimport type { DigestSender } from './digest'\n` : ''}${search ? `import * as articleSearch from './search'\nimport type { ${ai ? '' : 'Embedder, '}VectorIndex } from './search'\n` : ''}${billing ? `import * as billingStore from './billing'\n` : ''}${checkout ? `import * as orderStore from './checkout'\nimport type { ReceiptSender } from './checkout'\nimport { ORDER_ID, orderRoom } from '../src/checkout'\n` : ''}${newsletter ? `import * as newsletterStore from './newsletter'\nimport type { NewsletterBatch, NewsletterQueue } from './newsletter'\nimport { ISSUE_ID, issueRoom } from '../src/newsletter'\n` : ''}${
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
  emailAuth ||
  webhooks ||
  digest ||
  search ||
  checkout ||
  newsletter
    ? `export interface Env {${ai ? '\n  /** Workers AI, bound in wrangler.jsonc. */\n  AI: Ai' : search ? '\n  /** Workers AI, bound in wrangler.jsonc. */\n  AI: Embedder' : ''}${search ? '\n  ARTICLES_INDEX: VectorIndex' : ''}${rooms ? '\n  ROOMS: RoomNamespace<unknown>' : ''}${imports ? '\n  IMPORT_JOB: Workflow<{ csv: string }>' : ''}${files ? '\n  FILES: UploadBucket\n  IMAGES: ImageResizer' : ''}${exports ? '\n  BROWSER: BrowserWorker' : ''}${usage ? '\n  USAGE: AnalyticsDataset\n  /** Secrets for reading Analytics Engine back (see README). */\n  CF_ACCOUNT_ID?: string\n  CF_API_TOKEN?: string' : ''}${d1 ? '\n  DB: Database' : ''}${publish ? '\n  ASSETS: Assets' : ''}${live ? '\n  LIVE: RoomNamespace<unknown>\n  EVENTS: LiveQueue' : ''}${limiter ? '\n  LIMITER: RateLimiter' : ''}${access ? '\n  /** Set in wrangler.jsonc (see README). */\n  ACCESS_TEAM_DOMAIN: string\n  ACCESS_AUD: string' : ''}${webhooks ? '\n  /** The webhook signing secret: `wrangler secret put WEBHOOK_SECRET` (.dev.vars locally). */\n  WEBHOOK_SECRET: string' : ''}${emailAuth || digest || checkout ? `\n  EMAIL: ${[emailAuth ? 'SignInSender' : '', digest ? 'DigestSender' : '', checkout ? 'ReceiptSender' : ''].filter(Boolean).join(' & ')}` : ''}${emailAuth ? '\n  /** The From address of sign-in emails, set in wrangler.jsonc. */\n  AUTH_FROM: string' : ''}${digest ? '\n  /** The weekly digest (worker/digest.ts), set in wrangler.jsonc. */\n  DIGEST_TO: string\n  DIGEST_FROM: string\n  APP_URL: string' : ''}${checkout ? '\n  /** The From address of receipts, set in wrangler.jsonc. */\n  RECEIPT_FROM: string\n  /** Stripe secrets: `wrangler secret put` (.dev.vars locally). Unset until you add them. */\n  STRIPE_SECRET_KEY?: string\n  STRIPE_WEBHOOK_SECRET?: string' : ''}${newsletter ? '\n  NEWSLETTER: NewsletterQueue\n  /** The newsletter (worker/newsletter.ts), set in wrangler.jsonc. */\n  AWS_REGION: string\n  NEWSLETTER_FROM: string\n  SNS_TOPIC_ARN: string\n  /** Secrets: `wrangler secret put` (.dev.vars locally). Unset until you add them. */\n  AWS_ACCESS_KEY_ID?: string\n  AWS_SECRET_ACCESS_KEY?: string\n  NEWSLETTER_KEY?: string' : ''}
}`
    : `// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- bindings are added as members
export interface Env {}`
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
${
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
        emailAuth
          ? `
    // Sign-in links and sessions: /api/auth/* is answered here (worker/auth.ts sends mail).
    const signIn = await handleAuth(env.DB, {
      sendLink: (email, url) => sendSignInLink(env.EMAIL, env.AUTH_FROM, email, url),
      exposeLink: import.meta.env.DEV,
    })(request)
    if (signIn) return signIn
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
          billing
            ? `, (id) =>
          billingStore.syncSubscription(env, id),
        `
            : ''
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
    digest
      ? `
  // The Cron Trigger in wrangler.jsonc: the weekly digest, recorded whatever happens.
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await digestJob.runDigest(env, () => puppeteer.launch(env.BROWSER), 'cron')
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

function cfLiveTs(): string {
  return `import { createClient } from '@cascivo/app/api'
import { signal } from '@cascivo/react'
import { api } from './api'
import type { Tick } from './api'

const client = createClient(api)

// Module-level signals: any component that reads them re-renders when they change, and
// writing them from plain functions needs no hooks.
export const ticks = signal<Tick[]>([])
export const status = signal<'idle' | 'live' | 'error'>('idle')
export const error = signal<string | null>(null)

let controller: AbortController | null = null

/** Opens the Worker's event stream and appends each tick until it ends or is stopped. */
export async function connect(): Promise<void> {
  if (controller) return
  const abort = new AbortController()
  controller = abort
  ticks.value = []
  error.value = null
  status.value = 'live'
  try {
    for await (const tick of client.ticks({ signal: abort.signal })) {
      ticks.value = [...ticks.value, tick]
    }
    status.value = 'idle'
  } catch (cause) {
    if (abort.signal.aborted) {
      status.value = 'idle'
    } else {
      status.value = 'error'
      error.value = cause instanceof Error ? cause.message : String(cause)
    }
  } finally {
    if (controller === abort) controller = null
  }
}

export function disconnect(): void {
  controller?.abort()
}
`
}

function cfLiveCardTsx(): string {
  return `import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Flex,
  Text,
  useSignals,
} from '@cascivo/react'
import { TICKS_PER_STREAM } from './api'
import { connect, disconnect, error, status, ticks } from './live'

/** Streams server-sent events from worker/index.ts into signals via src/live.ts. */
export function LiveCard() {
  useSignals()
  const live = status.value === 'live'
  const latest = ticks.value.at(-1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live from your Worker</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex gap={3}>
          <Text muted>
            <code>worker/index.ts</code> streams events; <code>src/live.ts</code> reads them through
            the typed client for <code>src/api.ts</code>.
          </Text>
          <Flex direction="horizontal" align="center" gap={2}>
            <Badge variant={live ? 'success' : status.value === 'error' ? 'danger' : 'neutral'}>
              {live ? 'Live' : status.value === 'error' ? 'Error' : 'Idle'}
            </Badge>
            <Text>
              {latest
                ? \`Tick \${latest.n} of \${TICKS_PER_STREAM} at \${new Date(latest.at).toLocaleTimeString()}\`
                : 'No events yet'}
            </Text>
          </Flex>
          {error.value !== null && <Text muted>{error.value}</Text>}
          <div>
            <Button
              variant={live ? 'secondary' : 'primary'}
              onClick={live ? disconnect : () => void connect()}
            >
              {live ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </Flex>
      </CardContent>
    </Card>
  )
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

function cfRouterTs(): string {
  return `import { createRouter } from '@cascivo/app'
import { notFound, routes } from './routes.gen'

// \`routes.gen.ts\` is written by \`cascivoRoutes()\` (vite.config.ts) from \`src/routes/\`:
// add, rename or delete a file there and the route table follows.
export const router = createRouter({ routes, notFound })
`
}

function cfAppTsx(sections: Section[], opts: ScaffoldOptions): string {
  const items = sections.map((s, i) => ({ label: s.label, href: cfSectionPath(s, i) }))
  if (hasExample(opts, 'agent')) items.push({ label: 'Assistant', href: '/assistant' })
  if (hasExample(opts, 'board')) items.push({ label: 'Board', href: '/board' })
  if (hasExample(opts, 'notes')) items.push({ label: 'Notes', href: '/notes' })
  if (hasExample(opts, 'import')) items.push({ label: 'Import', href: '/import' })
  if (hasExample(opts, 'files')) items.push({ label: 'Files', href: '/files' })
  if (hasExample(opts, 'export')) items.push({ label: 'Report', href: '/report' })
  if (hasExample(opts, 'usage')) items.push({ label: 'Usage', href: '/usage' })
  if (hasExample(opts, 'crud')) items.push({ label: 'Customers', href: '/customers' })
  if (hasExample(opts, 'live')) items.push({ label: 'Ops', href: '/ops' })
  if (hasExample(opts, 'voice')) items.push({ label: 'Voice', href: '/voice' })
  if (hasExample(opts, 'publish')) items.push({ label: 'Publish', href: '/publish' })
  if (hasExample(opts, 'webhooks')) items.push({ label: 'Webhooks', href: '/webhooks' })
  if (hasExample(opts, 'digest')) items.push({ label: 'Digest', href: '/digest' })
  if (hasExample(opts, 'search')) items.push({ label: 'Search', href: '/search' })
  if (hasExample(opts, 'checkout')) items.push({ label: 'Checkout', href: '/checkout' })
  if (usesBilling(opts)) items.push({ label: 'Billing', href: '/billing' })
  if (hasExample(opts, 'newsletter')) {
    items.push({ label: 'Newsletter', href: '/newsletter' })
    items.push({ label: 'Send newsletter', href: '/newsletter/send' })
  }
  if (opts.auth === 'email') items.push({ label: 'Account', href: '/account' })
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

function cfMainTsx(): string {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { setLinkComponent } from '@cascivo/react'
import App from './App'
import { router } from './router'

// SideNav, ShellHeader and Breadcrumb render their links through the router from here on.
setLinkComponent(router.Link)

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

function cf404Tsx(): string {
  return `import { EmptyState } from '@cascivo/react'

export default function NotFound() {
  return <EmptyState title="Page not found" description="There is nothing at this address." />
}
`
}

/* --- `--example board`: a multiplayer board on @cascivo/app/sync + a SyncRoom DO --- */

function cfBoardTs(): string {
  return `import { connectRoom } from '@cascivo/app/sync'

export interface Note {
  text: string
  x: number
  y: number
}

export interface Cursor {
  x: number
  y: number
}

/** \`/board?room=team\` is its own board; the room name is what the Worker routes on. */
export const roomName =
  (new URLSearchParams(location.search).get('room') ?? '').replace(/[^\\w-]/g, '').slice(0, 64) ||
  'lobby'

// One WebSocket to the room's Durable Object. It connects when this module first loads (the
// /board route is its own chunk) and reconnects on its own.
export const room = connectRoom(\`/api/rooms/\${roomName}\`)

/**
 * Values in a room come from other people, so they are parsed, not cast. A note that fails
 * this is ignored rather than breaking the board.
 */
export function parseNote(raw: unknown): Note {
  if (typeof raw === 'object' && raw !== null) {
    const { text, x, y } = raw as Record<string, unknown>
    if (typeof text === 'string' && typeof x === 'number' && typeof y === 'number') {
      return { text, x, y }
    }
  }
  throw new Error('Malformed note')
}

export function parseCursor(raw: unknown): Cursor | null {
  if (typeof raw === 'object' && raw !== null) {
    const { x, y } = raw as Record<string, unknown>
    if (typeof x === 'number' && typeof y === 'number') return { x, y }
  }
  return null
}

/** Notes by id. Each note is its own path, so two people editing two notes never collide. */
export const notes = room.map('notes', parseNote)

export function addNote(): void {
  const offset = Object.keys(notes.value).length * 24
  notes.set(crypto.randomUUID(), { text: '', x: 24 + (offset % 240), y: 24 + (offset % 160) })
}
`
}

function cfBoardRouteTsx(): string {
  return `import type { PointerEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Text,
  Textarea,
  useSignals,
} from '@cascivo/react'
import { addNote, notes, parseCursor, room, roomName } from '../board'
import type { Note } from '../board'
import styles from '../board.module.css'

let frame = 0

/** Shares this pointer's position on the board, at most once per frame. */
function trackCursor(event: PointerEvent<HTMLDivElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  const cursor = {
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top),
  }
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => room.setPresence(cursor))
}

/** Drags a note by its handle; every move is a write the whole room sees. */
function startDrag(event: PointerEvent<HTMLDivElement>, id: string, note: Note) {
  if ((event.target as Element).closest('button')) return
  const handle = event.currentTarget
  handle.setPointerCapture(event.pointerId)
  const dx = event.clientX - note.x
  const dy = event.clientY - note.y
  const move = (e: globalThis.PointerEvent) => {
    const current = notes.value[id]
    if (current)
      notes.set(id, { ...current, x: Math.max(0, e.clientX - dx), y: Math.max(0, e.clientY - dy) })
  }
  const up = () => {
    handle.removeEventListener('pointermove', move)
    handle.removeEventListener('pointerup', up)
  }
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', up)
}

function NoteCard({ id, note }: { id: string; note: Note }) {
  return (
    <div className={styles['note']} style={{ transform: \`translate(\${note.x}px, \${note.y}px)\` }}>
      <Card>
        <div className={styles['handle']} onPointerDown={(event) => startDrag(event, id, note)}>
          <Text size="sm" muted>
            Drag
          </Text>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Delete note"
            onClick={() => notes.delete(id)}
          >
            ×
          </Button>
        </div>
        <CardContent>
          <Textarea
            aria-label="Note text"
            rows={3}
            value={note.text}
            onChange={(event) => notes.set(id, { ...note, text: event.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Board() {
  useSignals()
  const connected = room.status.value === 'open'
  const others = Object.entries(room.presence.value).flatMap(([id, raw]) => {
    const cursor = parseCursor(raw)
    return cursor ? [{ id, ...cursor }] : []
  })

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Board</Heading>
          <Text muted>
            Room <code>{roomName}</code>. Open this page in a second window: notes, edits and
            cursors sync live through a Durable Object.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={2}>
          <Badge variant={connected ? 'success' : 'neutral'}>
            {connected ? \`\${Object.keys(room.presence.value).length + 1} here\` : 'Connecting…'}
          </Badge>
          <Button onClick={addNote}>Add note</Button>
        </Flex>
      </Flex>
      <div
        className={styles['board']}
        onPointerMove={trackCursor}
        onPointerLeave={() => room.setPresence(null)}
      >
        {Object.entries(notes.value).map(([id, note]) => (
          <NoteCard key={id} id={id} note={note} />
        ))}
        {others.map((cursor) => (
          <span
            key={cursor.id}
            className={styles['cursor']}
            style={{ transform: \`translate(\${cursor.x}px, \${cursor.y}px)\` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </Flex>
  )
}
`
}

function cfBoardCss(): string {
  return `/* Your app's own styles live in the cascivo.example layer (declared in index.html). */
@layer cascivo.example {
  .board {
    position: relative;
    min-block-size: 32rem;
    overflow: hidden;
    border: 1px dashed var(--cascivo-border-default);
    border-radius: var(--cascivo-radius-surface);
    background: var(--cascivo-color-surface);
  }

  /* Positions are shared by everyone in the room, so they are physical (left/top), not
     logical: an RTL visitor must see a note where an LTR one put it. */
  .note {
    position: absolute;
    top: 0;
    left: 0;
    inline-size: 14rem;
  }

  .handle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--cascivo-space-1) var(--cascivo-space-2);
    cursor: grab;
    touch-action: none;
  }

  .cursor {
    position: absolute;
    top: 0;
    left: 0;
    inline-size: 0.75rem;
    block-size: 0.75rem;
    border-radius: 50%;
    background: var(--cascivo-color-accent);
    pointer-events: none;
  }
}
`
}

/* --- `--example agent`: generative UI on Cloudflare's Agents SDK + @cascivo/render --- */

function cfAssistantTs(): string {
  return `import type { ViewConfig } from '@cascivo/render'
import { validateView } from '@cascivo/render/validate'

/**
 * Shared by the Worker (worker/assistant.ts) and the page (src/routes/assistant.tsx): the
 * name the agent is routed under, and the one check both sides run on a generated view.
 */

/** The Durable Object class, its wrangler binding and the \`useAgent({ agent })\` name. */
export const AGENT = 'Assistant'

export type CheckedView = { title: string; view: ViewConfig } | { errors: string[] }

/**
 * Validates a view the model produced against the component manifests — unknown components,
 * invented props and out-of-range values all come back as errors the model can fix. It runs
 * in the Worker before the result is stored, and again in the browser on the stored message,
 * which crossed the network and is checked rather than trusted.
 */
export function checkView(title: unknown, view: unknown): CheckedView {
  if (typeof title !== 'string' || title.length === 0) return { errors: ['title: expected text'] }
  const result = validateView(view)
  if (!result.valid) return { errors: result.errors.map((e) => \`\${e.path}: \${e.message}\`) }
  // validateView has checked the whole shape, so the cast states a proven fact.
  return { title, view: view as ViewConfig }
}
`
}

function cfAssistantWorkerTs(): string {
  return `import { AIChatAgent } from '@cloudflare/ai-chat'
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
import type { LanguageModel } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { z } from 'zod'
import { checkView } from '../src/assistant'
import type { Env } from './index'
import { scriptedModel } from './scripted-model'

/** Any Workers AI model with tool calling. */
const MODEL = '@cf/moonshotai/kimi-k2.7-code'

const SYSTEM = \`You are an assistant inside a web app. When an answer is best shown as UI — a
summary, a status overview, a list — call show_view instead of describing it in text.
A view is { "view": { "regions": { "main": [nodes] } } }.
A node is { "component": Name, "props": { ... }, "children": [nodes] or "text" }.
Components: Flex (direction: "vertical" | "horizontal", gap: 1-8, wrap), Grid (cols: 1-4, gap),
Card (padding: "sm" | "md" | "lg"; content as children), Badge (variant: "default" | "success" |
"warning" | "destructive"; text as children), Alert (variant: "info" | "success" | "warning" |
"destructive", title; text as children), ProgressBar (value, max, label), Separator,
EmptyState (title, description).
If show_view returns errors, fix exactly those and call it again. Keep text replies short.\`

const showView = tool({
  description: 'Show the user a view built from cascivo components. Returns errors to fix, or ok.',
  inputSchema: z.object({
    title: z.string().describe('A short title for the view'),
    view: z.object({ view: z.object({ regions: z.record(z.string(), z.array(z.unknown())) }) }),
  }),
  execute: async ({ title, view }) => checkView(title, view),
})

/**
 * One Durable Object per conversation: it stores the messages in its SQLite database and
 * streams replies to every open tab over a WebSocket, resuming a stream after a reconnect.
 */
export class Assistant extends AIChatAgent<Env> {
  async onChatMessage(_onFinish: unknown, options?: { abortSignal?: AbortSignal }) {
    // \`vite dev\` answers from a scripted model, so the page works offline and without an
    // account. A deployed Worker calls Workers AI, and so does \`VITE_REAL_AI=1 vite dev\`.
    const scripted = import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'
    const model: LanguageModel = scripted
      ? scriptedModel()
      : createWorkersAI({ binding: this.env.AI })(MODEL)
    const result = streamText({
      model,
      system: SYSTEM,
      messages: await convertToModelMessages(this.messages),
      tools: { show_view: showView },
      stopWhen: stepCountIs(4),
      ...(options?.abortSignal ? { abortSignal: options.abortSignal } : {}),
    })
    return result.toUIMessageStreamResponse()
  }
}
`
}

function cfScriptedModelTs(): string {
  return `import { simulateReadableStream } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'

/**
 * A stand-in for Workers AI during \`vite dev\`: it answers every message by calling
 * show_view with the view below, then replies with one line of text. It goes through the
 * same tool, validation and streaming as the real model, so the page can be built offline.
 * Production never imports it — worker/assistant.ts reaches it behind \`import.meta.env.DEV\`.
 */
const VIEW = {
  view: {
    regions: {
      main: [
        {
          component: 'Flex',
          props: { direction: 'vertical', gap: 3 },
          children: [
            {
              component: 'Alert',
              props: { variant: 'info', title: 'Scripted reply' },
              children:
                'vite dev answers from worker/scripted-model.ts. Deploy to talk to Workers AI.',
            },
            {
              component: 'Grid',
              props: { cols: 3, gap: 3 },
              children: [
                {
                  component: 'Card',
                  props: { padding: 'md' },
                  children: [
                    { component: 'Badge', props: { variant: 'success' }, children: 'API healthy' },
                  ],
                },
                {
                  component: 'Card',
                  props: { padding: 'md' },
                  children: [
                    {
                      component: 'Badge',
                      props: { variant: 'warning' },
                      children: '2 jobs queued',
                    },
                  ],
                },
                {
                  component: 'Card',
                  props: { padding: 'md' },
                  children: [{ component: 'Badge', children: '14 users online' }],
                },
              ],
            },
            { component: 'ProgressBar', props: { value: 72, label: 'Sprint progress' } },
          ],
        },
      ],
    },
  },
}

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
}

export function scriptedModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      // After the tool has run, the last prompt message is its result: reply in text.
      if (prompt.at(-1)?.role === 'tool') {
        return {
          stream: simulateReadableStream({
            chunkDelayInMs: 40,
            chunks: [
              { type: 'stream-start', warnings: [] },
              { type: 'text-start', id: 'reply' },
              { type: 'text-delta', id: 'reply', delta: 'Here is the overview ' },
              { type: 'text-delta', id: 'reply', delta: 'you asked for.' },
              { type: 'text-end', id: 'reply' },
              { type: 'finish', usage, finishReason: { unified: 'stop', raw: 'stop' } },
            ],
          }),
        }
      }
      return {
        stream: simulateReadableStream({
          chunkDelayInMs: 40,
          chunks: [
            { type: 'stream-start', warnings: [] },
            {
              type: 'tool-call',
              toolCallId: \`call-\${prompt.length}\`,
              toolName: 'show_view',
              input: JSON.stringify({ title: 'Team overview', view: VIEW }),
            },
            { type: 'finish', usage, finishReason: { unified: 'tool-calls', raw: 'tool_calls' } },
          ],
        }),
      }
    },
  })
}
`
}

function cfAssistantRouteTsx(): string {
  return `import type { FormEvent } from 'react'
import { CascivoView } from '@cascivo/render'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Text,
  Textarea,
  useSignalState,
} from '@cascivo/react'
import { useAgentChat } from '@cloudflare/ai-chat/react'
import { useAgent } from 'agents/react'
import type { UIMessage } from 'ai'
import { AGENT, checkView } from '../assistant'
import styles from '../assistant.module.css'

const STORAGE_KEY = 'assistant-conversation'

/**
 * The conversation this browser continues: its Durable Object's name. Kept in localStorage
 * so a reload picks the conversation back up; a new one each visit where storage is blocked.
 */
function conversationName(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
    const created = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

const conversation = conversationName()

function MessagePart({ part }: { part: UIMessage['parts'][number] }) {
  if (part.type === 'text') return <Text>{part.text}</Text>
  if (part.type !== 'tool-show_view') return null
  if (part.state !== 'output-available') {
    return (
      <Badge variant="neutral">
        {part.state === 'output-error' ? 'View failed' : 'Building a view…'}
      </Badge>
    )
  }
  // The stored message came over the network: check it again rather than trusting it.
  const output: unknown = part.output
  const shown =
    typeof output === 'object' && output !== null && 'title' in output && 'view' in output
      ? checkView(output.title, output.view)
      : null
  if (!shown || 'errors' in shown) {
    // The model saw these errors as the tool result and tries again in the next step.
    return (
      <Badge variant="warning">Rejected a view with {shown?.errors.length ?? 1} problems</Badge>
    )
  }
  return (
    <Card>
      <CardContent>
        <Flex gap={3}>
          <Heading level={3}>{shown.title}</Heading>
          <CascivoView config={shown.view} onInvalid="render" />
        </Flex>
      </CardContent>
    </Card>
  )
}

export default function Assistant() {
  const agent = useAgent({ agent: AGENT, name: conversation })
  const { messages, sendMessage, status, clearHistory } = useAgentChat({ agent })
  const [draft, setDraft] = useSignalState('')
  const busy = status === 'submitted' || status === 'streaming'

  const send = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.value.trim()
    if (!text || busy) return
    void sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
    setDraft('')
  }

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Assistant</Heading>
          <Text muted>
            Ask for an overview, a status page or a list: the agent answers with real components,
            checked against their manifests before they reach you.
          </Text>
        </Flex>
        <Button variant="secondary" onClick={clearHistory} disabled={messages.length === 0}>
          New conversation
        </Button>
      </Flex>
      <ol className={styles['messages']} aria-live="polite">
        {messages.map((message) => (
          <li key={message.id} className={styles[message.role === 'user' ? 'user' : 'assistant']}>
            <Flex gap={2}>
              {message.parts.map((part, index) => (
                <MessagePart key={index} part={part} />
              ))}
            </Flex>
          </li>
        ))}
      </ol>
      <form className={styles['composer']} onSubmit={send}>
        <Textarea
          aria-label="Message"
          rows={2}
          value={draft.value}
          placeholder="Show me the team's status"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) send(event)
          }}
        />
        <Button type="submit" loading={busy}>
          Send
        </Button>
      </form>
    </Flex>
  )
}
`
}

function cfAssistantCss(): string {
  return `/* Your app's own styles live in the cascivo.example layer (declared in index.html). */
@layer cascivo.example {
  .messages {
    display: flex;
    flex-direction: column;
    gap: var(--cascivo-space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .user {
    align-self: end;
    max-inline-size: 80%;
    padding: var(--cascivo-space-2) var(--cascivo-space-3);
    border-radius: var(--cascivo-radius-md);
    background: var(--cascivo-color-bg-subtle);
  }

  .assistant {
    max-inline-size: 100%;
  }

  .composer {
    display: flex;
    gap: var(--cascivo-space-2);
    align-items: end;
  }

  .composer > :first-child {
    flex: 1;
  }
}
`
}

/* --- `--example notes`: a local-first page on @cascivo/app/sync + IndexedDB --- */

function cfNotesTs(): string {
  return `import { connectRoom } from '@cascivo/app/sync'
import { indexedDBDriver } from '@cascivo/storage'

export interface Note {
  title: string
  body: string
  /** Epoch ms of the last edit, for ordering. */
  updatedAt: number
}

const LIST_KEY = 'notes-list'

/**
 * Which list this browser shows: \`?list=\` when the URL names one, otherwise one made up on
 * first visit and remembered. Open the same \`?list=\` on another device to sync with it.
 */
function resolveList(): string {
  const fromUrl = (new URLSearchParams(location.search).get('list') ?? '')
    .replace(/[^\\w-]/g, '')
    .slice(0, 48)
  if (fromUrl) return fromUrl
  try {
    const saved = localStorage.getItem(LIST_KEY)
    if (saved) return saved
    const created = crypto.randomUUID().slice(0, 8)
    localStorage.setItem(LIST_KEY, created)
    return created
  } catch {
    return crypto.randomUUID().slice(0, 8)
  }
}

export const listName = resolveList()

// \`storage\` makes the list local-first: the room's last state and every unconfirmed edit are
// kept in IndexedDB, so edits made while the connection is down survive a reload or a closed
// tab, and go to the room when it is reachable again.
export const room = connectRoom(\`/api/rooms/notes-\${listName}\`, {
  storage: indexedDBDriver('cascivo-notes'),
})

/** Notes come from other devices, so they are parsed, not cast. */
export function parseNote(raw: unknown): Note {
  if (typeof raw === 'object' && raw !== null) {
    const { title, body, updatedAt } = raw as Record<string, unknown>
    if (typeof title === 'string' && typeof body === 'string' && typeof updatedAt === 'number') {
      return { title, body, updatedAt }
    }
  }
  throw new Error('Malformed note')
}

export const notes = room.map('notes', parseNote)

export function addNote(): void {
  notes.set(crypto.randomUUID(), { title: '', body: '', updatedAt: Date.now() })
}

export function editNote(id: string, note: Note, change: Partial<Note>): void {
  notes.set(id, { ...note, ...change, updatedAt: Date.now() })
}
`
}

function cfNotesRouteTsx(): string {
  return `import {
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  useSignals,
} from '@cascivo/react'
import { addNote, editNote, listName, notes, room } from '../notes'

/** Where the list stands: offline edits are counted until the room confirms them. */
function SyncBadge() {
  useSignals()
  const waiting = room.unsynced.value
  if (room.status.value === 'open') {
    return (
      <Badge variant={waiting > 0 ? 'warning' : 'success'}>
        {waiting > 0 ? 'Syncing…' : 'Synced'}
      </Badge>
    )
  }
  return <Badge variant="neutral">{waiting > 0 ? \`Offline · \${waiting} waiting\` : 'Offline'}</Badge>
}

export default function Notes() {
  useSignals()
  const sorted = Object.entries(notes.value).sort(([, a], [, b]) => b.updatedAt - a.updatedAt)

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Notes</Heading>
          <Text muted>
            Keeps working offline: edits are saved on this device and sync when you are back. Open{' '}
            <code>/notes?list={listName}</code> on another device to share this list.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={2}>
          <SyncBadge />
          <Button onClick={addNote}>New note</Button>
        </Flex>
      </Flex>
      {sorted.length === 0 ? <Text muted>No notes yet.</Text> : null}
      {sorted.map(([id, note]) => (
        <Card key={id}>
          <CardContent>
            <Flex gap={2}>
              <Flex direction="horizontal" align="center" gap={2}>
                <Input
                  aria-label="Title"
                  placeholder="Title"
                  value={note.title}
                  onChange={(event) => editNote(id, note, { title: event.target.value })}
                />
                <Button variant="ghost" aria-label="Delete note" onClick={() => notes.delete(id)}>
                  ×
                </Button>
              </Flex>
              <Textarea
                aria-label="Note"
                rows={3}
                value={note.body}
                onChange={(event) => editNote(id, note, { body: event.target.value })}
              />
            </Flex>
          </CardContent>
        </Card>
      ))}
    </Flex>
  )
}
`
}

/* --- `--example import`: a Workflow whose progress streams through @cascivo/app/jobs --- */

function cfImportJobTs(): string {
  return `import { defineJob } from '@cascivo/app/jobs'

/**
 * The CSV import job, shared by the Worker (which runs it) and the page (which watches it).
 * Its output crosses the network, so it is parsed on the way in, never cast.
 */

/** Largest CSV the Worker accepts. A Workflow's params are limited in size, too. */
export const MAX_CSV_LENGTH = 200_000

export interface Rejected {
  /** 1-based line in the CSV. */
  line: number
  reason: string
}

export interface ImportSummary {
  imported: number
  rejected: Rejected[]
}

export function parseImportSummary(raw: unknown): ImportSummary {
  if (typeof raw === 'object' && raw !== null) {
    const { imported, rejected } = raw as Record<string, unknown>
    if (typeof imported === 'number' && Array.isArray(rejected)) {
      return {
        imported,
        rejected: rejected.map((r: unknown) => {
          if (typeof r === 'object' && r !== null) {
            const { line, reason } = r as Record<string, unknown>
            if (typeof line === 'number' && typeof reason === 'string') return { line, reason }
          }
          throw new Error('Malformed rejected row')
        }),
      }
    }
  }
  throw new Error('Malformed import summary')
}

export const importJob = defineJob({
  steps: ['Read', 'Check', 'Import'],
  output: parseImportSummary,
})

export function parseImportRequest(raw: unknown): { csv: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { csv } = raw as Record<string, unknown>
    if (typeof csv === 'string' && csv.length > 0 && csv.length <= MAX_CSV_LENGTH) return { csv }
  }
  throw new Error(\`Send { csv } with 1 to \${MAX_CSV_LENGTH} characters\`)
}

export function parseStarted(raw: unknown): { id: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { id } = raw as Record<string, unknown>
    if (typeof id === 'string' && /^[\\w-]{1,60}$/.test(id)) return { id }
  }
  throw new Error('Malformed job id')
}
`
}

function cfImportPageTs(): string {
  return `import { createClient } from '@cascivo/app/api'
import { watchJob } from '@cascivo/app/jobs'
import type { WatchedJob } from '@cascivo/app/jobs'
import { signal } from '@cascivo/react'
import { api } from './api'
import { importJob } from './import-job'
import type { ImportSummary } from './import-job'

const client = createClient(api)

/** The job this page shows. Kept in the URL (\`?job=\`), so a reload picks it back up. */
export const current = signal<WatchedJob<ImportSummary> | null>(null)
export const starting = signal(false)
export const startError = signal<string | null>(null)

function watch(id: string): void {
  current.value?.close()
  current.value = watchJob(importJob, \`/api/jobs/\${id}\`)
}

const fromUrl = new URLSearchParams(location.search).get('job')
if (fromUrl && /^[\\w-]{1,60}$/.test(fromUrl)) watch(fromUrl)

export async function startImport(csv: string): Promise<void> {
  starting.value = true
  startError.value = null
  try {
    const { id } = await client.startImport({ body: { csv } })
    history.replaceState(null, '', \`/import?job=\${id}\`)
    watch(id)
  } catch (error) {
    startError.value = error instanceof Error ? error.message : 'The import could not start'
  } finally {
    starting.value = false
  }
}
`
}

function cfImportWorkflowTs(): string {
  return `import { jobReporter } from '@cascivo/app/jobs-server'
import { WorkflowEntrypoint } from 'cloudflare:workers'
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import { importJob } from '../src/import-job'
import type { ImportSummary, Rejected } from '../src/import-job'
import type { Env } from './index'

interface Contact {
  line: number
  name: string
  email: string
}

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
const CHUNK = 25

/** \`name,email\` per line, after a header line. Quoted fields are not supported. */
function readCsv(csv: string): Contact[] {
  const lines = csv.split(/\\r?\\n/)
  const rows: Contact[] = []
  lines.forEach((text, i) => {
    if (i === 0 || text.trim() === '') return
    const [name = '', email = ''] = text.split(',').map((cell) => cell.trim())
    rows.push({ line: i + 1, name, email })
  })
  return rows
}

function checkRows(rows: Contact[]): { valid: Contact[]; rejected: Rejected[] } {
  const valid: Contact[] = []
  const rejected: Rejected[] = []
  for (const row of rows) {
    if (!row.name) rejected.push({ line: row.line, reason: 'No name' })
    else if (!EMAIL.test(row.email))
      rejected.push({ line: row.line, reason: 'Not an email address' })
    else valid.push(row)
  }
  return { valid, rejected }
}

/**
 * Write the contacts where they belong (D1, an API…). Here it only waits, so the progress
 * is visible; each chunk is its own step, so a failure retries that chunk alone.
 */
async function importContacts(contacts: Contact[]): Promise<void> {
  console.log(\`import: \${contacts.length} contacts\`)
  await new Promise((resolve) => setTimeout(resolve, 400))
}

/**
 * The import, as a Workflow: each step is retried on failure and its result is kept, so a
 * crash or a deploy resumes the job where it was. Progress goes to the job's room, where the
 * page watches it (\`watchJob\`). Every report is made inside a step: a Workflow replays
 * \`run()\` from the top after each step, and a report outside one would run again.
 */
export class ImportJob extends WorkflowEntrypoint<Env, { csv: string }> {
  override async run(event: WorkflowEvent<{ csv: string }>, step: WorkflowStep) {
    const report = jobReporter(importJob, this.env.ROOMS, event.instanceId)
    let at = 0
    try {
      const rows = await step.do('read', async () => {
        await report.step(0, 'Reading the file')
        return readCsv(event.payload.csv)
      })
      at = 1
      const checked = await step.do('check', async () => {
        await report.step(1, \`Checking \${rows.length} rows\`)
        return checkRows(rows)
      })
      at = 2
      const total = checked.valid.length
      for (let start = 0; start < total; start += CHUNK) {
        await step.do(\`import \${start}\`, async () => {
          await report.progress(2, start / total, \`Imported \${start} of \${total}\`)
          await importContacts(checked.valid.slice(start, start + CHUNK))
        })
      }
      const summary: ImportSummary = { imported: total, rejected: checked.rejected }
      await step.do('done', () => report.done(summary))
      return summary
    } catch (error) {
      await report.fail(error, at)
      throw error
    }
  }
}
`
}

function cfImportRouteTsx(): string {
  return `import type { Step } from '@cascivo/react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  ProgressBar,
  Steps,
  Text,
  Textarea,
  useSignals,
  useSignalState,
} from '@cascivo/react'
import { importJob } from '../import-job'
import type { JobState } from '@cascivo/app/jobs'
import type { ImportSummary } from '../import-job'
import { current, startError, startImport, starting } from '../import-page'

const SAMPLE = [
  'name,email',
  ...Array.from({ length: 120 }, (_, i) => \`Person \${i + 1},person\${i + 1}@example.com\`),
  'No Email,',
  ',nameless@example.com',
].join('\\n')

/** One Steps entry per job step, from where the job is. */
function stepsOf(state: JobState<ImportSummary>): Step[] {
  return importJob.steps.map((label, i) => ({
    id: label,
    label,
    state:
      state.status === 'done' || i < state.step
        ? 'complete'
        : i > state.step || state.status === 'queued'
          ? 'pending'
          : state.status === 'failed'
            ? 'error'
            : 'active',
  }))
}

function JobView() {
  useSignals()
  const job = current.value
  if (!job) return null
  const state = job.state.value
  return (
    <Card>
      <CardContent>
        <Flex gap={3}>
          <Steps steps={stepsOf(state)} activeStep={state.step} ariaLabel="Import progress" />
          {state.status === 'running' && state.progress !== null ? (
            <ProgressBar
              value={Math.round(state.progress * 100)}
              label={state.message ?? 'Importing'}
            />
          ) : (
            <Text muted>
              {state.status === 'queued' ? 'Waiting to start…' : (state.message ?? '')}
            </Text>
          )}
          {state.status === 'done' && state.output ? (
            <Alert variant="success" title={\`Imported \${state.output.imported} contacts\`}>
              {state.output.rejected.length === 0
                ? 'Every row was valid.'
                : \`Rejected: \${state.output.rejected.map((r) => \`line \${r.line} (\${r.reason})\`).join(', ')}\`}
            </Alert>
          ) : null}
          {state.status === 'failed' ? (
            <Alert variant="destructive" title="The import failed">
              {state.error}
            </Alert>
          ) : null}
        </Flex>
      </CardContent>
    </Card>
  )
}

export default function Import() {
  useSignals()
  const [csv, setCsv] = useSignalState(SAMPLE)
  const running = current.value?.state.value.status
  const busy = starting.value || running === 'queued' || running === 'running'

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Import</Heading>
        <Text muted>
          A CSV import running as a Cloudflare Workflow. Each step retries on its own and the job
          survives a deploy; progress streams here, and a reload picks the job back up.
        </Text>
      </Flex>
      <Textarea
        aria-label="CSV to import"
        rows={8}
        value={csv.value}
        onChange={(event) => setCsv(event.target.value)}
      />
      <Flex direction="horizontal" gap={2} align="center">
        <Button onClick={() => void startImport(csv.value)} loading={busy} disabled={busy}>
          Import
        </Button>
        {startError.value ? <Text muted>{startError.value}</Text> : null}
      </Flex>
      <JobView />
    </Flex>
  )
}
`
}

/* --- `--example files`: uploads into R2 through @cascivo/app/uploads, Images previews --- */

function cfUploadPolicyTs(): string {
  return `import { defineUploads } from '@cascivo/app/uploads'

/**
 * What the app accepts, shared by the page (which checks first) and the Worker (which
 * enforces). SVG and HTML are not on the list, and cannot be: served from this origin they
 * would run script.
 */
export const uploads = defineUploads({
  path: '/api/uploads',
  maxBytes: 50 * 1024 * 1024,
  types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
})
`
}

function cfFilesTs(): string {
  return `import { createClient } from '@cascivo/app/api'
import { startUpload } from '@cascivo/app/uploads'
import type { StoredFile, Upload } from '@cascivo/app/uploads'
import { signal } from '@cascivo/react'
import { api } from './api'
import { uploads } from './upload-policy'

const client = createClient(api)

/** Files being uploaded now, newest first. */
export const inFlight = signal<Upload[]>([])
/** Files already stored (see listUploads for their order). */
export const stored = signal<StoredFile[]>([])

export async function refresh(): Promise<void> {
  stored.value = await client.listFiles()
}

export function addFiles(files: File[]): void {
  for (const file of files) {
    const upload = startUpload(uploads, file)
    inFlight.value = [upload, ...inFlight.value]
    // Once stored, the file moves from the upload list to the file list.
    const stop = upload.status.subscribe((status) => {
      if (status !== 'done') return
      stop()
      inFlight.value = inFlight.value.filter((u) => u !== upload)
      void refresh()
    })
  }
}

export function removeUpload(id: string): void {
  const upload = inFlight.value.find((u) => u.id === id)
  upload?.abort()
  inFlight.value = inFlight.value.filter((u) => u.id !== id)
}
`
}

function cfFilesRouteTsx(): string {
  return `import type { UploaderFile } from '@cascivo/react'
import {
  Card,
  CardContent,
  FileUploader,
  Flex,
  Heading,
  ProgressBar,
  Text,
  useSignals,
} from '@cascivo/react'
import { formatBytes } from '@cascivo/app/uploads'
import { addFiles, inFlight, refresh, removeUpload, stored } from '../files'
import { uploads } from '../upload-policy'
import styles from '../files.module.css'

void refresh()

export default function Files() {
  useSignals()
  const files: UploaderFile[] = inFlight.value.map((upload) => ({
    id: upload.id,
    name: upload.name,
    size: upload.size,
    status: upload.status.value === 'done' ? 'complete' : upload.status.value,
    ...(upload.error.value ? { errorMessage: upload.error.value } : {}),
  }))

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Files</Heading>
        <Text muted>
          Uploads go through the Worker into R2: up to {formatBytes(uploads.maxBytes)} each, large
          files in parts. Images get resized previews from Cloudflare Images.
        </Text>
      </Flex>
      <FileUploader
        multiple
        accept={uploads.types.join(',')}
        maxSize={uploads.maxBytes}
        files={files}
        onFilesAdded={addFiles}
        onRemove={removeUpload}
      />
      {inFlight.value
        .filter((upload) => upload.status.value === 'uploading')
        .map((upload) => (
          <ProgressBar
            key={upload.id}
            value={Math.round(upload.progress.value * 100)}
            label={upload.name}
          />
        ))}
      <div className={styles['grid']}>
        {stored.value.map((file) => (
          <Card key={file.key}>
            <CardContent>
              <Flex gap={2}>
                {file.type.startsWith('image/') ? (
                  <img
                    className={styles['preview']}
                    src={\`\${uploads.path}/\${file.key}?w=320\`}
                    alt={file.name}
                    loading="lazy"
                  />
                ) : null}
                <a href={\`\${uploads.path}/\${file.key}\`} target="_blank" rel="noreferrer">
                  {file.name}
                </a>
                <Text size="sm" muted>
                  {formatBytes(file.size)}
                </Text>
              </Flex>
            </CardContent>
          </Card>
        ))}
      </div>
    </Flex>
  )
}
`
}

function cfFilesCss(): string {
  return `/* Your app's own styles live in the cascivo.example layer (declared in index.html). */
@layer cascivo.example {
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: var(--cascivo-space-3);
  }

  .preview {
    inline-size: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--cascivo-radius-md);
    background: var(--cascivo-color-bg-subtle);
  }
}
`
}

/* --- `--example export`: a page exported to PDF/PNG by Browser Run (@cascivo/app/export) --- */

function cfReportRouteTsx(): string {
  return `import { exportUrl, isExporting } from '@cascivo/app/export'
import type { Column } from '@cascivo/react'
import { Badge, Button, Card, CardContent, DataTable, Flex, Heading, Text } from '@cascivo/react'

interface Month {
  month: string
  revenue: number
  customers: number
  change: number
}

const ROWS: Month[] = [
  { month: 'July', revenue: 48_200, customers: 312, change: 4.1 },
  { month: 'August', revenue: 51_900, customers: 334, change: 7.7 },
  { month: 'September', revenue: 50_300, customers: 341, change: -3.1 },
]

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const COLUMNS: Column<Month>[] = [
  { key: 'month', header: 'Month' },
  { key: 'revenue', header: 'Revenue', align: 'end', render: (row) => money.format(row.revenue) },
  { key: 'customers', header: 'Customers', align: 'end' },
  {
    key: 'change',
    header: 'Change',
    align: 'end',
    render: (row) => (
      <Badge variant={row.change >= 0 ? 'success' : 'warning'}>
        {row.change >= 0 ? '+' : ''}
        {row.change}%
      </Badge>
    ),
  },
]

/**
 * A page worth exporting. The buttons download it as a file, rendered by the Worker in
 * Cloudflare's Browser Run; inside that browser (\`isExporting()\`) they are left out, and
 * App.tsx drops the shell, so the file holds the report and nothing else.
 */
export default function Report() {
  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Quarterly report</Heading>
          <Text muted>Q3 revenue and customers, by month.</Text>
        </Flex>
        {isExporting() ? null : (
          <Flex direction="horizontal" gap={2}>
            <Button asChild variant="secondary">
              <a href={exportUrl('/report', 'png')}>Download PNG</a>
            </Button>
            <Button asChild>
              <a href={exportUrl('/report', 'pdf')}>Download PDF</a>
            </Button>
          </Flex>
        )}
      </Flex>
      <Card>
        <CardContent>
          <DataTable columns={COLUMNS} rows={ROWS} getRowId={(row) => row.month} />
        </CardContent>
      </Card>
    </Flex>
  )
}
`
}

/* --- `--example usage`: API usage in Workers Analytics Engine, charted (@cascivo/app/analytics) --- */

function cfUsageTs(): string {
  return `import { defineMetrics } from '@cascivo/app/analytics'

/**
 * What the Worker records for every API request, in Analytics Engine (worker/index.ts writes
 * it). The names are the columns: a query says {path}, never blob1.
 */
export const usageMetrics = defineMetrics({
  dataset: 'app_usage',
  blobs: ['path', 'method'],
  doubles: ['status', 'duration_ms'],
  index: 'path',
})

export interface UsageReport {
  /** False until the Worker has the secrets it needs to read Analytics Engine. */
  configured: boolean
  hourly: { hour: string; requests: number }[]
  routes: { path: string; requests: number }[]
  totals: { requests: number; errors: number; avgMs: number }
}

function num(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error('Expected a number')
  return raw
}

function str(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('Expected a string')
  return raw
}

function list<T>(raw: unknown, item: (row: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(raw)) throw new Error('Expected a list')
  return raw.map((row: unknown) => {
    if (typeof row !== 'object' || row === null) throw new Error('Expected an object')
    return item(row as Record<string, unknown>)
  })
}

/** The report crosses the network, so the page parses it. */
export function parseUsageReport(raw: unknown): UsageReport {
  if (typeof raw !== 'object' || raw === null) throw new Error('Malformed usage report')
  const r = raw as Record<string, unknown>
  const totals = r['totals']
  if (typeof r['configured'] !== 'boolean' || typeof totals !== 'object' || totals === null) {
    throw new Error('Malformed usage report')
  }
  const t = totals as Record<string, unknown>
  return {
    configured: r['configured'],
    hourly: list(r['hourly'], (row) => ({
      hour: str(row['hour']),
      requests: num(row['requests']),
    })),
    routes: list(r['routes'], (row) => ({
      path: str(row['path']),
      requests: num(row['requests']),
    })),
    totals: { requests: num(t['requests']), errors: num(t['errors']), avgMs: num(t['avgMs']) },
  }
}
`
}

function cfUsageWorkerTs(): string {
  return `import { numberField, queryAnalytics, stringField } from '@cascivo/app/analytics'
import type { AnalyticsCredentials } from '@cascivo/app/analytics'
import { usageMetrics } from '../src/usage'
import type { UsageReport } from '../src/usage'

const LAST_DAY = "timestamp > NOW() - INTERVAL '1' DAY"

/** A number, or 0 when the query had nothing to sum (an empty day). */
const orZero = (row: unknown, name: string): number => {
  try {
    return numberField(row, name)
  } catch {
    return 0
  }
}

/**
 * The last 24 hours of API usage, from Analytics Engine's SQL API. Counts are
 * \`SUM(_sample_interval)\`, never \`COUNT()\`: Analytics Engine samples at high volume, and each
 * row stands for \`_sample_interval\` requests.
 */
export async function usageReport(credentials: AnalyticsCredentials | null): Promise<UsageReport> {
  if (!credentials) {
    return {
      configured: false,
      hourly: [],
      routes: [],
      totals: { requests: 0, errors: 0, avgMs: 0 },
    }
  }
  const [hourly, routes, totals, errors] = await Promise.all([
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        \`SELECT toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour, SUM(_sample_interval) AS requests
         FROM {dataset} WHERE \${LAST_DAY} GROUP BY hour ORDER BY hour\`,
      ),
      (row) => ({ hour: stringField(row, 'hour'), requests: numberField(row, 'requests') }),
    ),
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        \`SELECT {path} AS path, SUM(_sample_interval) AS requests
         FROM {dataset} WHERE \${LAST_DAY} GROUP BY path ORDER BY requests DESC LIMIT 8\`,
      ),
      (row) => ({ path: stringField(row, 'path'), requests: numberField(row, 'requests') }),
    ),
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        \`SELECT SUM(_sample_interval) AS requests,
                SUM(_sample_interval * {duration_ms}) / SUM(_sample_interval) AS avg_ms
         FROM {dataset} WHERE \${LAST_DAY}\`,
      ),
      (row) => ({ requests: orZero(row, 'requests'), avgMs: orZero(row, 'avg_ms') }),
    ),
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        \`SELECT SUM(_sample_interval) AS errors FROM {dataset} WHERE \${LAST_DAY} AND {status} >= 500\`,
      ),
      (row) => orZero(row, 'errors'),
    ),
  ])
  return {
    configured: true,
    hourly,
    routes,
    totals: {
      requests: totals[0]?.requests ?? 0,
      errors: errors[0] ?? 0,
      avgMs: Math.round(totals[0]?.avgMs ?? 0),
    },
  }
}
`
}

function cfUsageRouteTsx(): string {
  return `import { BarChart, Kpi, LineChart } from '@cascivo/charts'
import { createClient } from '@cascivo/app/api'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Grid,
  Heading,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import type { UsageReport } from '../usage'

const client = createClient(api)
const report = signal<UsageReport | null>(null)
const failed = signal<string | null>(null)

async function load(): Promise<void> {
  failed.value = null
  try {
    report.value = await client.usage()
  } catch (error) {
    failed.value = error instanceof Error ? error.message : 'Could not load usage'
  }
}
void load()

/** Analytics Engine returns hours as "2026-09-30 14:00:00", in UTC. */
const toDate = (hour: string) => new Date(\`\${hour.replace(' ', 'T')}Z\`)

export default function Usage() {
  useSignals()
  const data = report.value

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Usage</Heading>
          <Text muted>Every API request, recorded by the Worker in Workers Analytics Engine.</Text>
        </Flex>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </Flex>
      {failed.value ? <Text muted>{failed.value}</Text> : null}
      {data && !data.configured ? (
        <EmptyState
          title="Connect Analytics Engine to read usage"
          description="The Worker already records every request. To read them back it needs your account id and an API token with Account Analytics: Read, as secrets: npx wrangler secret put CF_ACCOUNT_ID, then npx wrangler secret put CF_API_TOKEN. For vite dev, put both in .dev.vars."
        />
      ) : null}
      {data && data.configured ? (
        <>
          <Grid cols={3} gap={3}>
            <Kpi label="Requests, 24 h" value={data.totals.requests.toLocaleString()} />
            <Kpi label="Server errors" value={data.totals.errors.toLocaleString()} />
            <Kpi label="Average latency" value={\`\${data.totals.avgMs} ms\`} />
          </Grid>
          <Card>
            <CardContent>
              <LineChart
                title="Requests per hour"
                series={[{ id: 'requests', label: 'Requests', data: data.hourly }]}
                x={(d) => toDate(d.hour)}
                y={(d) => d.requests}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <BarChart
                title="Busiest routes"
                series={[{ id: 'routes', label: 'Requests', data: data.routes }]}
                x={(d) => d.path}
                y={(d) => d.requests}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </Flex>
  )
}
`
}

/* --- `--example search`: help articles by meaning (Vectorize + Workers AI) --- */

function cfSearchTs(): string {
  return `/**
 * /search, shared by the Worker (which searches) and the page (which asks). \`semantic\` is
 * Vectorize over Workers AI embeddings; \`keyword\` is the \`vite dev\` stand-in, SQLite's
 * full-text search, because neither runs locally.
 */
export interface SearchHit {
  id: string
  title: string
  body: string
  /** Higher is closer. Cosine similarity when semantic; a rank when keyword. */
  score: number
}

export interface SearchResult {
  mode: 'semantic' | 'keyword'
  hits: SearchHit[]
  /** Articles in the vector index, when semantic: 0 until "Index articles" has run. */
  indexed: number | null
}

export function parseSearchQuery(raw: unknown): { q: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { q } = raw as Record<string, unknown>
    if (typeof q === 'string' && q.trim() !== '' && q.length <= 200) return { q: q.trim() }
  }
  throw new Error('Expected { q }: 1–200 characters')
}

function parseHit(raw: unknown): SearchHit {
  if (typeof raw === 'object' && raw !== null) {
    const { id, title, body, score } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof title === 'string' &&
      typeof body === 'string' &&
      typeof score === 'number'
    ) {
      return { id, title, body, score }
    }
  }
  throw new Error('Malformed search hit')
}

export function parseSearchResult(raw: unknown): SearchResult {
  if (typeof raw === 'object' && raw !== null) {
    const { mode, hits, indexed } = raw as Record<string, unknown>
    if (
      (mode === 'semantic' || mode === 'keyword') &&
      Array.isArray(hits) &&
      (indexed === null || typeof indexed === 'number')
    ) {
      return { mode, hits: hits.map(parseHit), indexed }
    }
  }
  throw new Error('Malformed search result')
}

export function parseIndexed(raw: unknown): { indexed: number } {
  if (typeof raw === 'object' && raw !== null) {
    const { indexed } = raw as Record<string, unknown>
    if (typeof indexed === 'number') return { indexed }
  }
  throw new Error('Malformed reply')
}
`
}

function cfSearchWorkerTs(): string {
  return `import { HttpError } from '@cascivo/app/api'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import type { SearchHit, SearchResult } from '../src/search'
import { articles } from './articles'

/** A Workers AI embedding model; its dimensions (768) are the Vectorize index's. */
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'

// \`vite dev\` has neither Workers AI nor Vectorize, so it searches with SQLite's full-text
// index instead: by words, not meaning. \`VITE_REAL_AI=1 vite dev\` uses the real ones.
const keywordOnly = import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'

/** What search needs of the Vectorize binding. */
export interface VectorIndex {
  query(
    vector: number[],
    options: { topK: number },
  ): Promise<{ matches: { id: string; score: number }[] }>
  upsert(vectors: { id: string; values: number[] }[]): Promise<unknown>
  describe(): Promise<{ vectorCount: number }>
}

/** What search needs of the Workers AI binding. */
export interface Embedder {
  run(model: typeof EMBEDDING_MODEL, input: { text: string[] }): Promise<unknown>
}

export interface SearchEnv {
  DB: Database
  AI: Embedder
  ARTICLES_INDEX: VectorIndex
}

const migrations = [
  {
    id: '0001_articles',
    statements: [
      'CREATE TABLE articles (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL)',
      "CREATE VIRTUAL TABLE articles_fts USING fts5(title, body, content='articles', content_rowid='rowid')",
    ],
  },
]

/** The schema, then the articles (once: a second isolate's inserts are ignored). */
async function ready(db: Database): Promise<void> {
  await migrate(db, migrations)
  const [seeded] = await queryRows(db, 'SELECT COUNT(*) AS n FROM articles', [], (row) =>
    typeof row === 'object' && row !== null ? Number((row as Record<string, unknown>)['n']) : 0,
  )
  if (seeded) return
  await db.batch([
    ...articles.map((a) =>
      db
        .prepare('INSERT OR IGNORE INTO articles (id, title, body) VALUES (?, ?, ?)')
        .bind(a.id, a.title, a.body),
    ),
    // The full-text index reads the articles table; rebuild it from what is there now.
    db.prepare("INSERT INTO articles_fts (articles_fts) VALUES ('rebuild')"),
  ])
}

function parseRow(raw: unknown): SearchHit {
  if (typeof raw === 'object' && raw !== null) {
    const { id, title, body, score } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof title === 'string' && typeof body === 'string') {
      return { id, title, body, score: typeof score === 'number' ? score : 0 }
    }
  }
  throw new Error('Malformed article row')
}

/** Embeddings from Workers AI, checked: a model's reply is data like any other. */
async function embed(ai: Embedder, texts: string[]): Promise<number[][]> {
  const reply = await ai.run(EMBEDDING_MODEL, { text: texts })
  const data =
    typeof reply === 'object' && reply !== null ? (reply as Record<string, unknown>)['data'] : null
  if (
    !Array.isArray(data) ||
    data.length !== texts.length ||
    !data.every((v) => Array.isArray(v) && v.every((n) => typeof n === 'number'))
  ) {
    throw new Error('Workers AI returned no embeddings')
  }
  return data as number[][]
}

/** Every word as a quoted FTS5 term, OR-ed: user input never reaches FTS5's query syntax. */
function keywordQuery(q: string): string | null {
  const words = q.toLowerCase().match(/[\\p{L}\\p{N}]+/gu) ?? []
  return words.length > 0 ? words.map((w) => \`"\${w}"\`).join(' OR ') : null
}

export async function search(env: SearchEnv, q: string): Promise<SearchResult> {
  await ready(env.DB)
  if (keywordOnly) {
    const match = keywordQuery(q)
    const hits = match
      ? await queryRows(
          env.DB,
          \`SELECT a.id, a.title, a.body, -bm25(articles_fts) AS score
           FROM articles_fts JOIN articles a ON a.rowid = articles_fts.rowid
           WHERE articles_fts MATCH ? ORDER BY score DESC LIMIT 5\`,
          [match],
          parseRow,
        )
      : []
    return { mode: 'keyword', hits, indexed: null }
  }
  const { vectorCount } = await env.ARTICLES_INDEX.describe()
  const [vector] = await embed(env.AI, [q])
  const { matches } = await env.ARTICLES_INDEX.query(vector!, { topK: 5 })
  if (matches.length === 0) return { mode: 'semantic', hits: [], indexed: vectorCount }
  const rows = await queryRows(
    env.DB,
    \`SELECT id, title, body FROM articles WHERE id IN (\${matches.map(() => '?').join(', ')})\`,
    matches.map((m) => m.id),
    parseRow,
  )
  const byId = new Map(rows.map((row) => [row.id, row]))
  const hits = matches.flatMap((m) => {
    const row = byId.get(m.id)
    return row ? [{ ...row, score: m.score }] : []
  })
  return { mode: 'semantic', hits, indexed: vectorCount }
}

/**
 * Embeds every article and upserts it into the Vectorize index. Vectorize applies writes a few
 * seconds later, so \`indexed\` counts what it had already applied when this finished.
 */
export async function indexArticles(env: SearchEnv): Promise<{ indexed: number }> {
  if (keywordOnly)
    throw new HttpError(400, 'vite dev searches by keyword: there is nothing to index')
  await ready(env.DB)
  const rows = await queryRows(env.DB, 'SELECT id, title, body FROM articles', [], parseRow)
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const vectors = await embed(
      env.AI,
      batch.map((row) => \`\${row.title}\\n\${row.body}\`),
    )
    await env.ARTICLES_INDEX.upsert(batch.map((row, j) => ({ id: row.id, values: vectors[j]! })))
  }
  return { indexed: (await env.ARTICLES_INDEX.describe()).vectorCount }
}
`
}

function cfArticlesTs(): string {
  return `/**
 * The help articles /search looks through, seeded into D1 on the first query. Replace them with
 * your own content: anything with an id, a title and a body can be indexed the same way.
 */
export const articles: { id: string; title: string; body: string }[] = [
  {
    id: 'refunds',
    title: 'Refunds',
    body: 'We refund any charge within 30 days of the invoice. Open Billing, pick the invoice and choose Request refund; the amount returns to the card that paid it within five business days.',
  },
  {
    id: 'cancel',
    title: 'Cancelling a subscription',
    body: 'Cancel from Billing at any time. The plan stays active until the end of the period you paid for, and nothing is charged after that.',
  },
  {
    id: 'invoices',
    title: 'Invoices and receipts',
    body: 'Every charge produces an invoice in Billing. Add a tax number and a billing address there, and they appear on every invoice from then on.',
  },
  {
    id: 'change-plan',
    title: 'Changing plans',
    body: 'Upgrade or downgrade from Billing. An upgrade is prorated and charged at once; a downgrade takes effect at the next renewal.',
  },
  {
    id: 'payment-failed',
    title: 'When a payment fails',
    body: 'If a card is declined we retry three times over a week and email the account owner each time. Update the card in Billing to settle the balance.',
  },
  {
    id: 'sso',
    title: 'Single sign-on with SAML',
    body: 'Enterprise workspaces can require sign-in through an identity provider such as Okta or Entra ID. Upload the provider metadata under Security, then test with one account before enforcing it.',
  },
  {
    id: 'two-factor',
    title: 'Two-step verification',
    body: 'Turn on an authenticator app under Profile, Security. Keep the recovery codes somewhere safe: they are the only way back in if the phone is lost.',
  },
  {
    id: 'password-reset',
    title: 'Resetting a password',
    body: 'Choose Forgot password on the sign-in page. The link we email works once and expires after an hour.',
  },
  {
    id: 'invite',
    title: 'Inviting teammates',
    body: 'Admins invite people from Members by email. Each invitation expires after seven days and can be resent.',
  },
  {
    id: 'roles',
    title: 'Roles and permissions',
    body: 'Owners manage billing and security, admins manage members and projects, and members work inside the projects they are added to.',
  },
  {
    id: 'remove-member',
    title: 'Removing someone from the workspace',
    body: 'An admin removes a member from Members. Their projects stay, reassigned to the admin, and their access ends immediately.',
  },
  {
    id: 'export-data',
    title: 'Exporting your data',
    body: 'Download every project as CSV or JSON from Settings, Data. Large workspaces receive an email with a download link when the archive is ready.',
  },
  {
    id: 'delete-account',
    title: 'Deleting a workspace',
    body: 'The owner deletes the workspace under Settings. Data is kept for 30 days in case of a mistake, then erased permanently.',
  },
  {
    id: 'api-keys',
    title: 'API keys',
    body: 'Create keys under Settings, API. A key is shown once; store it as a secret, and rotate it by creating a new key before revoking the old one.',
  },
  {
    id: 'rate-limits',
    title: 'API rate limits',
    body: 'Each key may make 600 requests a minute. A request over the limit receives status 429 with a Retry-After header saying when to try again.',
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    body: 'Subscribe a URL to events under Settings, Webhooks. Each delivery is signed with your secret; verify the signature before trusting the body.',
  },
  {
    id: 'uptime',
    title: 'Status and incidents',
    body: 'Live service status and past incidents are on the status page. Subscribe there to hear about outages and maintenance by email.',
  },
  {
    id: 'data-region',
    title: 'Where data is stored',
    body: 'Choose the EU or US region when creating a workspace. Data at rest stays in that region, and it cannot be moved later.',
  },
  {
    id: 'gdpr',
    title: 'Privacy and GDPR requests',
    body: 'Request a copy of personal data, or its deletion, from Profile, Privacy. We answer within 30 days, as the regulation requires.',
  },
  {
    id: 'dark-mode',
    title: 'Dark mode and themes',
    body: 'Switch between light and dark themes under Profile, Appearance, or follow the operating system setting automatically.',
  },
  {
    id: 'keyboard',
    title: 'Keyboard shortcuts',
    body: 'Press the question mark anywhere to list shortcuts. Command K opens the command menu to jump to any page or action.',
  },
  {
    id: 'notifications',
    title: 'Email notifications',
    body: 'Choose which updates arrive by email under Profile, Notifications, or pause them all for a while.',
  },
  {
    id: 'mobile',
    title: 'Using the mobile app',
    body: 'The iOS and Android apps sign in with the same account and receive push notifications for mentions and assignments.',
  },
  {
    id: 'import',
    title: 'Importing from a spreadsheet',
    body: 'Upload a CSV under Settings, Data, Import. Map each column to a field, preview the first rows, then run the import; errors are listed per row.',
  },
]
`
}

function cfSearchRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Search,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import type { SearchResult } from '../search'

const client = createClient(api)
const result = signal<SearchResult | null>(null)
const failure = signal<string | null>(null)
const indexing = signal(false)

let latest = 0

/** Runs a search (Search debounces typing); an older answer never replaces a newer one. */
function onQuery(q: string): void {
  const ticket = ++latest
  if (q.trim() === '') {
    result.value = null
    return
  }
  client
    .search({ body: { q } })
    .then((answer) => {
      if (ticket === latest) {
        result.value = answer
        failure.value = null
      }
    })
    .catch((error: unknown) => {
      if (ticket === latest)
        failure.value = error instanceof Error ? error.message : 'Search failed'
    })
}

async function indexArticles(): Promise<void> {
  indexing.value = true
  failure.value = null
  try {
    const { indexed } = await client.indexArticles()
    result.value = result.value ? { ...result.value, indexed } : null
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Indexing failed'
  } finally {
    indexing.value = false
  }
}

export default function SearchPage() {
  useSignals()
  const current = result.value

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Search</Heading>
        <Text muted>
          Help articles, searched by meaning once deployed: ask “how do I get my money back” and
          Refunds comes first, though it shares no words with the question. vite dev searches by
          keyword instead.
        </Text>
      </Flex>
      <Search label="Search the help articles" placeholder="Ask a question" onSearch={onQuery} />
      {failure.value ? (
        <Alert variant="destructive" title="Search failed">
          {failure.value}
        </Alert>
      ) : null}
      {current ? (
        <Flex direction="horizontal" align="center" gap={2} wrap>
          <Badge variant={current.mode === 'semantic' ? 'success' : 'warning'}>
            {current.mode === 'semantic'
              ? 'By meaning (Vectorize)'
              : 'By keyword (vite dev stand-in)'}
          </Badge>
          {current.mode === 'semantic' ? (
            <>
              <Text size="sm" muted>
                {current.indexed ?? 0} articles indexed
              </Text>
              <Button
                size="sm"
                variant="secondary"
                loading={indexing.value}
                onClick={() => void indexArticles()}
              >
                Index articles
              </Button>
            </>
          ) : null}
        </Flex>
      ) : null}
      {current && current.hits.length === 0 ? (
        <EmptyState
          title="Nothing found"
          description={
            current.mode === 'semantic' && !current.indexed
              ? 'The index is empty: press Index articles, then search again in a few seconds.'
              : 'Try other words.'
          }
        />
      ) : null}
      {current?.hits.map((hit) => (
        <Card key={hit.id}>
          <CardContent>
            <Flex gap={1}>
              <Text weight="semibold">{hit.title}</Text>
              <Text size="sm" muted>
                {hit.body}
              </Text>
            </Flex>
          </CardContent>
        </Card>
      ))}
    </Flex>
  )
}
`
}

/* --- `--example digest`: the report, rendered and emailed on a Cron Trigger --- */

function cfDigestTs(): string {
  return `/**
 * The weekly digest's runs, shared by the Worker (which records each one) and the /digest page
 * (which lists them). A run happens on the Cron Trigger in wrangler.jsonc, or from "Send now".
 */
export interface DigestRun {
  id: string
  startedAt: string
  /** \`sent\`, \`skipped\` (not configured yet: see \`detail\`) or \`failed\`. */
  status: 'sent' | 'skipped' | 'failed'
  /** Who it went to, why it was skipped, or what failed. */
  detail: string
  /** \`cron\` or \`manual\`. */
  trigger: 'cron' | 'manual'
}

const STATUSES = ['sent', 'skipped', 'failed']
const TRIGGERS = ['cron', 'manual']

export function parseDigestRun(raw: unknown): DigestRun {
  if (typeof raw === 'object' && raw !== null) {
    const { id, startedAt, status, detail, trigger } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof startedAt === 'string' &&
      typeof status === 'string' &&
      STATUSES.includes(status) &&
      typeof detail === 'string' &&
      typeof trigger === 'string' &&
      TRIGGERS.includes(trigger)
    ) {
      // Both checked against their lists just above.
      return {
        id,
        startedAt,
        status: status as DigestRun['status'],
        detail,
        trigger: trigger as DigestRun['trigger'],
      }
    }
  }
  throw new Error('Malformed digest run')
}

export function parseDigestRuns(raw: unknown): DigestRun[] {
  if (!Array.isArray(raw)) throw new Error('Expected a list of runs')
  return raw.map(parseDigestRun)
}
`
}

function cfDigestWorkerTs(): string {
  return `import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { exportPage } from '@cascivo/app/export'
import type { ExportBrowser } from '@cascivo/app/export'
import { parseDigestRun } from '../src/digest'
import type { DigestRun } from '../src/digest'

const migrations = [
  {
    id: '0001_digest_runs',
    statements: [
      \`CREATE TABLE digest_runs (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        status TEXT NOT NULL,
        detail TEXT NOT NULL,
        trigger TEXT NOT NULL
      )\`,
    ],
  },
]

/** What sending the digest needs of the Email Service binding (\`send_email\`). */
export interface DigestSender {
  send(message: {
    from: string
    to: string[]
    subject: string
    text: string
    html: string
    attachments: {
      filename: string
      type: string
      content: Uint8Array
      disposition: 'attachment'
    }[]
  }): Promise<unknown>
}

export interface DigestEnv {
  DB: Database
  EMAIL: DigestSender
  /** Comma-separated recipients, set in wrangler.jsonc. */
  DIGEST_TO: string
  DIGEST_FROM: string
  /** The deployed app's origin, which the browser opens: a cron has no request to read it from. */
  APP_URL: string
}

/** Why the digest cannot be sent yet, or \`null\` when it can. */
function missing(env: DigestEnv, origin: string): string | null {
  const unset = [
    ...(env.DIGEST_TO.trim() ? [] : ['DIGEST_TO']),
    ...(env.DIGEST_FROM.trim() ? [] : ['DIGEST_FROM']),
    ...(origin ? [] : ['APP_URL']),
  ]
  return unset.length > 0 ? \`Set \${unset.join(', ')} in wrangler.jsonc\` : null
}

/**
 * Renders /report to a PDF with Browser Run and emails it to DIGEST_TO. Every run is recorded,
 * whatever happens, so the /digest page shows why a Monday's digest did not arrive.
 */
export async function runDigest(
  env: DigestEnv,
  launch: () => Promise<ExportBrowser>,
  trigger: DigestRun['trigger'],
  origin = env.APP_URL,
): Promise<DigestRun> {
  const run = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), trigger }
  let result: DigestRun
  const skip = missing(env, origin)
  if (skip) {
    result = { ...run, status: 'skipped', detail: skip }
  } else {
    try {
      const pdf = await exportPage(launch, new URL('/report', origin).href, { format: 'pdf' })
      const to = env.DIGEST_TO.split(',')
        .map((address) => address.trim())
        .filter(Boolean)
      const week = run.startedAt.slice(0, 10)
      await env.EMAIL.send({
        from: env.DIGEST_FROM,
        to,
        subject: \`Weekly report, \${week}\`,
        text: 'This week’s report is attached as a PDF.',
        html: '<p>This week’s report is attached as a PDF.</p>',
        attachments: [
          {
            filename: \`report-\${week}.pdf\`,
            type: 'application/pdf',
            content: pdf,
            disposition: 'attachment',
          },
        ],
      })
      result = {
        ...run,
        status: 'sent',
        detail: \`\${to.join(', ')} (\${Math.round(pdf.byteLength / 1024)} KB)\`,
      }
    } catch (error) {
      console.error('[digest] failed:', error)
      result = {
        ...run,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }
  await migrate(env.DB, migrations)
  await env.DB.prepare(
    'INSERT INTO digest_runs (id, started_at, status, detail, trigger) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(result.id, result.startedAt, result.status, result.detail.slice(0, 500), result.trigger)
    .run()
  return result
}

export async function listRuns(db: Database): Promise<DigestRun[]> {
  await migrate(db, migrations)
  return queryRows(
    db,
    \`SELECT id, started_at AS startedAt, status, detail, trigger FROM digest_runs
     ORDER BY started_at DESC LIMIT 20\`,
    [],
    parseDigestRun,
  )
}
`
}

function cfDigestRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Flex,
  Heading,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import type { DigestRun } from '../digest'

const client = createClient(api)
const runs = signal<DigestRun[]>([])
const sending = signal(false)
const failure = signal<string | null>(null)

async function load(): Promise<void> {
  runs.value = await client.digestRuns().catch(() => runs.peek())
}
void load()

async function sendNow(): Promise<void> {
  sending.value = true
  failure.value = null
  try {
    await client.runDigest()
    await load()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not send'
  } finally {
    sending.value = false
  }
}

const VARIANT = { sent: 'success', skipped: 'warning', failed: 'destructive' } as const

export default function Digest() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Weekly digest</Heading>
        <Text muted>
          Every Monday at 08:00 UTC, the Worker renders /report to a PDF and emails it. Each run is
          listed here, including the ones that could not send.
        </Text>
      </Flex>
      <Flex direction="horizontal">
        <Button loading={sending.value} onClick={() => void sendNow()}>
          Send now
        </Button>
      </Flex>
      {failure.value ? (
        <Alert variant="destructive" title="Not sent">
          {failure.value}
        </Alert>
      ) : null}
      {runs.value.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="The first runs on Monday, or press Send now."
        />
      ) : (
        <Flex gap={2}>
          {runs.value.map((run) => (
            <Flex key={run.id} direction="horizontal" align="center" gap={2} wrap>
              <Badge variant={VARIANT[run.status]}>{run.status}</Badge>
              <Text>{run.detail}</Text>
              <Text size="sm" muted>
                {new Date(run.startedAt).toLocaleString()} · {run.trigger}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
`
}

/* --- `--example webhooks`: signed deliveries, stored once, pushed live --- */

function cfWebhooksTs(): string {
  return `/**
 * Webhook deliveries, shared by the Worker (which verifies and stores them) and the
 * /webhooks page (which lists them as they arrive).
 */
export interface Delivery {
  id: string
  /** The sender's event name, e.g. GitHub's \`push\` or \`issues\`. */
  event: string
  /** One line about what happened, taken from the payload. */
  summary: string
  receivedAt: string
}

/** The live room the page watches; the Worker writes each new delivery to \`latest\` in it. */
export const DELIVERIES_ROOM = 'webhooks'

export function parseDelivery(raw: unknown): Delivery {
  if (typeof raw === 'object' && raw !== null) {
    const { id, event, summary, receivedAt } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof event === 'string' &&
      typeof summary === 'string' &&
      typeof receivedAt === 'string'
    ) {
      return { id, event, summary, receivedAt }
    }
  }
  throw new Error('Malformed delivery')
}

export function parseDeliveries(raw: unknown): Delivery[] {
  if (!Array.isArray(raw)) throw new Error('Expected a list of deliveries')
  return raw.map(parseDelivery)
}

export function parseTestResult(raw: unknown): { status: number } {
  if (typeof raw === 'object' && raw !== null) {
    const { status } = raw as Record<string, unknown>
    if (typeof status === 'number') return { status }
  }
  throw new Error('Malformed reply')
}
`
}

function cfWebhooksWorkerTs(): string {
  return `import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { verifyWebhook } from '@cascivo/app/guard'
import { writeRoom } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { DELIVERIES_ROOM, parseDelivery } from '../src/webhooks'
import type { Delivery } from '../src/webhooks'

const migrations = [
  {
    id: '0001_webhook_deliveries',
    statements: [
      \`CREATE TABLE webhook_deliveries (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        summary TEXT NOT NULL,
        received_at TEXT NOT NULL
      )\`,
    ],
  },
]

/** Where GitHub posts; set it as the Payload URL of the repository's webhook. */
export const GITHUB_WEBHOOK_PATH = '/api/webhooks/github'

/** A field of an object, or \`undefined\` for anything else. */
const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

/**
 * One line about a GitHub event. The payload is the sender's JSON, read field by field: a
 * signature proves who sent it, not what shape it has.
 */
function summarize(event: string, payload: unknown): string {
  const repo = field(field(payload, 'repository'), 'full_name')
  const action = field(payload, 'action')
  const where = typeof repo === 'string' ? repo : 'a repository'
  return \`\${event}\${typeof action === 'string' ? \` \${action}\` : ''} in \${where}\`.slice(0, 200)
}

/**
 * Verifies a GitHub delivery, stores it once (a retry has the same X-GitHub-Delivery id and is
 * ignored), and pushes it to the /webhooks page. Answers 202 quickly, as GitHub expects.
 */
export async function receiveGithub(
  request: Request,
  env: { DB: Database; ROOMS: RoomNamespace<unknown>; WEBHOOK_SECRET: string },
): Promise<Response> {
  const { body, id } = await verifyWebhook(request, {
    scheme: 'github',
    secret: env.WEBHOOK_SECRET,
  })
  const event = request.headers.get('x-github-event') ?? 'unknown'
  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Expected a JSON payload' }, { status: 400 })
  }
  const delivery: Delivery = {
    id: id ?? crypto.randomUUID(),
    event: event.slice(0, 60),
    summary: summarize(event, payload),
    receivedAt: new Date().toISOString(),
  }
  await migrate(env.DB, migrations)
  const stored = await queryRows(
    env.DB,
    \`INSERT INTO webhook_deliveries (id, event, summary, received_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (id) DO NOTHING RETURNING id\`,
    [delivery.id, delivery.event, delivery.summary, delivery.receivedAt],
    (row) => row,
  )
  // Only a first delivery reaches the page; a retry was stored already.
  if (stored.length > 0) await writeRoom(env.ROOMS, DELIVERIES_ROOM, 'latest', { ...delivery })
  return Response.json({ received: true }, { status: 202 })
}

export async function listDeliveries(db: Database): Promise<Delivery[]> {
  await migrate(db, migrations)
  return queryRows(
    db,
    \`SELECT id, event, summary, received_at AS receivedAt FROM webhook_deliveries
     ORDER BY received_at DESC LIMIT 50\`,
    [],
    parseDelivery,
  )
}

/** A signed test delivery, run through the same path GitHub's would take. */
export async function sendTestDelivery(
  origin: string,
  env: { DB: Database; ROOMS: RoomNamespace<unknown>; WEBHOOK_SECRET: string },
): Promise<{ status: number }> {
  const body = JSON.stringify({ zen: 'Keep it logically awesome.', hook_id: 1 })
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('')
  const response = await receiveGithub(
    new Request(new URL(GITHUB_WEBHOOK_PATH, origin), {
      method: 'POST',
      headers: {
        'x-github-event': 'ping',
        'x-github-delivery': crypto.randomUUID(),
        'x-hub-signature-256': \`sha256=\${hex}\`,
      },
      body,
    }),
    env,
  )
  return { status: response.status }
}
`
}

function cfWebhooksRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Kbd,
  Text,
  computed,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { parseDelivery } from '../webhooks'
import type { Delivery } from '../webhooks'

const client = createClient(api)
const stored = signal<Delivery[]>([])
const failure = signal<string | null>(null)

// The Worker writes each new delivery here; the browser may only watch.
const room = connectRoom('/api/webhooks/live')
const latest = room.signal<Delivery | null>('latest', null, (raw) =>
  raw === null ? null : parseDelivery(raw),
)
/** Stored deliveries, with the newest pushed one on top when it is not in the list yet. */
const deliveries = computed(() => {
  const pushed = latest.value
  return pushed && !stored.value.some((d) => d.id === pushed.id)
    ? [pushed, ...stored.value]
    : stored.value
})

async function load(): Promise<void> {
  stored.value = await client.listDeliveries().catch(() => stored.peek())
}
void load()

async function sendTest(): Promise<void> {
  failure.value = null
  try {
    await client.sendTestDelivery()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'The test delivery failed'
  }
}

export default function Webhooks() {
  useSignals()
  const url = \`\${location.origin}/api/webhooks/github\`

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Webhooks</Heading>
        <Text muted>
          GitHub deliveries, checked against their signature, stored once each, and shown here as
          they arrive.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={2}>
            <Text>
              In the repository's settings, add a webhook with the payload URL <Kbd>{url}</Kbd>,
              content type application/json, and the secret you set as WEBHOOK_SECRET.
            </Text>
            <Flex direction="horizontal">
              <Button variant="secondary" onClick={() => void sendTest()}>
                Send a test delivery
              </Button>
            </Flex>
            {failure.value ? (
              <Alert variant="destructive" title="Not delivered">
                {failure.value}
              </Alert>
            ) : null}
          </Flex>
        </CardContent>
      </Card>
      {deliveries.value.length === 0 ? (
        <EmptyState
          title="No deliveries yet"
          description="Send a test delivery, or push to the repository."
        />
      ) : (
        <Flex gap={2} role="log" aria-label="Deliveries">
          {deliveries.value.map((delivery) => (
            <Flex key={delivery.id} direction="horizontal" align="center" gap={2} wrap>
              <Badge variant="secondary">{delivery.event}</Badge>
              <Text>{delivery.summary}</Text>
              <Text size="sm" muted>
                {new Date(delivery.receivedAt).toLocaleTimeString()}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
`
}

/* --- `--example checkout`: Stripe Checkout, its webhook, an order pushed live, a receipt --- */

function cfCheckoutTs(opts: ScaffoldOptions): string {
  return `/**
 * What /checkout sells and the orders it makes, shared by the Worker (which creates them and
 * hears from Stripe) and the pages (which show them).
 */

/** The seller, as the receipt names it. */
export const SHOP_NAME = '${brandName(opts.name).replace(/'/g, "\\'")}'

/**
 * What you sell. The Worker sends this to Stripe, so a browser cannot change the price; the
 * page only displays it.
 */
export const PRODUCT = {
  name: 'Sticker pack',
  description: 'Twelve vinyl stickers of your favourite components, shipped worldwide.',
  /** In the currency's smallest unit: 900 is €9.00. */
  amount: 900,
  /** Three-letter ISO code, lowercase. */
  currency: 'eur',
}

/** \`pending\` until Stripe confirms the payment; the other three are final. */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface Order {
  id: string
  status: OrderStatus
  /** What Stripe charged, in the currency's smallest unit. */
  amount: number
  currency: string
  createdAt: string
  paidAt: string | null
}

/** An order id: a UUID the Worker made. */
export const ORDER_ID = /^[0-9a-f-]{36}$/

/** The room the Worker pushes an order's changes to; its page watches it. */
export const orderRoom = (id: string) => \`order-\${id}\`

/** A price in the currency's smallest unit, for people: 900 eur is €9.00, 900 jpy is ¥900. */
export function formatPrice(amount: number, currency: string): string {
  const format = new Intl.NumberFormat(undefined, { style: 'currency', currency })
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2
  return format.format(amount / 10 ** digits)
}

const STATUSES = ['pending', 'paid', 'failed', 'expired']

export function parseOrder(raw: unknown): Order {
  if (typeof raw === 'object' && raw !== null) {
    const { id, status, amount, currency, createdAt, paidAt } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof status === 'string' &&
      STATUSES.includes(status) &&
      typeof amount === 'number' &&
      typeof currency === 'string' &&
      typeof createdAt === 'string' &&
      (paidAt === null || typeof paidAt === 'string')
    ) {
      // Checked against STATUSES just above.
      return { id, status: status as OrderStatus, amount, currency, createdAt, paidAt }
    }
  }
  throw new Error('Malformed order')
}

export function parseCheckoutStarted(raw: unknown): { url: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { url } = raw as Record<string, unknown>
    if (typeof url === 'string' && url.startsWith('https://')) return { url }
  }
  throw new Error('Malformed checkout')
}
`
}

function cfCheckoutWorkerTs(): string {
  return `import { HttpError } from '@cascivo/app/api'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { verifyWebhook } from '@cascivo/app/guard'
import { StripeError, createStripe, parseStripeEvent } from '@cascivo/app/stripe'
import type { CheckoutEventType, CheckoutSession, Stripe } from '@cascivo/app/stripe'
import { writeRoom } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { Receipt, receiptSubject, renderEmail } from '@cascivo/email'
import { createElement } from 'react'
import { ORDER_ID, PRODUCT, SHOP_NAME, formatPrice, orderRoom, parseOrder } from '../src/checkout'
import type { Order, OrderStatus } from '../src/checkout'

const migrations = [
  {
    id: '0001_orders',
    statements: [
      \`CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL,
        paid_at TEXT
      )\`,
    ],
  },
]

/** Where Stripe posts; add it as an endpoint in the Stripe dashboard (README). */
export const STRIPE_WEBHOOK_PATH = '/api/stripe/webhook'

/** What sending a receipt needs of the Email Service binding (\`send_email\`). */
export interface ReceiptSender {
  send(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<unknown>
}

export interface CheckoutEnv {
  DB: Database
  ROOMS: RoomNamespace<unknown>
  EMAIL: ReceiptSender
  RECEIPT_FROM: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

const COLUMNS = 'id, status, amount, currency, created_at AS createdAt, paid_at AS paidAt'

export function stripeOf(env: { STRIPE_SECRET_KEY?: string }): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(
      503,
      'Set STRIPE_SECRET_KEY to a test key from the Stripe dashboard (README)',
    )
  }
  return createStripe(env.STRIPE_SECRET_KEY)
}

/** Stripe's refusal, for the page: its message in vite dev, a pointer to the log deployed. */
export function refused(error: unknown): never {
  if (!(error instanceof StripeError)) throw error
  console.error('[checkout] Stripe refused:', error.status, error.code, error.message)
  throw new HttpError(
    502,
    import.meta.env.DEV
      ? \`Stripe: \${error.message}\`
      : 'The payment provider refused the request (see the Worker log)',
  )
}

/**
 * Creates a Stripe Checkout Session for PRODUCT and records the order as pending. The order id
 * is also the idempotency key, so a retried request cannot open a second session.
 */
export async function startCheckout(env: CheckoutEnv, origin: string): Promise<{ url: string }> {
  const stripe = stripeOf(env)
  const id = crypto.randomUUID()
  let session: CheckoutSession
  try {
    session = await stripe.createCheckoutSession(
      {
        mode: 'payment',
        lineItems: [{ ...PRODUCT, quantity: 1 }],
        successUrl: \`\${origin}/checkout/\${id}\`,
        cancelUrl: \`\${origin}/checkout\`,
        clientReferenceId: id,
      },
      { idempotencyKey: id },
    )
  } catch (error) {
    refused(error)
  }
  if (!session.url) throw new HttpError(502, 'Stripe returned no checkout page')
  await migrate(env.DB, migrations)
  await queryRows(
    env.DB,
    \`INSERT INTO orders (id, session_id, status, amount, currency, created_at)
     VALUES (?, ?, 'pending', ?, ?, ?)\`,
    [id, session.id, PRODUCT.amount, PRODUCT.currency, new Date().toISOString()],
    (row) => row,
  )
  return { url: session.url }
}

/** Where an event moves the order, or \`null\` when it does not move it. */
function statusAfter(type: CheckoutEventType, session: CheckoutSession): OrderStatus | null {
  switch (type) {
    case 'checkout.session.completed':
      // \`unpaid\` here is a bank debit that has not settled: the async events decide it.
      return session.paymentStatus === 'unpaid' ? null : 'paid'
    case 'checkout.session.async_payment_succeeded':
      return 'paid'
    case 'checkout.session.async_payment_failed':
      return 'failed'
    case 'checkout.session.expired':
      return 'expired'
  }
}

/** The same decision from a session read back from Stripe, with no event to go by. */
function statusOf(session: CheckoutSession): OrderStatus | null {
  if (session.status === 'complete' && session.paymentStatus !== 'unpaid') return 'paid'
  return session.status === 'expired' ? 'expired' : null
}

/**
 * Moves a pending order to its final status, once: a retried event, or the order page reading
 * the session before the webhook arrived, finds it settled and changes nothing. The order is
 * found by Stripe's session id, never by \`client_reference_id\`, which a buyer can set on a
 * Payment Link. Then the order's page hears about it, and a paid order gets its receipt.
 */
async function settle(
  env: CheckoutEnv,
  session: CheckoutSession,
  status: OrderStatus,
  origin: string,
): Promise<void> {
  await migrate(env.DB, migrations)
  const [order] = await queryRows(
    env.DB,
    \`UPDATE orders SET status = ?, paid_at = ?, amount = COALESCE(?, amount),
       currency = COALESCE(?, currency), email = ?
     WHERE session_id = ? AND status = 'pending' RETURNING \${COLUMNS}\`,
    [
      status,
      status === 'paid' ? new Date().toISOString() : null,
      session.amountTotal,
      session.currency,
      session.customerEmail,
      session.id,
    ],
    parseOrder,
  )
  if (!order) return
  await writeRoom(env.ROOMS, orderRoom(order.id), 'order', { ...order })
  if (order.status === 'paid' && session.customerEmail) {
    await sendReceipt(env, order, session.customerEmail, origin)
  }
}

/**
 * Emails a receipt rendered with @cascivo/email. \`vite dev\` renders it and logs it instead.
 * A receipt that cannot be sent is logged, not thrown: the payment is recorded either way, and
 * Stripe retrying the event would not send it again.
 */
async function sendReceipt(env: CheckoutEnv, order: Order, to: string, origin: string) {
  const total = formatPrice(order.amount, order.currency)
  const props = {
    productName: SHOP_NAME,
    orderId: order.id.slice(0, 8).toUpperCase(),
    items: [{ description: PRODUCT.name, amount: total }],
    total,
    invoiceHref: \`\${origin}/checkout/\${order.id}\`,
  }
  const message = renderEmail(createElement(Receipt, props), { subject: receiptSubject(props) })
  if (import.meta.env.DEV) {
    console.log(\`[checkout] receipt for \${to}: "\${message.subject}" (\${message.html.length} bytes)\`)
    return
  }
  if (!env.RECEIPT_FROM) {
    console.warn('[checkout] no receipt sent: set RECEIPT_FROM in wrangler.jsonc')
    return
  }
  try {
    await env.EMAIL.send({
      from: env.RECEIPT_FROM,
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
  } catch (error) {
    console.error('[checkout] receipt not sent:', error)
  }
}

/**
 * Stripe's webhook: verified against STRIPE_WEBHOOK_SECRET before anything in it is read,
 * then each Checkout event settles its order. Subscription events, and completed subscription
 * checkouts, go to \`onSubscription\` when the app bills subscriptions (worker/billing.ts).
 * Other events are acknowledged, so Stripe stops sending them.
 */
export async function receiveStripe(
  request: Request,
  env: CheckoutEnv,
  onSubscription?: (subscriptionId: string) => Promise<void>,
): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new HttpError(503, 'Set STRIPE_WEBHOOK_SECRET (README)')
  const { body } = await verifyWebhook(request, {
    scheme: 'stripe',
    secret: env.STRIPE_WEBHOOK_SECRET,
  })
  const event = parseStripeEvent(body)
  if (event.kind === 'subscription') await onSubscription?.(event.subscription.id)
  if (event.kind === 'checkout' && event.session.mode === 'subscription') {
    if (event.session.subscriptionId) await onSubscription?.(event.session.subscriptionId)
  } else if (event.kind === 'checkout') {
    const status = statusAfter(event.type, event.session)
    if (status) await settle(env, event.session, status, new URL(request.url).origin)
  }
  return Response.json({ received: true })
}

function parseStored(raw: unknown): { order: Order; sessionId: string } {
  const sessionId = typeof raw === 'object' && raw !== null ? Reflect.get(raw, 'sessionId') : null
  if (typeof sessionId !== 'string') throw new Error('Malformed order row')
  return { order: parseOrder(raw), sessionId }
}

async function readOrder(env: CheckoutEnv, id: string) {
  await migrate(env.DB, migrations)
  const [row] = await queryRows(
    env.DB,
    \`SELECT \${COLUMNS}, session_id AS sessionId FROM orders WHERE id = ?\`,
    [id],
    parseStored,
  )
  if (!row) throw new HttpError(404, 'No such order')
  return row
}

/**
 * An order, for its page. A pending one is checked with Stripe first, so the page is right
 * even when the webhook is late or not set up yet (as in \`vite dev\` without \`stripe listen\`).
 */
export async function getOrder(env: CheckoutEnv, id: string, origin: string): Promise<Order> {
  if (!ORDER_ID.test(id)) throw new HttpError(404, 'No such order')
  const { order, sessionId } = await readOrder(env, id)
  if (order.status !== 'pending' || !env.STRIPE_SECRET_KEY) return order
  try {
    const session = await stripeOf(env).retrieveCheckoutSession(sessionId)
    const status = statusOf(session)
    if (!status) return order
    await settle(env, session, status, origin)
  } catch (error) {
    // Stripe unreachable: show what is known; the webhook settles the order later.
    console.error('[checkout] could not read the session back:', error)
    return order
  }
  return (await readOrder(env, id)).order
}
`
}

function cfCheckoutRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { PRODUCT, formatPrice } from '../checkout'

const client = createClient(api)
const starting = signal(false)
const failure = signal<string | null>(null)

/** Asks the Worker for a Stripe Checkout page and goes there: Stripe takes the card, not us. */
async function buy(): Promise<void> {
  starting.value = true
  failure.value = null
  try {
    const { url } = await client.startCheckout()
    location.assign(url)
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not start the checkout'
    starting.value = false
  }
}

export default function Checkout() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Checkout</Heading>
        <Text muted>
          Paid on Stripe's hosted page. Stripe tells the Worker when the payment succeeds; the
          Worker records the order, updates its page and emails a receipt.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={3}>
            <Flex gap={1}>
              <Heading level={2}>{PRODUCT.name}</Heading>
              <Text muted>{PRODUCT.description}</Text>
            </Flex>
            <Text size="lg">{formatPrice(PRODUCT.amount, PRODUCT.currency)}</Text>
            <Flex direction="horizontal">
              <Button loading={starting.value} onClick={() => void buy()}>
                Buy now
              </Button>
            </Flex>
          </Flex>
        </CardContent>
      </Card>
      {failure.value ? (
        <Alert variant="destructive" title="The checkout did not start">
          {failure.value}
        </Alert>
      ) : null}
      <Text size="sm" muted>
        In test mode, pay with the card 4242 4242 4242 4242, any future date and any CVC.
      </Text>
    </Flex>
  )
}
`
}

function cfOrderRouteTsx(): string {
  return `import type { RouteProps } from '@cascivo/app'
import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import {
  Alert,
  Badge,
  EmptyState,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  signal,
  useEffectPropSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../../api'
import { PRODUCT, formatPrice, parseOrder } from '../../checkout'
import type { Order } from '../../checkout'

const client = createClient(api)
/** Orders seen, by id; \`null\` when the id has none. */
const orders = signal<Readonly<Record<string, Order | null>>>({})

/** Keeps the newest word on an order: a final status is never replaced by \`pending\`. */
function remember(id: string, order: Order | null): void {
  const known = orders.peek()[id]
  if (known && known.status !== 'pending' && order?.status === 'pending') return
  orders.value = { ...orders.peek(), [id]: order }
}

async function load(id: string): Promise<void> {
  try {
    remember(id, await client.getOrder({ params: { id } }))
  } catch {
    remember(id, null)
  }
}

/** Watches the order's room, where the Worker pushes what Stripe reports. Returns the cleanup. */
function watch(id: string): () => void {
  const room = connectRoom(\`/api/orders/\${id}/live\`)
  const pushed = room.signal<Order | null>('order', null, (raw) =>
    raw === null ? null : parseOrder(raw),
  )
  const stop = pushed.signal.subscribe((order) => {
    if (order) remember(id, order)
  })
  return () => {
    stop()
    room.close()
  }
}

const STATUS = {
  pending: { variant: 'warning', label: 'Waiting for Stripe' },
  paid: { variant: 'success', label: 'Paid' },
  failed: { variant: 'destructive', label: 'Payment failed' },
  expired: { variant: 'secondary', label: 'Expired' },
} as const

/** \`/checkout/:order\` — where Stripe sends the buyer back. It updates when Stripe confirms. */
export default function OrderPage({ params }: RouteProps<'/checkout/:order'>) {
  useSignals()
  const id = useEffectPropSignal(params.order)
  useSignalEffect(() => {
    void load(id.value)
    return watch(id.value)
  })
  const order = orders.value[params.order]

  if (order === undefined) return <Spinner label="Loading" />
  if (order === null) {
    return <EmptyState title="No such order" description="Check the link in your receipt." />
  }
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Your order</Heading>
        <Text muted>
          {PRODUCT.name} · {formatPrice(order.amount, order.currency)}
        </Text>
      </Flex>
      <Flex direction="horizontal" align="center" gap={2} wrap>
        <Badge variant={STATUS[order.status].variant}>{STATUS[order.status].label}</Badge>
        <Text size="sm" muted>
          Ordered {new Date(order.createdAt).toLocaleString()}
        </Text>
      </Flex>
      {order.status === 'pending' ? (
        <Alert variant="info" title="Confirming your payment">
          This page updates by itself when Stripe confirms. A bank payment can take a few days.
        </Alert>
      ) : null}
      {order.status === 'paid' ? (
        <Alert variant="success" title="Thank you">
          Your payment went through. A receipt is on its way to your inbox.
        </Alert>
      ) : null}
      {order.status === 'failed' ? (
        <Alert variant="destructive" title="The payment failed">
          Nothing was charged. <Link href="/checkout">Try again</Link>
        </Alert>
      ) : null}
      {order.status === 'expired' ? (
        <Alert variant="warning" title="This checkout expired">
          It was not paid in time. <Link href="/checkout">Start again</Link>
        </Alert>
      ) : null}
    </Flex>
  )
}
`
}

/* --- `--example newsletter`: double opt-in, sent through Amazon SES on a Queue --- */

function cfNewsletterTs(): string {
  return `/**
 * The newsletter's wire types, shared by the Worker (worker/newsletter.ts) and its pages.
 * Every payload is parsed on arrival: the network is not trusted because the types match.
 */

/** Longest subject and body the composer accepts. */
export const MAX_SUBJECT = 200
export const MAX_BODY = 50_000

export interface SubscriberCounts {
  /** Signed up, has not clicked the confirmation link yet. */
  pending: number
  subscribed: number
  unsubscribed: number
  /** Bounced for good or complained: never mailed again (worker/newsletter.ts). */
  suppressed: number
}

/** One sent issue and how far its sending has got. */
export interface Issue {
  id: string
  subject: string
  createdAt: string
  /** Subscribers it was queued for. */
  total: number
  sent: number
  failed: number
}

export interface Overview {
  subscribers: SubscriberCounts
  issues: Issue[]
}

/** The room the Worker pushes an issue's progress to; the composer watches it. */
export const issueRoom = (id: string) => \`issue-\${id}\`

/** An issue id: a UUID the Worker made. */
export const ISSUE_ID = /^[0-9a-f-]{36}$/

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === 'object' && raw !== null

function text(raw: Record<string, unknown>, key: string, max: number): string {
  const value = raw[key]
  if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
    throw new Error(\`Expected \${key}: some text, at most \${max} characters\`)
  }
  return value
}

export function parseEmailInput(raw: unknown): { email: string } {
  if (!isRecord(raw)) throw new Error('Expected { email }')
  return { email: text(raw, 'email', 254) }
}

export function parseTokenInput(raw: unknown): { token: string } {
  if (!isRecord(raw)) throw new Error('Expected { token }')
  return { token: text(raw, 'token', 100) }
}

/** The composer's key: NEWSLETTER_KEY, which only the sender knows. */
export function parseKeyInput(raw: unknown): { key: string } {
  if (!isRecord(raw)) throw new Error('Expected { key }')
  return { key: text(raw, 'key', 200) }
}

export interface IssueInput {
  key: string
  subject: string
  /** The body in Markdown, rendered by @cascivo/email's Markdown. */
  body: string
}

export function parseIssueInput(raw: unknown): IssueInput {
  if (!isRecord(raw)) throw new Error('Expected { key, subject, body }')
  return {
    key: text(raw, 'key', 200),
    subject: text(raw, 'subject', MAX_SUBJECT),
    body: text(raw, 'body', MAX_BODY),
  }
}

export function parseSubscribed(raw: unknown): { devLink: string | null } {
  if (isRecord(raw) && (raw['devLink'] === null || typeof raw['devLink'] === 'string')) {
    return { devLink: raw['devLink'] }
  }
  throw new Error('Malformed reply')
}

export function parseConfirmed(raw: unknown): { email: string } {
  if (isRecord(raw) && typeof raw['email'] === 'string') return { email: raw['email'] }
  throw new Error('Malformed reply')
}

export function parsePreview(raw: unknown): { html: string; bytes: number } {
  if (isRecord(raw) && typeof raw['html'] === 'string' && typeof raw['bytes'] === 'number') {
    return { html: raw['html'], bytes: raw['bytes'] }
  }
  throw new Error('Malformed preview')
}

const count = (raw: Record<string, unknown>, key: string): number => {
  const value = raw[key]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(\`Expected a count for \${key}\`)
  }
  return value
}

export function parseIssue(raw: unknown): Issue {
  if (isRecord(raw) && typeof raw['id'] === 'string' && typeof raw['createdAt'] === 'string') {
    return {
      id: raw['id'],
      subject: text(raw, 'subject', MAX_SUBJECT),
      createdAt: raw['createdAt'],
      total: count(raw, 'total'),
      sent: count(raw, 'sent'),
      failed: count(raw, 'failed'),
    }
  }
  throw new Error('Malformed issue')
}

export function parseOverview(raw: unknown): Overview {
  if (isRecord(raw) && isRecord(raw['subscribers']) && Array.isArray(raw['issues'])) {
    const s = raw['subscribers']
    return {
      subscribers: {
        pending: count(s, 'pending'),
        subscribed: count(s, 'subscribed'),
        unsubscribed: count(s, 'unsubscribed'),
        suppressed: count(s, 'suppressed'),
      },
      issues: raw['issues'].map(parseIssue),
    }
  }
  throw new Error('Malformed overview')
}
`
}

function cfNewsletterEmailTs(opts: ScaffoldOptions): string {
  return `import {
  Body,
  Button,
  Container,
  Footer,
  Head,
  Heading,
  Html,
  Link,
  Markdown,
  Preview,
  Section,
  Text,
  renderEmail,
} from '@cascivo/email'
import type { RenderResult } from '@cascivo/email'
import { createElement as h } from 'react'

/** Who the newsletter is from, as its emails say. */
export const NEWSLETTER_NAME = '${brandName(opts.name).replace(/'/g, "\\'")}'

/** Stands in for each reader's unsubscribe token; worker/newsletter.ts swaps it per message. */
export const TOKEN_SLOT = '__UNSUBSCRIBE_TOKEN__'

/**
 * An issue, rendered once with @cascivo/email: the body is Markdown, drawn through the email
 * primitives (raw HTML in it stays literal text). The footer carries the unsubscribe link,
 * with TOKEN_SLOT where each reader's token goes.
 */
export function renderIssue(subject: string, body: string, origin: string): RenderResult {
  const unsubscribe = \`\${origin}/newsletter/unsubscribe?token=\${TOKEN_SLOT}\`
  return renderEmail(
    h(
      Html,
      null,
      h(Head, { title: subject }),
      h(
        Body,
        null,
        h(Preview, null, subject),
        h(
          Container,
          null,
          h(Section, { padding: 32 }, h(Heading, { level: 1 }, subject), h(Markdown, null, body)),
          h(
            Footer,
            null,
            \`You get this because you subscribed to \${NEWSLETTER_NAME}. \`,
            h(Link, { href: unsubscribe }, 'Unsubscribe'),
          ),
        ),
      ),
    ),
    { subject },
  )
}

/** The double opt-in email: nobody is mailed an issue until they open this link. */
export function renderConfirmation(confirmUrl: string): RenderResult {
  const subject = \`Confirm your subscription to \${NEWSLETTER_NAME}\`
  return renderEmail(
    h(
      Html,
      null,
      h(Head, { title: subject }),
      h(
        Body,
        null,
        h(Preview, null, 'One click and you are on the list.'),
        h(
          Container,
          null,
          h(
            Section,
            { padding: 32 },
            h(Heading, { level: 1 }, 'Confirm your subscription'),
            h(Text, null, \`Someone, hopefully you, asked to get \${NEWSLETTER_NAME} by email.\`),
            h(Button, { href: confirmUrl }, 'Yes, subscribe me'),
            h(
              Text,
              { variant: 'muted', size: '14px' },
              'The link works for 24 hours. If you did not ask, ignore this email: you will not hear from us again.',
            ),
          ),
        ),
      ),
    ),
    { subject },
  )
}
`
}

function cfNewsletterWorkerTs(): string {
  return `import { HttpError } from '@cascivo/app/api'
import { normalizeEmail } from '@cascivo/app/auth-server'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { SesError, createSes, handleSns, parseSesNotification } from '@cascivo/app/ses'
import { writeRoom } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { ISSUE_ID, issueRoom, parseIssue } from '../src/newsletter'
import type { Issue, IssueInput, Overview, SubscriberCounts } from '../src/newsletter'
import { TOKEN_SLOT, renderConfirmation, renderIssue } from './newsletter-email'

const migrations = [
  {
    id: '0001_newsletter',
    statements: [
      \`CREATE TABLE subscribers (
        email TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        confirm_hash TEXT,
        confirm_expires INTEGER,
        unsubscribe_token TEXT NOT NULL UNIQUE,
        reason TEXT,
        created_at TEXT NOT NULL,
        confirmed_at TEXT
      )\`,
      \`CREATE TABLE issues (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        total INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )\`,
      // One row per reader per issue, written as each send finishes: a retried queue message
      // skips whoever already has one, so nobody gets an issue twice.
      \`CREATE TABLE deliveries (
        issue_id TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL,
        detail TEXT,
        at TEXT NOT NULL,
        PRIMARY KEY (issue_id, email)
      )\`,
    ],
  },
]

/** Readers per queue message. Each message is sent in one go, one reader after another. */
const CHUNK = 25
/** A confirmation link works for a day. */
const CONFIRM_TTL_MS = 24 * 60 * 60 * 1000
/** A pending address gets another link at most this often, so the form cannot flood an inbox. */
const RESEND_AFTER_MS = 10 * 60 * 1000

export interface NewsletterMessage {
  issueId: string
  emails: string[]
  /** The app's origin, for the unsubscribe links: a queue consumer has no request. */
  origin: string
}

/** What sending needs of the NEWSLETTER queue binding. */
export interface NewsletterQueue {
  sendBatch(messages: Iterable<{ body: NewsletterMessage }>): Promise<void>
}

/** The slice of a Queue consumer's batch \`deliver\` reads. */
export interface NewsletterBatch {
  readonly messages: readonly { readonly body: unknown }[]
}

export interface NewsletterEnv {
  DB: Database
  ROOMS: RoomNamespace<unknown>
  NEWSLETTER: NewsletterQueue
  /** Set in wrangler.jsonc: the SES region, the From address, the SNS topic for feedback. */
  AWS_REGION: string
  NEWSLETTER_FROM: string
  SNS_TOPIC_ARN: string
  /** Secrets: \`wrangler secret put\` (.dev.vars locally). Unset until you add them. */
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  NEWSLETTER_KEY?: string
}

const encoder = new TextEncoder()

const cell = (raw: unknown, key: string): unknown =>
  typeof raw === 'object' && raw !== null ? Reflect.get(raw, key) : undefined

/** A string column of a D1 row. Rows are read like any payload: checked, not cast. */
function column(raw: unknown, key: string): string {
  const value = cell(raw, key)
  if (typeof value !== 'string') throw new Error(\`Expected a string in column \${key}\`)
  return value
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 32 random bytes, URL-safe: a confirmation or unsubscribe token. */
function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=+$/, '')
}

/** Refuses a request without NEWSLETTER_KEY. Compares digests, so timing says nothing. */
async function requireKey(env: NewsletterEnv, key: string): Promise<void> {
  if (!env.NEWSLETTER_KEY) throw new HttpError(503, 'Set NEWSLETTER_KEY (README)')
  if ((await sha256(key)) !== (await sha256(env.NEWSLETTER_KEY))) {
    throw new HttpError(403, 'Wrong newsletter key')
  }
}

interface Mail {
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

type Send = (to: string, mail: Mail) => Promise<'sent' | 'logged'>

/**
 * Sends one email through SES, or, in \`vite dev\` without AWS credentials, logs it instead.
 * Deployed without them, it refuses with what to set.
 */
function mailer(env: NewsletterEnv): Send {
  const configured =
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION && env.NEWSLETTER_FROM
  if (!configured) {
    if (!import.meta.env.DEV) {
      throw new HttpError(
        503,
        'Set AWS_REGION and NEWSLETTER_FROM in wrangler.jsonc, and the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY secrets (README)',
      )
    }
    return async (to, message) => {
      console.log(\`[newsletter] not sent (no SES credentials) to \${to}: "\${message.subject}"\`)
      return 'logged'
    }
  }
  const ses = createSes({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  })
  return async (to, message) => {
    await ses.sendEmail({ from: env.NEWSLETTER_FROM, to, ...message })
    return 'sent'
  }
}

/**
 * Signs someone up: a pending subscriber and a confirmation email. The answer is the same
 * whoever asks, so the form does not tell strangers who is on the list. \`vite dev\` without
 * SES also returns the confirmation link, to open instead of an email.
 */
export async function subscribe(
  env: NewsletterEnv,
  rawEmail: string,
  origin: string,
): Promise<{ devLink: string | null }> {
  const email = normalizeEmail(rawEmail)
  const send = mailer(env)
  await migrate(env.DB, migrations)
  const confirm = token()
  const now = new Date()
  const expires = now.getTime() + CONFIRM_TTL_MS
  // A new or unsubscribed address gets a link; a pending one gets a fresh link at most every
  // ten minutes. A subscribed or suppressed one is left alone, and nothing is sent.
  const [row] = await queryRows(
    env.DB,
    \`INSERT INTO subscribers
       (email, status, confirm_hash, confirm_expires, unsubscribe_token, created_at)
     VALUES (?, 'pending', ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       status = 'pending', reason = NULL,
       confirm_hash = excluded.confirm_hash, confirm_expires = excluded.confirm_expires
     WHERE subscribers.status = 'unsubscribed'
       OR (subscribers.status = 'pending' AND subscribers.confirm_expires < ?)
     RETURNING email\`,
    [email, await sha256(confirm), expires, token(), now.toISOString(), expires - RESEND_AFTER_MS],
    (raw) => column(raw, 'email'),
  )
  if (!row) return { devLink: null }
  const link = \`\${origin}/newsletter/confirm?token=\${confirm}\`
  const message = renderConfirmation(link)
  let outcome: 'sent' | 'logged'
  try {
    outcome = await send(email, {
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
  } catch (error) {
    if (!(error instanceof SesError)) throw error
    console.error('[newsletter] confirmation not sent:', error.code, error.message)
    // Let the reader try again at once rather than wait out the resend interval.
    await queryRows(
      env.DB,
      "UPDATE subscribers SET confirm_expires = 0 WHERE email = ? AND status = 'pending' RETURNING email",
      [email],
      (raw) => raw,
    )
    throw new HttpError(502, 'Could not send the confirmation email. Try again in a moment.')
  }
  return { devLink: outcome === 'logged' ? link : null }
}

/** Opens a confirmation link: the subscriber is on the list from now on. */
export async function confirm(env: NewsletterEnv, rawToken: string): Promise<{ email: string }> {
  await migrate(env.DB, migrations)
  const [row] = await queryRows(
    env.DB,
    \`UPDATE subscribers SET status = 'subscribed', confirm_hash = NULL, confirmed_at = ?
     WHERE confirm_hash = ? AND confirm_expires > ? AND status = 'pending' RETURNING email\`,
    [new Date().toISOString(), await sha256(rawToken), Date.now()],
    (raw) => ({ email: column(raw, 'email') }),
  )
  if (!row) throw new HttpError(400, 'This link has expired or was used already. Sign up again.')
  return row
}

/**
 * \`POST /api/newsletter/unsubscribe?token=…\`: the page's button, and the one-click
 * unsubscribe mail clients send (RFC 8058) from the List-Unsubscribe header. Always 200, so a
 * token says nothing about who it belongs to, and a second click is not an error.
 */
export async function unsubscribe(request: Request, env: NewsletterEnv): Promise<Response> {
  const unsubscribeToken = new URL(request.url).searchParams.get('token') ?? ''
  await migrate(env.DB, migrations)
  await queryRows(
    env.DB,
    \`UPDATE subscribers SET status = 'unsubscribed', reason = 'unsubscribed'
     WHERE unsubscribe_token = ? AND status IN ('pending', 'subscribed') RETURNING email\`,
    [unsubscribeToken],
    (raw) => raw,
  )
  return Response.json({ unsubscribed: true })
}

const ISSUE_COLUMNS = \`issues.id, issues.subject, issues.created_at AS createdAt, issues.total,
  (SELECT COUNT(*) FROM deliveries d WHERE d.issue_id = issues.id AND d.status != 'failed') AS sent,
  (SELECT COUNT(*) FROM deliveries d WHERE d.issue_id = issues.id AND d.status = 'failed') AS failed\`

async function readIssue(db: Database, id: string): Promise<Issue> {
  const [issue] = await queryRows(
    db,
    \`SELECT \${ISSUE_COLUMNS} FROM issues WHERE id = ?\`,
    [id],
    parseIssue,
  )
  if (!issue) throw new HttpError(404, 'No such issue')
  return issue
}

/** Subscriber counts and the last 20 issues, for the composer. */
export async function overview(env: NewsletterEnv, key: string): Promise<Overview> {
  await requireKey(env, key)
  await migrate(env.DB, migrations)
  const subscribers: SubscriberCounts = {
    pending: 0,
    subscribed: 0,
    unsubscribed: 0,
    suppressed: 0,
  }
  const counts = await queryRows(
    env.DB,
    'SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status',
    [],
    (raw) => ({ status: column(raw, 'status'), n: Number(cell(raw, 'n')) }),
  )
  for (const { status, n } of counts) {
    if (status === 'pending' || status === 'subscribed') subscribers[status] = n
    if (status === 'unsubscribed' || status === 'suppressed') subscribers[status] = n
  }
  const issues = await queryRows(
    env.DB,
    \`SELECT \${ISSUE_COLUMNS} FROM issues ORDER BY created_at DESC LIMIT 20\`,
    [],
    parseIssue,
  )
  return { subscribers, issues }
}

/** The issue as readers will get it, for the composer's preview. */
export async function preview(
  env: NewsletterEnv,
  input: IssueInput,
  origin: string,
): Promise<{ html: string; bytes: number }> {
  await requireKey(env, input.key)
  const { html, stats } = renderIssue(input.subject, input.body, origin)
  return { html, bytes: stats.bytes }
}

/**
 * Sends an issue to every confirmed subscriber: the issue is stored, and its readers go onto
 * the NEWSLETTER queue in chunks, which \`deliver\` sends at the queue's pace.
 */
export async function sendIssue(
  env: NewsletterEnv,
  input: IssueInput,
  origin: string,
): Promise<Issue> {
  await requireKey(env, input.key)
  mailer(env) // Deployed without SES, refuse now rather than fail in the queue.
  await migrate(env.DB, migrations)
  const readers = await queryRows(
    env.DB,
    "SELECT email FROM subscribers WHERE status = 'subscribed' ORDER BY email",
    [],
    (raw) => column(raw, 'email'),
  )
  const id = crypto.randomUUID()
  await queryRows(
    env.DB,
    'INSERT INTO issues (id, subject, body, total, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [id, input.subject, input.body, readers.length, new Date().toISOString()],
    (raw) => raw,
  )
  const messages: { body: NewsletterMessage }[] = []
  for (let i = 0; i < readers.length; i += CHUNK) {
    messages.push({ body: { issueId: id, emails: readers.slice(i, i + CHUNK), origin } })
  }
  // sendBatch takes at most 100 messages a call.
  for (let i = 0; i < messages.length; i += 100) {
    await env.NEWSLETTER.sendBatch(messages.slice(i, i + 100))
  }
  const issue = await readIssue(env.DB, id)
  await writeRoom(env.ROOMS, issueRoom(id), 'issue', { ...issue })
  return issue
}

function parseMessage(raw: unknown): NewsletterMessage {
  if (typeof raw === 'object' && raw !== null) {
    const { issueId, emails, origin } = raw as Record<string, unknown>
    if (
      typeof issueId === 'string' &&
      ISSUE_ID.test(issueId) &&
      Array.isArray(emails) &&
      emails.every((e) => typeof e === 'string') &&
      typeof origin === 'string'
    ) {
      return { issueId, emails: emails as string[], origin }
    }
  }
  throw new Error('Malformed newsletter message')
}

/**
 * The NEWSLETTER queue's consumer: sends each reader in the message their copy, with their
 * own unsubscribe link and the one-click headers bulk senders need. A reader who left or was
 * suppressed since the issue was queued is skipped. SES throttling or a server error throws,
 * and the queue retries the message: whoever was sent already has a delivery row and is not
 * sent again. A refusal for one address (an invalid one, say) is recorded and the rest go on.
 */
export async function deliver(env: NewsletterEnv, batch: NewsletterBatch): Promise<void> {
  await migrate(env.DB, migrations)
  const send = mailer(env)
  for (const { body } of batch.messages) {
    const { issueId, emails, origin } = parseMessage(body)
    const [issue] = await queryRows(
      env.DB,
      'SELECT subject, body FROM issues WHERE id = ?',
      [issueId],
      (raw) => ({ subject: column(raw, 'subject'), body: column(raw, 'body') }),
    )
    if (!issue) continue
    const rendered = renderIssue(issue.subject, issue.body, origin)
    const placeholders = emails.map(() => '?').join(', ')
    const readers = await queryRows(
      env.DB,
      \`SELECT s.email, s.unsubscribe_token AS token FROM subscribers s
       WHERE s.email IN (\${placeholders}) AND s.status = 'subscribed'
         AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.issue_id = ? AND d.email = s.email)\`,
      [...emails, issueId],
      (raw) => ({ email: column(raw, 'email'), token: column(raw, 'token') }),
    )
    for (const { email, token: readerToken } of readers) {
      const unsubscribe = \`\${origin}/api/newsletter/unsubscribe?token=\${readerToken}\`
      let status: string
      let detail: string | null = null
      try {
        status = await send(email, {
          subject: rendered.subject,
          html: rendered.html.replaceAll(TOKEN_SLOT, readerToken),
          text: rendered.text.replaceAll(TOKEN_SLOT, readerToken),
          headers: {
            'List-Unsubscribe': \`<\${unsubscribe}>\`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
      } catch (error) {
        if (!(error instanceof SesError) || error.retryable) throw error
        status = 'failed'
        detail = \`\${error.code ?? error.status}: \${error.message}\`.slice(0, 300)
      }
      await queryRows(
        env.DB,
        \`INSERT INTO deliveries (issue_id, email, status, detail, at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING RETURNING email\`,
        [issueId, email, status, detail, new Date().toISOString()],
        (raw) => raw,
      )
    }
    const progress = await readIssue(env.DB, issueId)
    await writeRoom(env.ROOMS, issueRoom(issueId), 'issue', { ...progress })
  }
}

/**
 * SES's feedback, delivered by SNS: a permanent bounce or a complaint suppresses the address
 * for good. Sending to them again is what gets an SES account put under review.
 */
export async function receiveFeedback(request: Request, env: NewsletterEnv): Promise<Response> {
  if (!env.SNS_TOPIC_ARN) throw new HttpError(503, 'Set SNS_TOPIC_ARN in wrangler.jsonc (README)')
  return handleSns(request, {
    topicArn: env.SNS_TOPIC_ARN,
    onNotification: async ({ message }) => {
      const event = parseSesNotification(message)
      const suppress =
        event.kind === 'complaint' || (event.kind === 'bounce' && event.bounceType === 'Permanent')
      if (!suppress || event.recipients.length === 0) return
      await migrate(env.DB, migrations)
      // D1 binds at most 100 parameters; one bounce rarely names more than a few addresses.
      const recipients = event.recipients
        .slice(0, 90)
        .map((address) => address.trim().toLowerCase())
      await queryRows(
        env.DB,
        \`UPDATE subscribers SET status = 'suppressed', reason = ?
         WHERE email IN (\${recipients.map(() => '?').join(', ')}) RETURNING email\`,
        [event.kind, ...recipients],
        (raw) => raw,
      )
    },
  })
}
`
}

function cfNewsletterRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Input,
  Link,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import type { FormEvent } from 'react'
import { api } from '../api'

const client = createClient(api)
const sentTo = signal<string | null>(null)
/** Set only in \`vite dev\` without SES: the confirmation link, to open instead of an email. */
const devLink = signal<string | null>(null)
const failure = signal<string | null>(null)
const sending = signal(false)

async function signUp(event: FormEvent<HTMLFormElement>): Promise<void> {
  event.preventDefault()
  const email = new FormData(event.currentTarget).get('email')
  if (typeof email !== 'string') return
  failure.value = null
  sending.value = true
  try {
    const { devLink: link } = await client.subscribe({ body: { email } })
    sentTo.value = email
    devLink.value = link
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not sign you up'
  } finally {
    sending.value = false
  }
}

export default function Newsletter() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Newsletter</Heading>
        <Text muted>
          An email now and then. We send a link first: you are on the list only once you open it,
          and every issue has a one-click unsubscribe.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <form onSubmit={(event) => void signUp(event)}>
            <Flex direction="horizontal" align="end" gap={2} wrap>
              <Input name="email" type="email" label="Email" autoComplete="email" required />
              <Button type="submit" loading={sending.value}>
                Subscribe
              </Button>
            </Flex>
          </form>
        </CardContent>
      </Card>
      {sentTo.value ? (
        <Alert variant="success" title="Check your inbox">
          If {sentTo.value} is not on the list yet, a confirmation link is on its way.
        </Alert>
      ) : null}
      {devLink.value ? (
        <Alert variant="info" title="vite dev sends no email without SES">
          <Link href={devLink.value}>Open the confirmation link</Link>
        </Alert>
      ) : null}
      {failure.value ? (
        <Alert variant="destructive" title="Not signed up">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}
`
}

function cfNewsletterConfirmRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import { Alert, Button, Flex, Heading, Text, signal, useSignals } from '@cascivo/react'
import { api } from '../../api'
import { router } from '../../router'

const client = createClient(api)
const confirmed = signal<string | null>(null)
const failure = signal<string | null>(null)
const busy = signal(false)

/**
 * The page a confirmation link opens. It confirms only when you press the button: mail
 * scanners open every link in a message, and would otherwise subscribe whoever was typed in.
 */
async function confirm(): Promise<void> {
  const token = new URLSearchParams(router.search.value).get('token')
  if (!token) {
    failure.value = 'This link has no token. Sign up again.'
    return
  }
  busy.value = true
  failure.value = null
  try {
    confirmed.value = (await client.confirmSubscription({ body: { token } })).email
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not confirm'
  } finally {
    busy.value = false
  }
}

export default function ConfirmSubscription() {
  useSignals()
  return (
    <Flex gap={4}>
      <Heading level={1}>Confirm your subscription</Heading>
      {confirmed.value ? (
        <Alert variant="success" title="You are on the list">
          The next issue goes to {confirmed.value}.
        </Alert>
      ) : (
        <Flex gap={2}>
          <Text muted>One click and you get the newsletter.</Text>
          <Flex direction="horizontal">
            <Button loading={busy.value} onClick={() => void confirm()}>
              Yes, subscribe me
            </Button>
          </Flex>
        </Flex>
      )}
      {failure.value ? (
        <Alert variant="destructive" title="Not confirmed">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}
`
}

function cfNewsletterUnsubscribeRouteTsx(): string {
  return `import { Alert, Button, Flex, Heading, Text, signal, useSignals } from '@cascivo/react'
import { router } from '../../router'

const done = signal(false)
const failure = signal<string | null>(null)
const busy = signal(false)

/**
 * The footer link of every issue. Like the confirmation, it acts on a button press, never on
 * opening the page. Mail clients that support one-click unsubscribe skip this page and POST
 * to the same endpoint from the List-Unsubscribe header.
 */
async function unsubscribe(): Promise<void> {
  const token = new URLSearchParams(router.search.value).get('token') ?? ''
  busy.value = true
  failure.value = null
  try {
    const response = await fetch(\`/api/newsletter/unsubscribe?token=\${encodeURIComponent(token)}\`, {
      method: 'POST',
    })
    if (!response.ok) throw new Error(\`Request failed with status \${response.status}\`)
    done.value = true
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not unsubscribe'
  } finally {
    busy.value = false
  }
}

export default function Unsubscribe() {
  useSignals()
  return (
    <Flex gap={4}>
      <Heading level={1}>Unsubscribe</Heading>
      {done.value ? (
        <Alert variant="success" title="You are unsubscribed">
          You will get no more issues. Sign up again any time.
        </Alert>
      ) : (
        <Flex gap={2}>
          <Text muted>Stop getting the newsletter at this address.</Text>
          <Flex direction="horizontal">
            <Button variant="destructive" loading={busy.value} onClick={() => void unsubscribe()}>
              Unsubscribe
            </Button>
          </Flex>
        </Flex>
      )}
      {failure.value ? (
        <Alert variant="destructive" title="Not unsubscribed">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}
`
}

function cfNewsletterSendRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  signal,
  useSignals,
} from '@cascivo/react'
import type { MouseEvent } from 'react'
import { api } from '../../api'
import { MAX_BODY, MAX_SUBJECT, parseIssue } from '../../newsletter'
import type { Issue, Overview } from '../../newsletter'

const client = createClient(api)
const overview = signal<Overview | null>(null)
const previewHtml = signal<string | null>(null)
const busy = signal<'load' | 'preview' | 'send' | null>(null)
const failure = signal<string | null>(null)
const notice = signal<string | null>(null)

/** The composer's fields, read from the form the clicked button belongs to. */
function fields(event: MouseEvent<HTMLButtonElement>) {
  const form = event.currentTarget.form
  const data = form ? new FormData(form) : new FormData()
  const read = (name: string) => {
    const value = data.get(name)
    return typeof value === 'string' ? value : ''
  }
  return { key: read('key'), subject: read('subject'), body: read('body') }
}

async function run(kind: 'load' | 'preview' | 'send', task: () => Promise<void>): Promise<void> {
  busy.value = kind
  failure.value = null
  notice.value = null
  try {
    await task()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Something went wrong'
  } finally {
    busy.value = null
  }
}

/** Shows an issue's progress as the Worker pushes it, until every reader has had their copy. */
function watch(issue: Issue): void {
  const room = connectRoom(\`/api/newsletter/issues/\${issue.id}/live\`)
  const pushed = room.signal<Issue | null>('issue', null, (raw) =>
    raw === null ? null : parseIssue(raw),
  )
  const stop = pushed.signal.subscribe((latest) => {
    const current = overview.peek()
    if (!latest || !current) return
    overview.value = {
      ...current,
      issues: current.issues.map((i) => (i.id === latest.id ? latest : i)),
    }
    if (latest.sent + latest.failed >= latest.total) {
      stop()
      room.close()
    }
  })
}

function load(event: MouseEvent<HTMLButtonElement>): void {
  const { key } = fields(event)
  void run('load', async () => {
    overview.value = await client.newsletterOverview({ body: { key } })
  })
}

function preview(event: MouseEvent<HTMLButtonElement>): void {
  const input = fields(event)
  void run('preview', async () => {
    previewHtml.value = (await client.previewIssue({ body: input })).html
  })
}

function send(event: MouseEvent<HTMLButtonElement>): void {
  const input = fields(event)
  const readers = overview.value?.subscribers.subscribed ?? 0
  if (!window.confirm(\`Send "\${input.subject}" to \${readers} subscribers?\`)) return
  void run('send', async () => {
    const issue = await client.sendIssue({ body: input })
    overview.value = await client.newsletterOverview({ body: { key: input.key } })
    notice.value = \`Queued for \${issue.total} subscribers.\`
    watch(issue)
  })
}

export default function SendNewsletter() {
  useSignals()
  const counts = overview.value?.subscribers
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Send the newsletter</Heading>
        <Text muted>
          Written in Markdown, rendered with @cascivo/email, sent through Amazon SES to every
          confirmed subscriber. Only someone with NEWSLETTER_KEY can send.
        </Text>
      </Flex>
      <form onSubmit={(event) => event.preventDefault()}>
        <Flex gap={3}>
          <Flex direction="horizontal" align="end" gap={2} wrap>
            <Input name="key" type="password" label="Newsletter key" autoComplete="off" required />
            <Button variant="secondary" loading={busy.value === 'load'} onClick={load}>
              Show subscribers
            </Button>
          </Flex>
          <Input name="subject" label="Subject" maxLength={MAX_SUBJECT} required />
          <Textarea
            name="body"
            label="Body"
            hint="Markdown: headings, **bold**, links, lists, quotes and images."
            rows={12}
            maxLength={MAX_BODY}
            required
          />
          <Flex direction="horizontal" gap={2} wrap>
            <Button variant="secondary" loading={busy.value === 'preview'} onClick={preview}>
              Preview
            </Button>
            <Button loading={busy.value === 'send'} disabled={!counts} onClick={send}>
              Send to {counts ? counts.subscribed : '…'} subscribers
            </Button>
          </Flex>
        </Flex>
      </form>
      {failure.value ? (
        <Alert variant="destructive" title="Not done">
          {failure.value}
        </Alert>
      ) : null}
      {notice.value ? (
        <Alert variant="success" title="Sending">
          {notice.value}
        </Alert>
      ) : null}
      {previewHtml.value ? (
        <Card>
          <CardContent>
            {/* sandbox: the preview runs no script and cannot reach this page. */}
            <iframe
              title="Preview"
              sandbox=""
              srcDoc={previewHtml.value}
              width="100%"
              height="640"
            />
          </CardContent>
        </Card>
      ) : null}
      {counts ? (
        <Flex direction="horizontal" gap={2} wrap>
          <Badge variant="success">{counts.subscribed} subscribed</Badge>
          <Badge variant="warning">{counts.pending} not confirmed</Badge>
          <Badge variant="secondary">{counts.unsubscribed} unsubscribed</Badge>
          <Badge variant="destructive">{counts.suppressed} suppressed</Badge>
        </Flex>
      ) : null}
      {overview.value && overview.value.issues.length === 0 ? (
        <EmptyState title="No issues yet" description="Write one above and send it." />
      ) : null}
      {overview.value && overview.value.issues.length > 0 ? (
        <Flex gap={2} role="list" aria-label="Issues">
          {overview.value.issues.map((issue) => (
            <Flex key={issue.id} role="listitem" direction="horizontal" align="center" gap={2} wrap>
              <Badge variant={issue.sent + issue.failed >= issue.total ? 'success' : 'warning'}>
                {issue.sent}/{issue.total} sent
              </Badge>
              {issue.failed > 0 ? <Badge variant="destructive">{issue.failed} failed</Badge> : null}
              <Text>{issue.subject}</Text>
              <Text size="sm" muted>
                {new Date(issue.createdAt).toLocaleString()}
              </Text>
            </Flex>
          ))}
        </Flex>
      ) : null}
    </Flex>
  )
}
`
}

/* --- `--example checkout` with `--auth email`: a subscription plan and Stripe's portal --- */

function cfBillingTs(): string {
  return `/**
 * The subscription plan /billing sells, shared by the Worker (worker/billing.ts) and the page.
 * A subscription belongs to a signed-in user, so this exists only with --auth email.
 */

/** The plan. The Worker sends this to Stripe; the page only displays it. */
export const PLAN = {
  name: 'Pro',
  description: 'Everything in the app, billed monthly. Cancel any time from the billing portal.',
  /** In the currency's smallest unit, per interval: 900 is €9.00. */
  amount: 900,
  currency: 'eur',
  interval: 'month' as const,
}

/** \`none\` before the first subscription; otherwise Stripe's subscription status. */
export type BillingStatus =
  | 'none'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

const STATUSES: readonly BillingStatus[] = [
  'none',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]

export interface Billing {
  status: BillingStatus
  /** Whether the plan's features are on: the subscription is active or trialing. */
  active: boolean
  /** When the current period ends: the next charge, or the end of a cancelled plan. */
  currentPeriodEnd: string | null
  /** Cancelled, but running until currentPeriodEnd. */
  cancelAtPeriodEnd: boolean
  /** Has a Stripe customer, so the billing portal can open. */
  canManage: boolean
}

/** The statuses that unlock the plan. Check this in the Worker before serving a paid feature. */
export const isActive = (status: BillingStatus) => status === 'active' || status === 'trialing'

export function parseBilling(raw: unknown): Billing {
  if (typeof raw === 'object' && raw !== null) {
    const { status, active, currentPeriodEnd, cancelAtPeriodEnd, canManage } = raw as Record<
      string,
      unknown
    >
    const known = STATUSES.find((s) => s === status)
    if (
      known &&
      typeof active === 'boolean' &&
      (currentPeriodEnd === null || typeof currentPeriodEnd === 'string') &&
      typeof cancelAtPeriodEnd === 'boolean' &&
      typeof canManage === 'boolean'
    ) {
      return { status: known, active, currentPeriodEnd, cancelAtPeriodEnd, canManage }
    }
  }
  throw new Error('Malformed billing')
}

/** Where to send the browser next: Stripe's checkout or its billing portal. */
export function parseRedirect(raw: unknown): { url: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { url } = raw as Record<string, unknown>
    if (typeof url === 'string' && url.startsWith('https://')) return { url }
  }
  throw new Error('Malformed redirect')
}

export function parseSyncInput(raw: unknown): { sessionId: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { sessionId } = raw as Record<string, unknown>
    if (typeof sessionId === 'string' && /^cs_[\\w]{1,250}$/.test(sessionId)) return { sessionId }
  }
  throw new Error('Expected { sessionId }: a Checkout Session id')
}
`
}

function cfBillingWorkerTs(): string {
  return `import { HttpError } from '@cascivo/app/api'
import { requireUser } from '@cascivo/app/auth-server'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import type { Subscription } from '@cascivo/app/stripe'
import { PLAN, isActive, parseBilling } from '../src/billing'
import type { Billing } from '../src/billing'
import { refused, stripeOf } from './checkout'

const migrations = [
  {
    id: '0001_billing',
    statements: [
      \`CREATE TABLE billing (
        user_id TEXT PRIMARY KEY,
        customer_id TEXT,
        subscription_id TEXT,
        status TEXT NOT NULL,
        current_period_end INTEGER,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )\`,
    ],
  },
]

export interface BillingEnv {
  DB: Database
  STRIPE_SECRET_KEY?: string
}

interface Row {
  status: string
  customerId: string | null
  currentPeriodEnd: number | null
  cancelAtPeriodEnd: number
}

const cell = (raw: unknown, key: string): unknown =>
  typeof raw === 'object' && raw !== null ? Reflect.get(raw, key) : undefined

function parseRow(raw: unknown): Row {
  const status = cell(raw, 'status')
  const customerId = cell(raw, 'customerId')
  const end = cell(raw, 'currentPeriodEnd')
  if (typeof status !== 'string') throw new Error('Malformed billing row')
  return {
    status,
    customerId: typeof customerId === 'string' ? customerId : null,
    currentPeriodEnd: typeof end === 'number' ? end : null,
    cancelAtPeriodEnd: Number(cell(raw, 'cancelAtPeriodEnd')),
  }
}

async function readRow(db: Database, userId: string): Promise<Row | null> {
  await migrate(db, migrations)
  const [row] = await queryRows(
    db,
    \`SELECT status, customer_id AS customerId, current_period_end AS currentPeriodEnd,
       cancel_at_period_end AS cancelAtPeriodEnd FROM billing WHERE user_id = ?\`,
    [userId],
    parseRow,
  )
  return row ?? null
}

/** A stored row as the page sees it; the status is checked against the known ones. */
function toBilling(row: Row | null): Billing {
  const billing = parseBilling({
    status: row?.status ?? 'none',
    active: false,
    currentPeriodEnd:
      row?.currentPeriodEnd != null ? new Date(row.currentPeriodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd === 1,
    canManage: row?.customerId != null,
  })
  return { ...billing, active: isActive(billing.status) }
}

/**
 * Stores a subscription's current state for the user its metadata names. The metadata is set
 * by startSubscription, server side: a subscription made any other way (a Payment Link, the
 * dashboard) names no user here and is ignored. A different subscription replaces the stored
 * one only when that one is over, so a late event about an old plan cannot end a new one.
 */
async function store(db: Database, subscription: Subscription): Promise<void> {
  const userId = subscription.metadata['user']
  if (!userId) return
  await migrate(db, migrations)
  await queryRows(
    db,
    \`INSERT INTO billing
       (user_id, customer_id, subscription_id, status, current_period_end, cancel_at_period_end, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       customer_id = excluded.customer_id, subscription_id = excluded.subscription_id,
       status = excluded.status, current_period_end = excluded.current_period_end,
       cancel_at_period_end = excluded.cancel_at_period_end, updated_at = excluded.updated_at
     WHERE billing.subscription_id IS excluded.subscription_id
       OR billing.status NOT IN ('active', 'trialing', 'past_due')
     RETURNING user_id\`,
    [
      userId,
      subscription.customerId,
      subscription.id,
      subscription.status,
      subscription.currentPeriodEnd,
      subscription.cancelAtPeriodEnd ? 1 : 0,
      new Date().toISOString(),
    ],
    (raw) => raw,
  )
}

/**
 * The webhook's part (worker/checkout.ts passes subscription events here). The event's copy
 * may be stale, since events arrive out of order: the subscription is read back from Stripe.
 */
export async function syncSubscription(env: BillingEnv, subscriptionId: string): Promise<void> {
  await store(env.DB, await stripeOf(env).retrieveSubscription(subscriptionId))
}

/** The signed-in user's plan. */
export async function getBilling(env: BillingEnv, request: Request): Promise<Billing> {
  const user = await requireUser(env.DB, request)
  return toBilling(await readRow(env.DB, user.id))
}

/** Opens a subscription checkout for PLAN, naming the user in the subscription's metadata. */
export async function startSubscription(
  env: BillingEnv,
  request: Request,
  origin: string,
): Promise<{ url: string }> {
  const user = await requireUser(env.DB, request)
  const row = await readRow(env.DB, user.id)
  if (row && toBilling(row).active) {
    throw new HttpError(409, 'You already have the plan. Manage it in the billing portal.')
  }
  const stripe = stripeOf(env)
  try {
    const session = await stripe.createCheckoutSession({
      mode: 'subscription',
      lineItems: [{ ...PLAN, quantity: 1 }],
      // Stripe fills in {CHECKOUT_SESSION_ID}, so the page can sync before any webhook.
      successUrl: \`\${origin}/billing?session={CHECKOUT_SESSION_ID}\`,
      cancelUrl: \`\${origin}/billing\`,
      ...(row?.customerId ? { customer: row.customerId } : { customerEmail: user.email }),
      clientReferenceId: user.id,
      subscriptionMetadata: { user: user.id },
    })
    if (!session.url) throw new HttpError(502, 'Stripe returned no checkout page')
    return { url: session.url }
  } catch (error) {
    if (error instanceof HttpError) throw error
    refused(error)
  }
}

/**
 * Back from Stripe's checkout: reads the session and its subscription, so the page is right
 * before the webhook arrives (or in \`vite dev\` without \`stripe listen\`). Only the user the
 * subscription names can sync it.
 */
export async function syncBilling(
  env: BillingEnv,
  request: Request,
  sessionId: string,
): Promise<Billing> {
  const user = await requireUser(env.DB, request)
  const stripe = stripeOf(env)
  try {
    const session = await stripe.retrieveCheckoutSession(sessionId)
    if (session.mode === 'subscription' && session.subscriptionId) {
      const subscription = await stripe.retrieveSubscription(session.subscriptionId)
      if (subscription.metadata['user'] !== user.id) {
        throw new HttpError(403, 'This checkout belongs to another account')
      }
      await store(env.DB, subscription)
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    refused(error)
  }
  return toBilling(await readRow(env.DB, user.id))
}

/** Opens Stripe's Customer Portal: plan, card, invoices and cancellation, all hosted. */
export async function openPortal(
  env: BillingEnv,
  request: Request,
  origin: string,
): Promise<{ url: string }> {
  const user = await requireUser(env.DB, request)
  const row = await readRow(env.DB, user.id)
  if (!row?.customerId) throw new HttpError(409, 'Subscribe first: there is nothing to manage yet')
  try {
    return await stripeOf(env).createPortalSession({
      customer: row.customerId,
      returnUrl: \`\${origin}/billing\`,
    })
  } catch (error) {
    refused(error)
  }
}
`
}

function cfBillingRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  signal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { auth } from '../auth'
import { PLAN } from '../billing'
import type { Billing, BillingStatus } from '../billing'
import { formatPrice } from '../checkout'
import { router } from '../router'

const client = createClient(api)
const billing = signal<Billing | null>(null)
const busy = signal<'subscribe' | 'portal' | null>(null)
const failure = signal<string | null>(null)

/**
 * Loads the plan. Back from Stripe's checkout, the URL carries the session id: syncing it
 * shows the new subscription at once, before the webhook. Then the id leaves the URL.
 */
async function load(): Promise<void> {
  failure.value = null
  try {
    const sessionId = new URLSearchParams(router.search.peek()).get('session')
    if (sessionId) {
      billing.value = await client.syncBilling({ body: { sessionId } })
      router.navigate('/billing', { replace: true })
    } else {
      billing.value = await client.getBilling()
    }
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not load billing'
  }
}

/** Both buttons leave for a Stripe page: checkout, or the billing portal. */
async function leaveFor(kind: 'subscribe' | 'portal'): Promise<void> {
  busy.value = kind
  failure.value = null
  try {
    const { url } =
      kind === 'subscribe' ? await client.startSubscription() : await client.openBillingPortal()
    location.assign(url)
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Stripe did not open'
    busy.value = null
  }
}

const LABEL: Record<BillingStatus, string> = {
  none: 'No plan',
  incomplete: 'Payment pending',
  incomplete_expired: 'Payment expired',
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Payment failed: retrying',
  canceled: 'Cancelled',
  unpaid: 'Unpaid',
  paused: 'Paused',
}

export default function BillingPage() {
  useSignals()
  useSignalEffect(() => {
    if (auth.user.value) void load()
  })
  const user = auth.user.value
  const plan = billing.value

  if (user === undefined) return <Spinner label="Loading" />
  if (user === null) {
    return (
      <Flex gap={4}>
        <Heading level={1}>Billing</Heading>
        <Text>
          <Link href="/account">Sign in</Link> to subscribe: a plan belongs to your account.
        </Text>
      </Flex>
    )
  }
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Billing</Heading>
        <Text muted>
          Paid on Stripe's hosted checkout; changed, paused or cancelled in Stripe's billing portal.
          The Worker keeps your plan in step through Stripe's webhook.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={3}>
            <Flex direction="horizontal" align="center" gap={2} wrap>
              <Heading level={2}>{PLAN.name}</Heading>
              {plan ? (
                <Badge variant={plan.active ? 'success' : 'secondary'}>{LABEL[plan.status]}</Badge>
              ) : null}
            </Flex>
            <Text muted>{PLAN.description}</Text>
            <Text size="lg">
              {formatPrice(PLAN.amount, PLAN.currency)} a {PLAN.interval}
            </Text>
            {plan?.currentPeriodEnd ? (
              <Text size="sm" muted>
                {plan.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                {new Date(plan.currentPeriodEnd).toLocaleDateString()}
              </Text>
            ) : null}
            <Flex direction="horizontal" gap={2} wrap>
              {plan && !plan.active ? (
                <Button
                  loading={busy.value === 'subscribe'}
                  onClick={() => void leaveFor('subscribe')}
                >
                  Subscribe
                </Button>
              ) : null}
              {plan?.canManage ? (
                <Button
                  variant="secondary"
                  loading={busy.value === 'portal'}
                  onClick={() => void leaveFor('portal')}
                >
                  Manage billing
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </CardContent>
      </Card>
      {failure.value ? (
        <Alert variant="destructive" title="Not done">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}
`
}

/* --- `--auth email`: accounts with emailed sign-in links (@cascivo/app/auth) --- */

function cfAuthTs(): string {
  return `import { createAuth } from '@cascivo/app/auth'

/**
 * Who is signed in, shared by every page: \`auth.user.value\` is \`undefined\` while the first
 * check runs, then the user or \`null\`. The Worker side is \`handleAuth\` in worker/index.ts.
 */
export const auth = createAuth()
`
}

function cfAuthWorkerTs(): string {
  return `/** What sending a sign-in link needs of the Email Service binding (\`send_email\`). */
export interface SignInSender {
  send(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<unknown>
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Emails a sign-in link. \`vite dev\` sends nothing: the link is logged, and the Account page
 * shows it (\`exposeLink\` in worker/index.ts).
 */
export async function sendSignInLink(
  sender: SignInSender,
  from: string,
  email: string,
  url: string,
): Promise<void> {
  if (import.meta.env.DEV) {
    console.log(\`[auth] sign-in link for \${email}: \${url}\`)
    return
  }
  if (!from) throw new Error('Set AUTH_FROM in wrangler.jsonc to an address on your domain')
  await sender.send({
    from,
    to: email,
    subject: 'Your sign-in link',
    text: \`Sign in: \${url}\\n\\nThe link works once, for 15 minutes. If you did not ask for it, ignore this email.\`,
    html: \`<p><a href="\${escape(url)}">Sign in</a></p><p>The link works once, for 15 minutes. If you did not ask for it, ignore this email.</p>\`,
  })
}
`
}

function cfAccountRouteTsx(): string {
  return `import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Input,
  Link,
  Spinner,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import type { FormEvent } from 'react'
import { auth } from '../auth'

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

export default function Account() {
  useSignals()
  const user = auth.user.value

  if (user === undefined) return <Spinner label="Loading" />
  if (user) {
    return (
      <Flex gap={4}>
        <Heading level={1}>Account</Heading>
        <Card>
          <CardContent>
            <Flex gap={3}>
              <Text>Signed in as {user.email}</Text>
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
        <Text muted>No password: we email you a link that signs you in once.</Text>
      </Flex>
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
      </form>
    </Flex>
  )
}
`
}

function cfVerifyRouteTsx(): string {
  return `import { Alert, Button, Flex, Heading, Text, signal, useSignals } from '@cascivo/react'
import { auth } from '../../auth'
import { router } from '../../router'

const failure = signal<string | null>(null)
const busy = signal(false)

/**
 * The page a sign-in link opens. It signs in only when you press the button: mail scanners
 * open every link in a message, and a link that signed in on open would be used up by them.
 */
async function signIn(): Promise<void> {
  const token = new URLSearchParams(router.search.value).get('token')
  if (!token) {
    failure.value = 'This link has no token. Request a new one.'
    return
  }
  busy.value = true
  failure.value = null
  try {
    await auth.verify(token)
    router.navigate('/account', { replace: true })
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not sign in'
  } finally {
    busy.value = false
  }
}

export default function VerifySignIn() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Sign in</Heading>
        <Text muted>Finish signing in on this device.</Text>
      </Flex>
      {failure.value ? (
        <Alert variant="destructive" title="Not signed in">
          {failure.value}
        </Alert>
      ) : null}
      <Flex direction="horizontal">
        <Button loading={busy.value} onClick={() => void signIn()}>
          Sign in
        </Button>
      </Flex>
    </Flex>
  )
}
`
}

/* --- `--example publish`: views published as pages, stored in D1 --- */

function cfPagesTs(): string {
  return `import type { ViewConfig } from '@cascivo/render'
import { validateView } from '@cascivo/render/validate'

/**
 * A published page: a title and a view. Shared by the Worker (which stores pages) and the
 * app (which builds and shows them). A view is data, not code — it can only arrange cascivo
 * components the manifests describe — so publishing one needs no sandbox and no deploy.
 */
export interface PageInput {
  title: string
  view: ViewConfig
}

export interface PageSummary {
  slug: string
  title: string
  createdAt: string
}

export interface Page extends PageInput, PageSummary {}

/** Largest view accepted, in characters of its JSON. */
export const MAX_VIEW_LENGTH = 32_000

const SLUG = /^[a-z0-9]{10}$/

export function isSlug(value: string): boolean {
  return SLUG.test(value)
}

/**
 * Checks a page against the component manifests (\`validateView\`: known components and
 * props, and no URL that could run script). The Worker runs it before storing a page, and
 * \`<CascivoView>\` runs the same check again before rendering one.
 */
export function parsePageInput(raw: unknown): PageInput {
  if (typeof raw !== 'object' || raw === null) throw new Error('Expected { title, view }')
  const { title, view } = raw as Record<string, unknown>
  if (typeof title !== 'string' || title.trim() === '' || title.length > 80) {
    throw new Error('title: 1–80 characters')
  }
  if (JSON.stringify(view ?? null).length > MAX_VIEW_LENGTH) {
    throw new Error(\`view: at most \${MAX_VIEW_LENGTH} characters of JSON\`)
  }
  const result = validateView(view)
  if (!result.valid) {
    throw new Error(result.errors.map((e) => \`\${e.path}: \${e.message}\`).join('\\n'))
  }
  // validateView has checked the whole shape, so the cast states a proven fact.
  return { title: title.trim(), view: view as ViewConfig }
}

export function parsePageSummary(raw: unknown): PageSummary {
  if (typeof raw === 'object' && raw !== null) {
    const { slug, title, createdAt } = raw as Record<string, unknown>
    if (
      typeof slug === 'string' &&
      isSlug(slug) &&
      typeof title === 'string' &&
      typeof createdAt === 'string'
    ) {
      return { slug, title, createdAt }
    }
  }
  throw new Error('Malformed page')
}

export function parsePage(raw: unknown): Page {
  const summary = parsePageSummary(raw)
  const { view } = raw as Record<string, unknown>
  return { ...summary, ...parsePageInput({ title: summary.title, view }) }
}
`
}

function cfPagesWorkerTs(): string {
  return `import { HttpError } from '@cascivo/app/api'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { isSlug, parsePage } from '../src/pages'
import type { Page, PageInput, PageSummary } from '../src/pages'

const migrations = [
  {
    id: '0001_pages',
    statements: [
      \`CREATE TABLE pages (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        view TEXT NOT NULL,
        created_at TEXT NOT NULL
      )\`,
    ],
  },
]

const ready = async (db: Database) => {
  await migrate(db, migrations)
  return db
}

/** Ten random base-36 characters: not guessable, so an unlisted page stays unlisted. */
function newSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('')
}

/**
 * A stored row back into a page. The view is JSON text written by this Worker, but it is
 * parsed and validated again like anything read from storage: an older version of the app,
 * or a hand in the D1 console, may have written it.
 */
function pageFromRow(raw: unknown): Page {
  if (typeof raw !== 'object' || raw === null) throw new Error('Malformed page row')
  const row = raw as Record<string, unknown>
  if (typeof row['view'] !== 'string') throw new Error('Malformed page row')
  return parsePage({ ...row, view: JSON.parse(row['view']) })
}

export async function publishPage(db: Database, page: PageInput): Promise<PageSummary> {
  const summary = { slug: newSlug(), title: page.title, createdAt: new Date().toISOString() }
  await (
    await ready(db)
  )
    .prepare('INSERT INTO pages (slug, title, view, created_at) VALUES (?, ?, ?, ?)')
    .bind(summary.slug, summary.title, JSON.stringify(page.view), summary.createdAt)
    .run()
  return summary
}

export async function getPage(db: Database, slug: string): Promise<Page> {
  if (!isSlug(slug)) throw new HttpError(404, 'No such page')
  const [page] = await queryRows(
    await ready(db),
    'SELECT slug, title, view, created_at AS createdAt FROM pages WHERE slug = ?',
    [slug],
    pageFromRow,
  )
  if (!page) throw new HttpError(404, 'No such page')
  return page
}
`
}

function cfPageHtmlTs(): string {
  return `import { CascivoView } from '@cascivo/render'
import { Flex, Heading } from '@cascivo/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Page } from '../src/pages'

/** The static-assets binding (\`assets.binding\` in wrangler.jsonc): the built index.html. */
export interface Assets {
  fetch(request: Request): Promise<Response>
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
}

/** Rendered markup back to its visible text, for a link preview's description. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\\s+/g, ' ')
    .trim()
}

/** The route file whose stylesheets a published page needs, as the build manifest names it. */
const PAGE_ROUTE = 'src/routes/p/[slug].tsx'

/**
 * The stylesheets the published-page route loads, from Vite's build manifest (vite.config.ts
 * writes it as asset-manifest.json). The route is loaded lazily, so its component CSS is
 * linked by JavaScript; a reader without JavaScript needs it linked in the HTML. \`vite dev\`
 * has no manifest, and there the CSS arrives with the JavaScript anyway.
 */
async function pageStylesheets(request: Request, assets: Assets): Promise<string[]> {
  const response = await assets.fetch(new Request(new URL('/asset-manifest.json', request.url)))
  if (!response.ok) return []
  const manifest: unknown = await response.json().catch(() => null)
  if (typeof manifest !== 'object' || manifest === null) return []
  const chunks = manifest as Record<string, unknown>
  const found = new Set<string>()
  const seen = new Set<string>()
  const walk = (key: string) => {
    if (seen.has(key)) return
    seen.add(key)
    const chunk = chunks[key]
    if (typeof chunk !== 'object' || chunk === null) return
    const { css, imports } = chunk as Record<string, unknown>
    if (Array.isArray(css)) for (const file of css) if (typeof file === 'string') found.add(file)
    if (Array.isArray(imports)) for (const next of imports) if (typeof next === 'string') walk(next)
  }
  walk(PAGE_ROUTE)
  return [...found]
}

/**
 * The app's index.html for a published page, with the page in it: a title and description
 * for search engines and link previews (which run no JavaScript), and the rendered view in
 * a \`<noscript>\` for readers without JavaScript. The app then starts as usual and renders
 * the page itself.
 */
export async function renderPageHtml(
  request: Request,
  page: Page,
  assets: Assets,
  imageUrl: string | null,
): Promise<Response> {
  const shell = await assets.fetch(new Request(new URL('/', request.url)))
  const view = renderToStaticMarkup(createElement(CascivoView, { config: page.view }))
  // The same layout as src/routes/p/[slug].tsx, so it is styled by the same stylesheets.
  const body = renderToStaticMarkup(
    createElement(
      Flex,
      { gap: 4 },
      createElement(Heading, { level: 1 }, page.title),
      createElement(CascivoView, { config: page.view }),
    ),
  )
  const description = textOf(view).slice(0, 160)
  const url = new URL(request.url)
  url.search = ''
  const title = escapeHtml(page.title)
  const meta = [
    \`<title>\${title}</title>\`,
    \`<meta name="description" content="\${escapeHtml(description)}" />\`,
    \`<link rel="canonical" href="\${escapeHtml(url.href)}" />\`,
    '<meta property="og:type" content="article" />',
    \`<meta property="og:title" content="\${title}" />\`,
    \`<meta property="og:description" content="\${escapeHtml(description)}" />\`,
    \`<meta property="og:url" content="\${escapeHtml(url.href)}" />\`,
    ...(imageUrl
      ? [
          \`<meta property="og:image" content="\${escapeHtml(imageUrl)}" />\`,
          '<meta property="og:image:width" content="1200" />',
          '<meta property="og:image:height" content="630" />',
          '<meta name="twitter:card" content="summary_large_image" />',
        ]
      : ['<meta name="twitter:card" content="summary" />']),
  ].join('\\n    ')
  const stylesheets = (await pageStylesheets(request, assets))
    .map((file) => \`<link rel="stylesheet" href="/\${escapeHtml(file)}" />\`)
    .join('\\n    ')
  const html = (await shell.text())
    .replace(/<title>[\\s\\S]*?<\\/title>/, stylesheets ? \`\${meta}\\n    \${stylesheets}\` : meta)
    .replace(
      '<div id="root"></div>',
      // Before the app's root, which fills the viewport: after it, the page would start below
      // the fold.
      \`<noscript><main style="padding: 1.5rem">\${body}</main></noscript>\\n    <div id="root"></div>\`,
    )
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' },
  })
}
`
}

function cfPagePreviewTs(): string {
  return `import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { exportPage } from '@cascivo/app/export'
import type { ExportBrowser } from '@cascivo/app/export'
import { getPage } from './pages'

const migrations = [
  {
    id: '0001_page_previews',
    statements: ['CREATE TABLE page_previews (slug TEXT PRIMARY KEY, png BLOB NOT NULL)'],
  },
]

/** A stored BLOB as bytes: D1 returns one as an array of numbers. */
function bytesOf(raw: unknown): Uint8Array | null {
  const png =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>)['png'] : null
  if (png instanceof ArrayBuffer) return new Uint8Array(png)
  if (ArrayBuffer.isView(png)) return new Uint8Array(png.buffer, png.byteOffset, png.byteLength)
  if (Array.isArray(png) && png.every((b) => typeof b === 'number')) return Uint8Array.from(png)
  return null
}

/**
 * A published page's link-preview image, 1200 × 630: rendered from the page by Browser Run on
 * its first request and kept in D1, so a page shared a thousand times starts one browser.
 */
export async function pagePreview(
  db: Database,
  slug: string,
  origin: string,
  launch: () => Promise<ExportBrowser>,
): Promise<Response> {
  await getPage(db, slug) // 404 for a page that does not exist
  await migrate(db, migrations)
  const [stored] = await queryRows(
    db,
    'SELECT png FROM page_previews WHERE slug = ?',
    [slug],
    bytesOf,
  )
  let png = stored ?? null
  if (!png) {
    png = await exportPage(launch, new URL(\`/p/\${slug}\`, origin).href, {
      format: 'png',
      viewport: { width: 1200, height: 630 },
      fullPage: false,
    })
    await db
      .prepare('INSERT OR REPLACE INTO page_previews (slug, png) VALUES (?, ?)')
      .bind(slug, png)
      .run()
  }
  return new Response(new Uint8Array(png), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' },
  })
}
`
}

function cfPublishRouteTsx(): string {
  return `import { createClient } from '@cascivo/app/api'
import { CascivoView } from '@cascivo/render'
import type { ViewConfig } from '@cascivo/render'
import { validateView } from '@cascivo/render/validate'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Grid,
  Heading,
  Input,
  Link,
  Text,
  Textarea,
  computed,
  signal,
  useSignals,
} from '@cascivo/react'
import type { ChangeEvent } from 'react'
import { api } from '../api'
import type { PageSummary } from '../pages'

const client = createClient(api)

const EXAMPLE: ViewConfig = {
  view: {
    regions: {
      main: [
        {
          component: 'Card',
          props: { padding: 'lg' },
          children: [
            {
              component: 'Flex',
              props: { gap: 3 },
              children: [
                { component: 'Badge', props: { variant: 'success' }, children: 'Live' },
                { component: 'ProgressBar', props: { value: 3, max: 5, label: 'Steps done' } },
                {
                  component: 'Alert',
                  props: { variant: 'info', title: 'Published from a view' },
                  children: 'Edit the JSON on /publish and publish again for a new page.',
                },
                {
                  component: 'Link',
                  props: { href: 'https://developers.cloudflare.com/workers/' },
                  children: 'Cloudflare Workers docs',
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

const title = signal('Launch checklist')
const draft = signal(JSON.stringify(EXAMPLE, null, 2))
const published = signal<PageSummary | null>(null)
const failure = signal<string | null>(null)

/**
 * The draft as a view to preview, or what is wrong with it. The Worker checks a page again
 * before storing it: this check is for the preview, not a guard.
 */
const checked = computed((): { view: ViewConfig } | { errors: string[] } => {
  let raw: unknown
  try {
    raw = JSON.parse(draft.value)
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : 'Not JSON'] }
  }
  const result = validateView(raw)
  if (!result.valid) return { errors: result.errors.map((e) => \`\${e.path}: \${e.message}\`) }
  // validateView has checked the whole shape, so the cast states a proven fact.
  return { view: raw as ViewConfig }
})

async function publish(): Promise<void> {
  failure.value = null
  published.value = null
  const current = checked.value
  if ('errors' in current) {
    failure.value = current.errors.join('\\n')
    return
  }
  try {
    published.value = await client.publishPage({
      body: { title: title.value, view: current.view },
    })
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not publish'
  }
}

export default function Publish() {
  useSignals()
  const current = checked.value

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Publish</Heading>
        <Text muted>
          Write a view — or have an agent write one — and publish it as a page. A view only arranges
          this app's components, so a page needs no sandbox and no deploy.
        </Text>
      </Flex>
      <Grid cols={2} gap={4}>
        <Flex gap={3}>
          <Input
            label="Title"
            value={title.value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              title.value = event.currentTarget.value
            }}
          />
          <Textarea
            label="View (JSON)"
            rows={18}
            spellCheck={false}
            value={draft.value}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              draft.value = event.currentTarget.value
            }}
          />
          <Flex direction="horizontal" align="center" gap={3} wrap>
            <Button onClick={() => void publish()}>Publish</Button>
            {published.value ? (
              <Link href={\`/p/\${published.value.slug}\`}>Open /p/{published.value.slug}</Link>
            ) : null}
          </Flex>
          {failure.value ? (
            <Alert variant="destructive" title="Not published">
              {failure.value}
            </Alert>
          ) : null}
        </Flex>
        <Card>
          <CardContent>
            {'errors' in current ? (
              <Flex gap={1}>
                {current.errors.map((error) => (
                  <Text key={error} size="sm" muted>
                    {error}
                  </Text>
                ))}
              </Flex>
            ) : (
              <CascivoView config={current.view} />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Flex>
  )
}
`
}

function cfPageRouteTsx(): string {
  return `import type { RouteProps } from '@cascivo/app'
import { createClient } from '@cascivo/app/api'
import { CascivoView } from '@cascivo/render'
import {
  EmptyState,
  Flex,
  Heading,
  Spinner,
  signal,
  useEffectPropSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../../api'
import type { Page } from '../../pages'

const client = createClient(api)
/** Pages already fetched, by slug; \`null\` when the slug has no page. */
const pages = signal<Readonly<Record<string, Page | null>>>({})

async function load(slug: string): Promise<void> {
  if (slug in pages.peek()) return
  try {
    const page = await client.getPage({ params: { slug } })
    pages.value = { ...pages.peek(), [slug]: page }
  } catch {
    pages.value = { ...pages.peek(), [slug]: null }
  }
}

/** \`/p/:slug\` — a published page, rendered from its view with the app's own components. */
export default function PublishedPage({ params }: RouteProps<'/p/:slug'>) {
  useSignals()
  const slug = useEffectPropSignal(params.slug)
  useSignalEffect(() => {
    void load(slug.value)
  })
  const page = pages.value[params.slug]

  if (page === undefined) return <Spinner label="Loading" />
  if (page === null) {
    return <EmptyState title="No such page" description="It may never have been published." />
  }
  return (
    <Flex gap={4}>
      <Heading level={1}>{page.title}</Heading>
      <CascivoView config={page.view} onInvalid="render" />
    </Flex>
  )
}
`
}

/* --- `--example voice`: a voice assistant on the Agents SDK and Workers AI speech --- */

function cfVoiceTs(): string {
  return `import { signal } from '@cascivo/react'
import { VoiceClient } from 'agents/voice/client'
import type { TranscriptMessage, VoiceStatus } from 'agents/voice/client'

/**
 * The /voice page's connection to its agent (worker/voice.ts). \`VoiceClient\` does the audio:
 * the microphone, streaming it to the Worker, playing the replies, and noticing when you talk
 * over one. This file turns its events into signals, which the page reads.
 */

/** The Durable Object class; the client connects to /agents/voice/<conversation>. */
export const VOICE_AGENT = 'Voice'

/** One line of the conversation, from this call or an earlier one. */
export interface Line {
  role: 'user' | 'assistant'
  text: string
}

export const status = signal<VoiceStatus>('idle')
export const connected = signal(false)
/** The conversation as the agent stored it when this tab connected. */
export const history = signal<Line[]>([])
/** Turns since then; \`transcript\` from VoiceClient, minus what \`history\` already holds. */
export const transcript = signal<TranscriptMessage[]>([])
/** What the speech-to-text model has heard so far of the current sentence. */
export const interim = signal<string | null>(null)
/** Microphone level, 0–1. */
export const level = signal(0)
export const muted = signal(false)
export const error = signal<string | null>(null)

let client: VoiceClient | null = null
/** How much of VoiceClient's transcript the last history message already covered. */
let covered = 0

/**
 * Checks the history the agent sends on connect (worker/voice.ts). It crossed the network, so
 * anything that is not a list of { role, content } lines is ignored rather than trusted.
 */
export function parseHistory(raw: unknown): Line[] | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { type, messages } = raw as Record<string, unknown>
  if (type !== 'history' || !Array.isArray(messages)) return null
  const lines: Line[] = []
  for (const message of messages) {
    if (typeof message !== 'object' || message === null) continue
    const { role, content } = message as Record<string, unknown>
    if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
      lines.push({ role, text: content })
    }
  }
  return lines
}

/** One conversation per tab: a reload keeps it, a new tab starts another. */
function conversationId(): string {
  const key = 'voice-conversation'
  try {
    const saved = sessionStorage.getItem(key)
    if (saved && /^[\\w-]{1,64}$/.test(saved)) return saved
    const id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

/** Connects once; later calls return the same client. */
export function voice(): VoiceClient {
  if (client) return client
  const c = new VoiceClient({ agent: VOICE_AGENT, name: conversationId() })
  c.addEventListener('statuschange', (value) => (status.value = value))
  c.addEventListener('connectionchange', (value) => (connected.value = value))
  c.addEventListener('transcriptchange', (value) => (transcript.value = value.slice(covered)))
  c.addEventListener('custommessage', (raw) => {
    const lines = parseHistory(raw)
    if (!lines) return
    history.value = lines
    covered = c.transcript.length
    transcript.value = []
  })
  c.addEventListener('interimtranscript', (value) => (interim.value = value))
  c.addEventListener('audiolevelchange', (value) => (level.value = value))
  c.addEventListener('mutechange', (value) => (muted.value = value))
  c.addEventListener('error', (value) => (error.value = value))
  c.connect()
  client = c
  return c
}
`
}

function cfVoiceWorkerTs(): string {
  return `import { Agent } from 'agents'
import type { Connection } from 'agents'
import { withVoice, WorkersAIFluxSTT, WorkersAITTS } from 'agents/voice'
import type { TextSource, VoiceTurnContext } from 'agents/voice'
import type { Env } from './index'
import { scriptedReply, ScriptedTranscriber, silentSpeech } from './scripted-voice'

/** Any Workers AI text model; replies stream into speech sentence by sentence. */
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

/** How many earlier messages a reload shows. */
const HISTORY_SHOWN = 50

const SYSTEM = \`You are a voice assistant inside a web app. Your replies are spoken aloud, so
answer in one to three short sentences of plain speech: no lists, no markdown, no emoji.\`

// \`vite dev\` has no Workers AI, so there the voice is a stand-in (worker/scripted-voice.ts):
// it "hears" a fixed question every few seconds of audio and answers without sound. A
// deployed Worker uses Workers AI for all three steps, and so does \`VITE_REAL_AI=1 vite dev\`.
const scripted = import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'

const VoiceAgent = withVoice(Agent<Env>)

/**
 * One Durable Object per conversation: speech in, text through a model, speech out. It keeps
 * the conversation in its SQLite database, so a reconnect carries on where it was.
 */
export class Voice extends VoiceAgent {
  transcriber = scripted ? new ScriptedTranscriber() : new WorkersAIFluxSTT(this.env.AI)
  tts = scripted ? silentSpeech : new WorkersAITTS(this.env.AI)

  /** VoiceClient starts empty: send a new connection the conversation so far (src/voice.ts). */
  onConnect(connection: Connection): void {
    connection.send(
      JSON.stringify({ type: 'history', messages: this.getConversationHistory(HISTORY_SHOWN) }),
    )
  }

  async onTurn(transcript: string, { messages, signal }: VoiceTurnContext): Promise<TextSource> {
    if (scripted) return scriptedReply(transcript)
    try {
      // A stream of server-sent events; the voice pipeline reads the text out of it.
      const stream = await this.env.AI.run(
        MODEL,
        {
          messages: [
            { role: 'system', content: SYSTEM },
            ...messages,
            { role: 'user', content: transcript },
          ],
          stream: true,
        },
        { signal },
      )
      if (!(stream instanceof ReadableStream)) throw new Error('Workers AI returned no stream')
      return stream
    } catch (error) {
      if (signal.aborted) throw error
      // Said aloud rather than left as silence; the cause is in the Worker's logs.
      console.error('[voice] the model call failed:', error)
      return 'Sorry, I could not reach the model just now.'
    }
  }
}
`
}

function cfScriptedVoiceTs(): string {
  return `import type {
  TTSProvider,
  Transcriber,
  TranscriberSession,
  TranscriberSessionOptions,
} from 'agents/voice'

/**
 * \`vite dev\` stand-ins for Workers AI's speech models, which have no local mode. They keep the
 * whole call working offline — microphone, streaming, turns, transcript — without a model:
 * the transcriber "hears" a fixed question for every few seconds of sound, and the replies
 * are text only. Production never uses them (see worker/voice.ts).
 */

/** 16 kHz, 16-bit mono: this many bytes is three seconds of audio. */
const BYTES_PER_TURN = 16_000 * 2 * 3
const QUESTIONS = ['What can you do?', 'How do I deploy this app?', 'Thanks, that is all.']

export class ScriptedTranscriber implements Transcriber {
  createSession(options: TranscriberSessionOptions = {}): TranscriberSession {
    let bytes = 0
    let turn = 0
    return {
      feed(chunk) {
        bytes += chunk.byteLength
        if (bytes < BYTES_PER_TURN) return
        bytes = 0
        options.onUtterance?.(QUESTIONS[turn++ % QUESTIONS.length]!)
      },
      close() {},
    }
  }
}

/** No sound in \`vite dev\`: the reply shows in the transcript only. */
export const silentSpeech: TTSProvider = { synthesize: async () => null }

const REPLIES: Record<string, string> = {
  'What can you do?':
    'I am the development stand-in. Deploy, or set VITE_REAL_AI=1, for Workers AI.',
  'How do I deploy this app?': 'Run the deploy script. It builds the page and the Worker together.',
}

export function scriptedReply(transcript: string): string {
  return REPLIES[transcript] ?? \`You said: \${transcript}\`
}
`
}

function cfVoiceRouteTsx(): string {
  return `import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Input,
  ProgressBar,
  Text,
  useSignals,
} from '@cascivo/react'
import type { FormEvent } from 'react'
import {
  connected,
  error,
  history,
  interim,
  level,
  muted,
  status,
  transcript,
  voice,
} from '../voice'
import type { Line } from '../voice'

const STATUS_LABEL = {
  idle: 'Not in a call',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
} as const

function sendTyped(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault()
  const form = event.currentTarget
  const text = new FormData(form).get('message')
  if (typeof text !== 'string' || text.trim() === '') return
  voice().sendText(text.trim())
  form.reset()
}

export default function VoicePage() {
  useSignals()
  const client = voice()
  const inCall = status.value !== 'idle'
  const lines: Line[] = [
    ...history.value,
    ...transcript.value.map((m) => ({ role: m.role, text: m.text })),
  ]

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Voice</Heading>
        <Text muted>
          Talk to an assistant on Workers AI: speech to text, a model, and text to speech, all in a
          Durable Object. Speak over a reply to interrupt it.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={3}>
            <Flex direction="horizontal" align="center" wrap gap={3}>
              {inCall ? (
                <Button variant="destructive" onClick={() => client.endCall()}>
                  End call
                </Button>
              ) : (
                <Button disabled={!connected.value} onClick={() => void client.startCall()}>
                  Start call
                </Button>
              )}
              <Button variant="secondary" disabled={!inCall} onClick={() => client.toggleMute()}>
                {muted.value ? 'Unmute' : 'Mute'}
              </Button>
              <Badge variant={status.value === 'idle' ? 'secondary' : 'success'}>
                {connected.value ? STATUS_LABEL[status.value] : 'Connecting'}
              </Badge>
            </Flex>
            {inCall ? (
              <ProgressBar label="Microphone" value={Math.round(level.value * 100)} max={100} />
            ) : null}
            {error.value ? <Text muted>{error.value}</Text> : null}
          </Flex>
        </CardContent>
      </Card>
      <Flex gap={2} role="log" aria-live="polite" aria-label="Conversation">
        {lines.length === 0 && !interim.value ? (
          <EmptyState
            title="Start a call and say something"
            description="Or type below: a typed message gets a reply too, spoken if you are in a call."
          />
        ) : null}
        {lines.map((message, index) => (
          // The conversation only grows, so a line's position is a stable key.
          <Flex key={index} gap={1}>
            <Text size="sm" muted>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </Text>
            <Text>{message.text}</Text>
          </Flex>
        ))}
        {interim.value ? <Text muted>{interim.value}…</Text> : null}
      </Flex>
      <form onSubmit={sendTyped}>
        <Flex direction="horizontal" align="end" gap={2}>
          <Input name="message" label="Or type" placeholder="Ask something" autoComplete="off" />
          <Button type="submit" variant="secondary" disabled={!connected.value}>
            Send
          </Button>
        </Flex>
      </form>
    </Flex>
  )
}
`
}

/* --- `--example live`: an ops dashboard fed by a Queue (@cascivo/app/live) --- */

function cfOpsTs(): string {
  return `import { defineLive } from '@cascivo/app/live'

/**
 * The live dashboard's metrics, shared by the Worker (which records them) and the page (which
 * charts them). Each event adds to its second's totals, and the room keeps two minutes.
 */
export const ops = defineLive({ metrics: ['orders', 'revenue', 'errors'], window: 120 })

/** The dashboard's room. Name one per team or tenant if each needs its own. */
export const OPS_ROOM = 'ops'

export interface Accepted {
  accepted: number
}

export function parseAccepted(raw: unknown): Accepted {
  if (typeof raw === 'object' && raw !== null) {
    const { accepted } = raw as Record<string, unknown>
    if (typeof accepted === 'number') return { accepted }
  }
  throw new Error('Malformed reply')
}
`
}

function cfOpsRouteTsx(): string {
  return `import { Kpi, LineChart } from '@cascivo/charts'
import { createClient } from '@cascivo/app/api'
import { watchLive } from '@cascivo/app/live'
import type { LiveEvent, LivePoint } from '@cascivo/app/live'
import {
  Badge,
  Card,
  CardContent,
  Flex,
  Grid,
  Heading,
  Text,
  Toggle,
  computed,
  signal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { ops } from '../ops'

type Metric = (typeof ops.metrics)[number]

const client = createClient(api)
// One connection for the app's lifetime. The room sends the whole window when it opens, so a
// reload or a dropped connection comes back with the last two minutes.
const live = watchLive(ops, '/api/live')
const lastMinute = computed(() => live.points.value.slice(-60))
const total = (points: LivePoint<Metric>[], metric: Metric) =>
  points.reduce((sum, point) => sum + point.values[metric], 0)

const simulating = signal(true)

/** Stand-in traffic: a few orders every half second, some of them failing. */
function sendTraffic(): void {
  const events: LiveEvent<Metric>[] = Array.from(
    { length: 1 + Math.floor(Math.random() * 6) },
    () =>
      Math.random() < 0.05
        ? { values: { errors: 1 } }
        : { values: { orders: 1, revenue: Math.round(20 + Math.random() * 180) } },
  )
  client
    .sendEvents({ body: events })
    .catch((error: unknown) => console.warn('Could not send events', error))
}

export default function Ops() {
  useSignals()
  useSignalEffect(() => {
    if (!simulating.value) return
    const timer = setInterval(sendTraffic, 500)
    return () => clearInterval(timer)
  })
  const points = live.points.value
  const minute = lastMinute.value

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Ops</Heading>
          <Text muted>
            Events go through a Queue into a Durable Object, which sends each second to every open
            dashboard.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={3}>
          <Badge variant={live.connection.value === 'open' ? 'success' : 'warning'}>
            {live.connection.value === 'open' ? 'Live' : 'Reconnecting'}
          </Badge>
          <Toggle
            label="Send simulated traffic"
            checked={simulating.value}
            onValueChange={(on) => {
              simulating.value = on
            }}
          />
        </Flex>
      </Flex>
      <Grid cols={3} gap={3}>
        <Kpi
          label="Orders, last minute"
          value={total(minute, 'orders').toLocaleString()}
          sparkline={minute.map((p) => p.values.orders)}
        />
        <Kpi
          label="Revenue, last minute"
          value={\`$\${total(minute, 'revenue').toLocaleString()}\`}
          sparkline={minute.map((p) => p.values.revenue)}
        />
        <Kpi
          label="Errors, last minute"
          value={total(minute, 'errors').toLocaleString()}
          sparkline={minute.map((p) => p.values.errors)}
        />
      </Grid>
      <Card>
        <CardContent>
          <LineChart
            title="Orders and errors per second"
            series={[
              { id: 'orders', label: 'Orders', data: points, y: (p) => p.values.orders },
              { id: 'errors', label: 'Errors', data: points, y: (p) => p.values.errors },
            ]}
            x={(p) => new Date(p.at)}
            y={(p) => p.values.orders}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <LineChart
            title="Revenue per second"
            series={[{ id: 'revenue', label: 'Revenue', data: points }]}
            x={(p) => new Date(p.at)}
            y={(p) => p.values.revenue}
          />
        </CardContent>
      </Card>
    </Flex>
  )
}
`
}

/* --- `--example crud`: a D1 table behind DataTable's server mode (@cascivo/app/db) --- */

function cfCustomersTs(): string {
  return `import { defineTable } from '@cascivo/app/db'

/**
 * The customers table, shared by the Worker (which queries it) and the page (which shows
 * it). The columns say what the table may sort, search and filter by — anything else in a
 * query is refused before any SQL is built.
 */
export const customersTable = defineTable({
  table: 'customers',
  key: 'id',
  columns: {
    id: {},
    name: { sort: true, search: true, filter: 'text' },
    email: { sort: true, search: true },
    plan: { sort: true, filter: 'select' },
    seats: { sort: true, filter: 'range' },
    created_at: { sort: true },
  },
})

export const PLANS = ['free', 'team', 'enterprise'] as const
export type Plan = (typeof PLANS)[number]

export interface Customer {
  id: string
  name: string
  email: string
  plan: Plan
  seats: number
  created_at: string
}

/** What the form sends: a customer without the fields the Worker sets. */
export type CustomerInput = Omit<Customer, 'id' | 'created_at'>

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/

function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value)
}

/** A form submission crosses the network: checked on the Worker before it is stored. */
export function parseCustomerInput(raw: unknown): CustomerInput {
  if (typeof raw !== 'object' || raw === null) throw new Error('Send a customer')
  const { name, email, plan, seats } = raw as Record<string, unknown>
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 120) {
    throw new Error('A name is 1 to 120 characters')
  }
  if (typeof email !== 'string' || !EMAIL.test(email) || email.length > 200) {
    throw new Error('That is not an email address')
  }
  if (!isPlan(plan)) throw new Error(\`The plan is one of \${PLANS.join(', ')}\`)
  if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 1 || seats > 100_000) {
    throw new Error('Seats is a whole number from 1')
  }
  return { name: name.trim(), email: email.trim().toLowerCase(), plan, seats }
}

/** A row from D1, or from the Worker's response. */
export function parseCustomer(raw: unknown): Customer {
  if (typeof raw === 'object' && raw !== null) {
    const { id, created_at } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof created_at === 'string') {
      return { id, created_at, ...parseCustomerInput(raw) }
    }
  }
  throw new Error('Malformed customer')
}

export function parseDeleted(raw: unknown): { id: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { id } = raw as Record<string, unknown>
    if (typeof id === 'string') return { id }
  }
  throw new Error('Malformed delete result')
}
`
}

function cfCustomersPageTs(): string {
  return `import { createClient } from '@cascivo/app/api'
import type { TableQuery } from '@cascivo/app/db'
import { signal } from '@cascivo/react'
import { api } from './api'
import type { Customer, CustomerInput, Plan } from './customers'

const client = createClient(api)

export const PAGE_SIZE = 10

/** The current page, as the Worker returned it for \`query\`. */
export const rows = signal<Customer[]>([])
export const total = signal(0)
export const loadError = signal<string | null>(null)

/** The plan filter above the table; '' is every plan. */
export const plan = signal<Plan | ''>('')

let query: TableQuery = { sort: undefined, search: '', filters: {}, page: 1, pageSize: PAGE_SIZE }
let latest = 0

/** Fetches the page for \`next\` (or the current query again); a slower, older answer is dropped. */
export async function load(next: TableQuery = query): Promise<void> {
  query = next
  const request = ++latest
  const filters = plan.value
    ? { ...next.filters, plan: { kind: 'select' as const, values: [plan.value] } }
    : next.filters
  try {
    const page = await client.customers({ body: { ...next, filters } })
    if (request !== latest) return
    rows.value = page.rows
    total.value = page.total
    loadError.value = null
  } catch (error) {
    if (request === latest)
      loadError.value = error instanceof Error ? error.message : 'Could not load'
  }
}

export function setPlan(next: Plan | ''): void {
  plan.value = next
  void load({ ...query, page: 1 })
}

export async function save(id: string | null, input: CustomerInput): Promise<void> {
  if (id) await client.updateCustomer({ params: { id }, body: input })
  else await client.createCustomer({ body: input })
  await load()
}

export async function remove(id: string): Promise<void> {
  await client.deleteCustomer({ params: { id } })
  await load()
}
`
}

function cfCustomersWorkerTs(): string {
  return `import { HttpError } from '@cascivo/app/api'
import { migrate, queryTable } from '@cascivo/app/db'
import type { Database, TablePage, TableQuery } from '@cascivo/app/db'
import { customersTable, parseCustomer } from '../src/customers'
import type { Customer, CustomerInput } from '../src/customers'
import { migrations } from './migrations'

/** Every handler starts here: the schema is applied once per isolate, before the first query. */
async function ready(db: Database): Promise<Database> {
  await migrate(db, migrations)
  return db
}

/** A second customer with the same email is a conflict the form can show, not a 500. */
function uniqueEmail(error: unknown): never {
  if (/UNIQUE/i.test(String(error))) throw new HttpError(409, 'A customer with that email exists')
  throw error
}

export async function listCustomers(db: Database, query: TableQuery): Promise<TablePage<Customer>> {
  return queryTable(await ready(db), customersTable, query, parseCustomer)
}

export async function createCustomer(db: Database, input: CustomerInput): Promise<Customer> {
  const customer: Customer = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  }
  await (
    await ready(db)
  )
    .prepare(
      'INSERT INTO customers (id, name, email, plan, seats, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(customer.id, input.name, input.email, input.plan, input.seats, customer.created_at)
    .run()
    .catch(uniqueEmail)
  return customer
}

export async function updateCustomer(
  db: Database,
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  const row = await (
    await ready(db)
  )
    .prepare(
      'UPDATE customers SET name = ?, email = ?, plan = ?, seats = ? WHERE id = ? RETURNING *',
    )
    .bind(input.name, input.email, input.plan, input.seats, id)
    .first()
    .catch(uniqueEmail)
  if (!row) throw new HttpError(404, 'No such customer')
  return parseCustomer(row)
}

export async function deleteCustomer(db: Database, id: string): Promise<{ id: string }> {
  const row = await (
    await ready(db)
  )
    .prepare('DELETE FROM customers WHERE id = ? RETURNING id')
    .bind(id)
    .first()
  if (!row) throw new HttpError(404, 'No such customer')
  return { id }
}
`
}

function cfMigrationsTs(): string {
  return `import type { Migration } from '@cascivo/app/db'

const FIRST = [
  'Ada',
  'Grace',
  'Alan',
  'Edsger',
  'Barbara',
  'Donald',
  'Margaret',
  'Ken',
  'Frances',
  'Tim',
]
const LAST = ['Labs', 'Systems', 'Works', 'Studio', 'Group', 'Cloud']
const PLANS = ['free', 'team', 'enterprise']

/** 60 sample customers, so the table has pages to sort, search and filter from the start. */
function seed(): string {
  const rows = Array.from({ length: 60 }, (_, i) => {
    const name = \`\${FIRST[i % FIRST.length]} \${LAST[i % LAST.length]}\`
    const email = \`\${name.toLowerCase().replace(' ', '.')}\${i}@example.com\`
    const day = String((i % 28) + 1).padStart(2, '0')
    return \`('seed-\${i}', '\${name}', '\${email}', '\${PLANS[i % 3]}', \${((i * 37) % 250) + 1}, '2026-0\${(i % 9) + 1}-\${day}')\`
  })
  return \`INSERT INTO customers (id, name, email, plan, seats, created_at) VALUES \${rows.join(', ')}\`
}

/**
 * The schema, applied by the Worker itself on its first query (\`migrate\` from
 * \`@cascivo/app/db\`): a fresh deploy, a Deploy button or a temporary account needs no step.
 * Append new migrations; never edit one that has shipped.
 */
export const migrations: Migration[] = [
  {
    id: '0001_customers',
    statements: [
      \`CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        plan TEXT NOT NULL,
        seats INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )\`,
      'CREATE INDEX customers_plan ON customers (plan)',
      seed(),
    ],
  },
]
`
}

function cfCustomersRouteTsx(): string {
  return `import type { Column } from '@cascivo/react'
import {
  Badge,
  Button,
  DataTable,
  Flex,
  Heading,
  Input,
  Modal,
  NumberInput,
  Select,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { PLANS } from '../customers'
import type { Customer, CustomerInput, Plan } from '../customers'
import {
  PAGE_SIZE,
  load,
  loadError,
  plan,
  remove,
  rows,
  save,
  setPlan,
  total,
} from '../customers-page'

/** The customer in the form: \`id\` null for a new one. */
const editing = signal<{ id: string | null; draft: CustomerInput } | null>(null)
const formError = signal<string | null>(null)
const saving = signal(false)

void load()

const COLUMNS: Column<Customer>[] = [
  { key: 'name', header: 'Name', sortable: true, filter: 'text' },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'plan',
    header: 'Plan',
    sortable: true,
    render: (row) => (
      <Badge variant={row.plan === 'enterprise' ? 'success' : 'secondary'}>{row.plan}</Badge>
    ),
  },
  { key: 'seats', header: 'Seats', sortable: true, align: 'end', filter: 'range' },
  {
    key: 'created_at',
    header: 'Since',
    sortable: true,
    render: (row) => row.created_at.slice(0, 10),
  },
]

function edit(customer: Customer | null) {
  formError.value = null
  editing.value = customer
    ? {
        id: customer.id,
        draft: {
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
          seats: customer.seats,
        },
      }
    : { id: null, draft: { name: '', email: '', plan: 'team', seats: 5 } }
}

function change(patch: Partial<CustomerInput>) {
  if (editing.value)
    editing.value = { ...editing.value, draft: { ...editing.value.draft, ...patch } }
}

async function submit() {
  if (!editing.value) return
  saving.value = true
  formError.value = null
  try {
    await save(editing.value.id, editing.value.draft)
    editing.value = null
  } catch (error) {
    // The Worker's message: "A customer with that email exists", "That is not an email address"…
    formError.value = error instanceof Error ? error.message : 'Could not save'
  } finally {
    saving.value = false
  }
}

function CustomerForm() {
  useSignals()
  const current = editing.value
  if (!current) return null
  const { draft } = current
  return (
    <Modal
      open
      onClose={() => (editing.value = null)}
      title={current.id ? 'Edit customer' : 'New customer'}
      footer={
        <Flex direction="horizontal" gap={2} justify="end">
          <Button variant="ghost" onClick={() => (editing.value = null)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving.value}>
            Save
          </Button>
        </Flex>
      }
    >
      <Flex gap={3}>
        <Input label="Name" value={draft.name} onChange={(e) => change({ name: e.target.value })} />
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(e) => change({ email: e.target.value })}
        />
        <Select
          label="Plan"
          value={draft.plan}
          options={PLANS.map((p) => ({ value: p, label: p }))}
          onChange={(e) => change({ plan: e.target.value as Plan })}
        />
        <NumberInput
          label="Seats"
          min={1}
          value={draft.seats}
          onValueChange={(v) => change({ seats: v ?? 1 })}
        />
        {formError.value ? <Text muted>{formError.value}</Text> : null}
      </Flex>
    </Modal>
  )
}

export default function Customers() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Customers</Heading>
          <Text muted>
            A D1 table behind DataTable's server mode: sorting, search, filters and paging all run
            as SQL in the Worker.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={2}>
          <Select
            ariaLabel="Plan"
            value={plan.value}
            options={[
              { value: '', label: 'Every plan' },
              ...PLANS.map((p) => ({ value: p, label: p })),
            ]}
            onChange={(e) => setPlan(e.target.value as Plan | '')}
          />
          <Button onClick={() => edit(null)}>New customer</Button>
        </Flex>
      </Flex>
      {loadError.value ? <Text muted>{loadError.value}</Text> : null}
      <DataTable
        columns={COLUMNS}
        rows={rows.value}
        getRowId={(row) => row.id}
        searchable
        pagination={{ pageSize: PAGE_SIZE }}
        server={{ totalItems: total.value, onQueryChange: (query) => void load(query) }}
        rowActions={(row) => [
          { id: 'edit', label: 'Edit', onSelect: () => edit(row) },
          { id: 'delete', label: 'Delete', destructive: true, onSelect: () => void remove(row.id) },
        ]}
      />
      <CustomerForm />
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
   \`checkout.session.async_payment_succeeded\`, \`checkout.session.async_payment_failed\` and
   \`checkout.session.expired\`; its signing secret is \`STRIPE_WEBHOOK_SECRET\`.
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
- \`src/routes/checkout/[order].tsx\` — where Stripe sends the buyer back. It watches the
  order's read-only room, so it updates when the webhook arrives.

Each caller (by IP) may start 20 checkouts a minute.${
          usesBilling(opts)
            ? `

### Subscriptions (\`/billing\`)

Signed-in users subscribe to \`PLAN\` (\`src/billing.ts\`) on Stripe's checkout and change,
pause or cancel it in Stripe's hosted billing portal, so the app has no billing screens to build.

1. Add \`customer.subscription.created\`, \`customer.subscription.updated\` and
   \`customer.subscription.deleted\` to the webhook endpoint's events.
2. In the Stripe dashboard, save the Customer Portal's settings once (test mode too): until
   then, Stripe refuses to open it.
3. Gate a paid feature in the Worker on \`(await billingStore.getBilling(env, request)).active\`,
   never on what the page shows.

- \`worker/billing.ts\` — the subscription names its user in its metadata, which only the
  Worker sets (\`client_reference_id\` can be set by a buyer on a Payment Link). Every
  subscription event is read back from Stripe before it is stored, because events arrive out of
  order, and a late event about an older subscription cannot end a live one.
- Back from checkout, \`/billing\` reads the session and its subscription at once, so it is right
  before the webhook arrives, and only for the user the subscription names.`
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
  them one by one through \`createSes\` (\`@cascivo/app/ses\`), one message at a time. Each
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
    opts.auth === 'email'
      ? `

## Accounts (email sign-in)

Anyone can create an account with their email address: \`/account\` emails a one-time link,
and opening it signs them in with a session cookie. **Every API write needs a signed-in
user; reads stay public.**

- \`worker/index.ts\` — \`handleAuth\` (\`@cascivo/app/auth-server\`) answers \`/api/auth/*\`, and
  \`requireUser\` refuses any other write without a session (401) or from another site (403).
  Call \`requireUser(env.DB, request)\` in a handler to know who is asking.
- \`worker/auth.ts\` — sends the link through Email Service. Set \`AUTH_FROM\` in
  \`wrangler.jsonc\` to an address on a domain you have onboarded to Email Service.
- \`src/auth.ts\` — \`auth.user\`, a signal every page can read.
- \`src/routes/signin/verify.tsx\` — the page a link opens. It signs in on a button press,
  because mail scanners open every link in a message.

Users, links and sessions live in D1, stored as hashes. Links expire after 15 minutes and
work once; sessions last 30 days. Each caller (by IP) may request 20 links a minute. In
\`vite dev\` no email is sent: the Account page shows the link instead. WebSocket connections
(rooms, agents) are not covered by the write rule; check \`currentUser\` before forwarding them
if they need a user.`
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
  }
}

function buildCloudflareScaffold(opts: ScaffoldOptions, sections: Section[]): ScaffoldFile[] {
  const runtime = runtimeOf(opts)
  const routeFiles = [
    ...sections.map((s, i) => ({
      file: cfSectionFile(s, i),
      contents: i === 0 ? cfFirstRouteTsx(s) : cfRouteTsx(s, i),
    })),
    { file: '404.tsx', contents: cf404Tsx() },
    ...(hasExample(opts, 'agent')
      ? [{ file: 'assistant.tsx', contents: cfAssistantRouteTsx() }]
      : []),
    ...(hasExample(opts, 'board') ? [{ file: 'board.tsx', contents: cfBoardRouteTsx() }] : []),
    ...(hasExample(opts, 'notes') ? [{ file: 'notes.tsx', contents: cfNotesRouteTsx() }] : []),
    ...(hasExample(opts, 'import') ? [{ file: 'import.tsx', contents: cfImportRouteTsx() }] : []),
    ...(hasExample(opts, 'files') ? [{ file: 'files.tsx', contents: cfFilesRouteTsx() }] : []),
    ...(hasExample(opts, 'export') ? [{ file: 'report.tsx', contents: cfReportRouteTsx() }] : []),
    ...(hasExample(opts, 'usage') ? [{ file: 'usage.tsx', contents: cfUsageRouteTsx() }] : []),
    ...(hasExample(opts, 'crud')
      ? [{ file: 'customers.tsx', contents: cfCustomersRouteTsx() }]
      : []),
    ...(hasExample(opts, 'live') ? [{ file: 'ops.tsx', contents: cfOpsRouteTsx() }] : []),
    ...(hasExample(opts, 'voice') ? [{ file: 'voice.tsx', contents: cfVoiceRouteTsx() }] : []),
    ...(hasExample(opts, 'publish')
      ? [
          { file: 'publish.tsx', contents: cfPublishRouteTsx() },
          { file: 'p/[slug].tsx', contents: cfPageRouteTsx() },
        ]
      : []),
    ...(hasExample(opts, 'webhooks')
      ? [{ file: 'webhooks.tsx', contents: cfWebhooksRouteTsx() }]
      : []),
    ...(hasExample(opts, 'digest') ? [{ file: 'digest.tsx', contents: cfDigestRouteTsx() }] : []),
    ...(hasExample(opts, 'search') ? [{ file: 'search.tsx', contents: cfSearchRouteTsx() }] : []),
    ...(hasExample(opts, 'checkout')
      ? [
          { file: 'checkout.tsx', contents: cfCheckoutRouteTsx() },
          { file: 'checkout/[order].tsx', contents: cfOrderRouteTsx() },
        ]
      : []),
    ...(usesBilling(opts) ? [{ file: 'billing.tsx', contents: cfBillingRouteTsx() }] : []),
    ...(hasExample(opts, 'newsletter')
      ? [
          { file: 'newsletter.tsx', contents: cfNewsletterRouteTsx() },
          { file: 'newsletter/confirm.tsx', contents: cfNewsletterConfirmRouteTsx() },
          { file: 'newsletter/unsubscribe.tsx', contents: cfNewsletterUnsubscribeRouteTsx() },
          { file: 'newsletter/send.tsx', contents: cfNewsletterSendRouteTsx() },
        ]
      : []),
    ...(opts.auth === 'email'
      ? [
          { file: 'account.tsx', contents: cfAccountRouteTsx() },
          { file: 'signin/verify.tsx', contents: cfVerifyRouteTsx() },
        ]
      : []),
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
    { path: 'src/live.ts', contents: cfLiveTs() },
    { path: 'src/LiveCard.tsx', contents: cfLiveCardTsx() },
    { path: 'src/main.tsx', contents: cfMainTsx() },
    { path: 'src/vite-env.d.ts', contents: viteEnv() },
    { path: 'src/router.ts', contents: cfRouterTs() },
    { path: 'src/App.tsx', contents: cfAppTsx(sections, opts) },
    { path: 'src/Shell.tsx', contents: cfShellTsx(opts) },
    ...(hasExample(opts, 'agent')
      ? [
          { path: 'worker/assistant.ts', contents: cfAssistantWorkerTs() },
          { path: 'worker/scripted-model.ts', contents: cfScriptedModelTs() },
          { path: 'src/assistant.ts', contents: cfAssistantTs() },
          { path: 'src/assistant.module.css', contents: cfAssistantCss() },
        ]
      : []),
    ...(hasExample(opts, 'notes') ? [{ path: 'src/notes.ts', contents: cfNotesTs() }] : []),
    ...(hasExample(opts, 'import')
      ? [
          { path: 'src/import-job.ts', contents: cfImportJobTs() },
          { path: 'src/import-page.ts', contents: cfImportPageTs() },
          { path: 'worker/import-job.ts', contents: cfImportWorkflowTs() },
        ]
      : []),
    ...(hasExample(opts, 'crud')
      ? [
          { path: 'src/customers.ts', contents: cfCustomersTs() },
          { path: 'src/customers-page.ts', contents: cfCustomersPageTs() },
          { path: 'worker/customers.ts', contents: cfCustomersWorkerTs() },
          { path: 'worker/migrations.ts', contents: cfMigrationsTs() },
        ]
      : []),
    ...(hasExample(opts, 'live') ? [{ path: 'src/ops.ts', contents: cfOpsTs() }] : []),
    ...(hasExample(opts, 'search')
      ? [
          { path: 'src/search.ts', contents: cfSearchTs() },
          { path: 'worker/search.ts', contents: cfSearchWorkerTs() },
          { path: 'worker/articles.ts', contents: cfArticlesTs() },
        ]
      : []),
    ...(hasExample(opts, 'digest')
      ? [
          { path: 'src/digest.ts', contents: cfDigestTs() },
          { path: 'worker/digest.ts', contents: cfDigestWorkerTs() },
        ]
      : []),
    ...(hasExample(opts, 'webhooks')
      ? [
          { path: 'src/webhooks.ts', contents: cfWebhooksTs() },
          { path: 'worker/webhooks.ts', contents: cfWebhooksWorkerTs() },
        ]
      : []),
    ...(hasExample(opts, 'checkout')
      ? [
          { path: 'src/checkout.ts', contents: cfCheckoutTs(opts) },
          { path: 'worker/checkout.ts', contents: cfCheckoutWorkerTs() },
        ]
      : []),
    ...(usesBilling(opts)
      ? [
          { path: 'src/billing.ts', contents: cfBillingTs() },
          { path: 'worker/billing.ts', contents: cfBillingWorkerTs() },
        ]
      : []),
    ...(hasExample(opts, 'newsletter')
      ? [
          { path: 'src/newsletter.ts', contents: cfNewsletterTs() },
          { path: 'worker/newsletter.ts', contents: cfNewsletterWorkerTs() },
          { path: 'worker/newsletter-email.ts', contents: cfNewsletterEmailTs(opts) },
        ]
      : []),
    ...(hasExample(opts, 'webhooks') ||
    hasExample(opts, 'checkout') ||
    hasExample(opts, 'newsletter')
      ? [
          { path: '.dev.vars', contents: cfDevVars(opts) },
          { path: '.dev.vars.example', contents: cfDevVarsExample(opts) },
        ]
      : []),
    ...(opts.auth === 'email'
      ? [
          { path: 'src/auth.ts', contents: cfAuthTs() },
          { path: 'worker/auth.ts', contents: cfAuthWorkerTs() },
        ]
      : []),
    ...(hasExample(opts, 'publish')
      ? [
          { path: 'src/pages.ts', contents: cfPagesTs() },
          { path: 'worker/pages.ts', contents: cfPagesWorkerTs() },
          { path: 'worker/page-html.ts', contents: cfPageHtmlTs() },
          ...(hasExample(opts, 'export')
            ? [{ path: 'worker/page-preview.ts', contents: cfPagePreviewTs() }]
            : []),
        ]
      : []),
    ...(hasExample(opts, 'voice')
      ? [
          { path: 'src/voice.ts', contents: cfVoiceTs() },
          { path: 'worker/voice.ts', contents: cfVoiceWorkerTs() },
          { path: 'worker/scripted-voice.ts', contents: cfScriptedVoiceTs() },
        ]
      : []),
    ...(hasExample(opts, 'usage')
      ? [
          {
            path: 'src/usage.ts',
            contents: cfUsageTs().replace(
              "dataset: 'app_usage'",
              `dataset: '${usageDataset(opts)}'`,
            ),
          },
          { path: 'worker/usage.ts', contents: cfUsageWorkerTs() },
        ]
      : []),
    ...(hasExample(opts, 'files')
      ? [
          { path: 'src/upload-policy.ts', contents: cfUploadPolicyTs() },
          { path: 'src/files.ts', contents: cfFilesTs() },
          { path: 'src/files.module.css', contents: cfFilesCss() },
        ]
      : []),
    ...(hasExample(opts, 'board')
      ? [
          { path: 'src/board.ts', contents: cfBoardTs() },
          { path: 'src/board.module.css', contents: cfBoardCss() },
        ]
      : []),
    ...routeFiles.map(({ file, contents }) => ({ path: `src/routes/${file}`, contents })),
    // Written now so \`tsc\` passes before the first \`vite\` run; the plugin keeps it current.
    {
      path: 'src/routes.gen.ts',
      contents: generateRoutes(
        routeFiles.map((r) => r.file),
        './routes',
      ),
    },
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
    return buildCloudflareScaffold({ ...opts, ...(examples ? { examples } : {}) }, sections)
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

  const authArg = (flagValue(args, 'auth') ?? '').toLowerCase()
  if (authArg && authArg !== 'access' && authArg !== 'email') {
    console.error(`Unknown auth "${authArg}". Expected: access or email.`)
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
      ...(authArg === 'access' || authArg === 'email' ? { auth: authArg } : {}),
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
