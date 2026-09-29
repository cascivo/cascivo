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
export type Example = 'board'

export const EXAMPLES = ['board'] as const

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
  /** Client runtime for the `cloudflare` framework. Defaults to `preact`. */
  runtime?: Runtime
  /** Extra demo pages for the `cloudflare` framework. */
  examples?: Example[]
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
  return JSON.stringify(cfg, null, 2) + '\n'
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
    <AppShell
      header={<ShellHeader brand={{ name: '${brandName(opts.name).replace(/'/g, "\\'")}' }} />}
      nav={<SideNav items={navItems} />}
    >
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
    <AppShell
      header={<ShellHeader brand={{ name: '${brandName(opts.name).replace(/'/g, "\\'")}' }} />}
      nav={<SideNav items={items} />}
    >
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
  const preact = (opts.runtime ?? 'preact') === 'preact'
  const pkg = {
    name: packageName(opts.name),
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      deploy: `${runScriptCommand(pm, 'build')} && wrangler deploy`,
      // No account: a temporary one, live for 60 minutes unless claimed (see README).
      'deploy:preview': `${runScriptCommand(pm, 'build')} && wrangler deploy --temporary`,
      typecheck: 'tsc --noEmit',
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
    },
    devDependencies: {
      '@cascivo/eslint-config': V['@cascivo/eslint-config']!,
      '@cloudflare/vite-plugin': '^1.62.0',
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
  return JSON.stringify(pkg, null, 2) + '\n'
}

function cfTsconfig(): string {
  const cfg = JSON.parse(tsconfig()) as { include: string[] }
  // `worker/` is type-checked with the app: it imports `src/protocol.ts`, and a protocol
  // change should fail `tsc` on whichever side was not updated.
  cfg.include = ['src', 'worker']
  return JSON.stringify(cfg, null, 2) + '\n'
}

function cfViteConfig(runtime: Runtime): string {
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
// client, so dev and production execute the same runtime. Request routing is in wrangler.jsonc.
export default defineConfig({
  plugins: [${call}, cascivoRoutes(), cloudflare()],
})
`
}

function wranglerJsonc(opts: ScaffoldOptions): string {
  return `// Cloudflare deploy config. \`${runExplicitCommand(opts.pm ?? 'npm', 'deploy')}\` builds and ships the SPA and
// the Worker together. https://developers.cloudflare.com/workers/wrangler/configuration/
{
  "name": "${packageName(opts.name)}",
  "main": "./worker/index.ts",
  "compatibility_date": "${COMPATIBILITY_DATE}",
  "assets": {
    // Client-side app: an unknown path serves index.html, and the client renders it.
    "not_found_handling": "single-page-application",
    // Only the API reaches the Worker; static assets are served without invoking it.
    "run_worker_first": ["/api/*"]
  },
  "observability": { "enabled": true }${
    hasExample(opts, 'board')
      ? `,
  // One SyncRoom Durable Object per board room (@cascivo/app/sync-server).
  "durable_objects": { "bindings": [{ "name": "ROOMS", "class_name": "SyncRoom" }] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["SyncRoom"] }]`
      : ''
  }
  // Add bindings here (KV, D1, R2, Durable Objects, Workers AI) and read them from the
  // \`env\` argument of the Worker's fetch handler.
}
`
}

function hasExample(opts: ScaffoldOptions, example: Example): boolean {
  return opts.examples?.includes(example) ?? false
}

function cfApiTs(): string {
  return `import { defineApi, stream } from '@cascivo/app/api'

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
  ticks: stream({ method: 'GET', path: '/api/ticks', event: parseTick }),
})
`
}

function cfWorkerTs(opts: ScaffoldOptions): string {
  const board = hasExample(opts, 'board')
  return `import { createHandler } from '@cascivo/app/api'
${
  board
    ? `import { roomResponse } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
`
    : ''
}import { api, TICKS_PER_STREAM } from '../src/api'
import type { Tick } from '../src/api'
${
  board
    ? `
// The Durable Object class behind /board. wrangler.jsonc binds it as ROOMS, and it must be
// exported from the Worker's main module.
export { SyncRoom } from '@cascivo/app/sync-server'
`
    : ''
}
/**
 * Add bindings (KV, D1, R2, Durable Objects, Workers AI) in wrangler.jsonc and type them
 * here; every handler receives them as \`env\`.
 */
export interface Env {${board ? '\n  ROOMS: RoomNamespace<unknown>\n' : ''}}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
  },
})

