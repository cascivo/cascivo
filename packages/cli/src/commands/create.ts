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

export interface ScaffoldOptions {
  /** Project directory + package name. */
  name: string
  /** Theme imported in the entry CSS and set on `<html data-theme>`. */
  theme: ThemeName
  /** Display labels for the side-nav sections (one section component each). */
  sections: string[]
  /** Package manager for the generated README's commands (default npm). */
  pm?: PackageManager
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

function appTsx(opts: ScaffoldOptions, sections: Section[]): string {
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
`
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
export function buildScaffold(opts: ScaffoldOptions): ScaffoldFile[] {
  const sections = resolveSections(opts.sections)
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
    { path: 'src/App.tsx', contents: appTsx(opts, sections) },
    { path: 'src/Shell.tsx', contents: shellTsx(opts) },
    ...sections.map((s) => ({
      path: `src/sections/${s.component}.tsx`,
      contents: sectionTsx(s),
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
  ])[0]
  const themeArg = flagValue(args, 'theme')
  const sectionsArg = flagValue(args, 'sections')

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

    const opts: ScaffoldOptions = {
      name,
      theme: resolvedTheme,
      sections: sections.length > 0 ? sections : DEFAULT_SECTIONS,
      pm,
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

    console.log(`\nCreated ${name} with the ${resolvedTheme} theme (${files.length} files).`)

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
    console.log('\n  Adding a router? Keep src/Shell.tsx, delete src/App.tsx + src/sections/,')
    console.log('  and register your Link once with setLinkComponent — see')
    console.log('  https://cascivo.com/docs/using-with-a-router.md')
  } finally {
    rl?.close()
  }
}