// wrangler.jsonc routes only /api/* here; everything else is a static asset or index.html.
export default {
${
  board
    ? `  fetch(request: Request, env: Env): Promise<Response> | Response {
    const room = /^\\/api\\/rooms\\/([^/]+)$/.exec(new URL(request.url).pathname)
    if (room) return roomResponse(request, env.ROOMS, room[1]!)
    return handleApi(request, env)
  },`
    : '  fetch: handleApi,'
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
            <code>worker/index.ts</code> streams events; <code>src/live.ts</code> reads them
            through the typed client for <code>src/api.ts</code>.
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
            <Button variant={live ? 'secondary' : 'primary'} onClick={live ? disconnect : () => void connect()}>
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
  if (hasExample(opts, 'board')) items.push({ label: 'Board', href: '/board' })
  const navItems = items
    .map(
      (item) => `    {
      label: '${item.label.replace(/'/g, "\\'")}',
      href: '${item.href}',
      active: path === '${item.href}',
    },`,
    )
    .join('\n')
  return `import { RouterView } from '@cascivo/app'
import { Spinner, useSignals, type SideNavItem } from '@cascivo/react'
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
import { Badge, Button, Card, CardContent, Flex, Heading, Text, Textarea, useSignals } from '@cascivo/react'
import { addNote, notes, parseCursor, room, roomName } from '../board'
import type { Note } from '../board'
import styles from '../board.module.css'

let frame = 0

/** Shares this pointer's position on the board, at most once per frame. */
function trackCursor(event: PointerEvent<HTMLDivElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  const cursor = { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) }
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
    if (current) notes.set(id, { ...current, x: Math.max(0, e.clientX - dx), y: Math.max(0, e.clientY - dy) })
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
          <Button size="sm" variant="ghost" aria-label="Delete note" onClick={() => notes.delete(id)}>
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
    user-select: none;
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
*.local
.DS_Store
`
}

function cfReadme(opts: ScaffoldOptions): string {
  const pm = opts.pm ?? 'npm'
  const runtime = opts.runtime ?? 'preact'
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
support Workers AI or R2.

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
  }

Add more components with \`npx cascivo add <component>\`.

## ${runtime === 'preact' ? 'Preact or React' : 'React or Preact'}

The source is typed against React. The runtime is one plugin in \`vite.config.ts\`:
\`@preact/preset-vite\` runs it on Preact, \`@vitejs/plugin-react\` on React. Switching
needs no source changes; swap the plugin and the matching dependencies. For this starter,
Preact ships about a third of the client JS (~27 KB gzip against ~85 KB).
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

function buildCloudflareScaffold(opts: ScaffoldOptions, sections: Section[]): ScaffoldFile[] {
  const runtime = opts.runtime ?? 'preact'
  const routeFiles = [
    ...sections.map((s, i) => ({
      file: cfSectionFile(s, i),
      contents: i === 0 ? cfFirstRouteTsx(s) : cfRouteTsx(s, i),
    })),
    { file: '404.tsx', contents: cf404Tsx() },
    ...(hasExample(opts, 'board') ? [{ file: 'board.tsx', contents: cfBoardRouteTsx() }] : []),
  ]
  return [
    { path: 'package.json', contents: cfPackageJson(opts) },
    { path: 'tsconfig.json', contents: cfTsconfig() },
    { path: 'vite.config.ts', contents: cfViteConfig(runtime) },
    { path: 'wrangler.jsonc', contents: wranglerJsonc(opts) },
    { path: 'index.html', contents: indexHtml(opts) },
    { path: 'eslint.config.js', contents: eslintConfig() },
    { path: '.prettierrc', contents: prettierrc() },
    { path: '.prettierignore', contents: cfPrettierIgnore() },
    { path: '.gitignore', contents: cfGitignore() },
    { path: 'README.md', contents: cfReadme(opts) },
    { path: 'AGENTS.md', contents: cfAgentsMd(opts) },
    { path: 'worker/index.ts', contents: cfWorkerTs(opts) },
    { path: 'src/api.ts', contents: cfApiTs() },
    { path: 'src/live.ts', contents: cfLiveTs() },
    { path: 'src/LiveCard.tsx', contents: cfLiveCardTsx() },
    { path: 'src/main.tsx', contents: cfMainTsx() },
    { path: 'src/vite-env.d.ts', contents: viteEnv() },
    { path: 'src/router.ts', contents: cfRouterTs() },
    { path: 'src/App.tsx', contents: cfAppTsx(sections, opts) },
    { path: 'src/Shell.tsx', contents: cfShellTsx(opts) },
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
  if (opts.framework === 'cloudflare') return buildCloudflareScaffold(opts, sections)
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

    const opts: ScaffoldOptions = {
      name,
      framework: resolvedFramework,
      theme: resolvedTheme,
      sections: sections.length > 0 ? sections : DEFAULT_SECTIONS,
      pm,
      ...(isRuntime(runtimeArg) ? { runtime: runtimeArg } : {}),
      ...(exampleArgs.length > 0 ? { examples: exampleArgs.filter(isExample) } : {}),
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
