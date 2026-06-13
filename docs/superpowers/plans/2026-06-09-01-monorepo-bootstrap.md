# Cascade — Plan 1: Monorepo Bootstrap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full cascade monorepo structure with pnpm workspaces, vite+ toolchain, shared TypeScript config, and placeholder packages — so that `vp check` and `vp run -r build` pass cleanly.

**Architecture:** pnpm workspaces define the package graph; `vp run` (backed by Vite Task) orchestrates tasks with automatic file-hash caching. A single root `vite.config.ts` configures lint (Oxlint), format (Oxfmt), and task caching for the entire repo. Each library package has its own `vite.config.ts` for `vp pack`. Apps have their own for `vp build`/`vp dev`.

**Tech Stack:** pnpm workspaces, vite+ (`vp` CLI, v0.1.24), TypeScript 5.x strict, React 18+ peer deps, @preact/signals-react. All dependency versions come from the pnpm catalog defined in `pnpm-workspace.yaml`.

---

## File Map

```
cascade/                              ← repo root (already exists as native-ui)
├── package.json                      CREATE — root workspace, task scripts
├── pnpm-workspace.yaml               CREATE — workspace globs + catalog + vite/vitest overrides
├── vite.config.ts                    CREATE — root vite+ config (lint, fmt, run cache)
├── tsconfig.base.json                CREATE — strict base TS config all packages extend
├── .gitignore                        UPDATE — add dist/, .vp-cache/, etc.
├── .npmrc                            CREATE — pnpm settings
├── packages/
│   ├── core/
│   │   ├── package.json              CREATE — @cascade-ui/core
│   │   ├── vite.config.ts            CREATE — library pack config
│   │   ├── tsconfig.json             CREATE — extends tsconfig.base.json
│   │   └── src/
│   │       ├── index.ts              CREATE — placeholder export
│   │       └── index.test.ts         CREATE — smoke test
│   ├── tokens/
│   │   ├── package.json              CREATE — @cascade-ui/tokens (CSS only, no build)
│   │   └── src/
│   │       └── index.css             CREATE — placeholder
│   ├── themes/
│   │   ├── package.json              CREATE — @cascade-ui/themes (CSS only, no build)
│   │   └── src/
│   │       ├── light.css             CREATE — placeholder
│   │       ├── dark.css              CREATE — placeholder
│   │       └── warm.css              CREATE — placeholder
│   ├── components/
│   │   └── package.json              CREATE — private registry source, never published
│   ├── icons/
│   │   ├── package.json              CREATE — @cascade-ui/icons placeholder
│   │   ├── vite.config.ts            CREATE — library pack config
│   │   ├── tsconfig.json             CREATE
│   │   └── src/
│   │       ├── index.ts              CREATE — placeholder
│   │       └── index.test.ts         CREATE — smoke test
│   ├── cli/
│   │   ├── package.json              CREATE — cascade CLI placeholder
│   │   ├── vite.config.ts            CREATE — library pack config
│   │   ├── tsconfig.json             CREATE
│   │   └── src/
│   │       ├── index.ts              CREATE — placeholder
│   │       └── index.test.ts         CREATE — smoke test
│   └── mcp/
│       ├── package.json              CREATE — @cascade-ui/mcp placeholder
│       ├── vite.config.ts            CREATE — library pack config
│       ├── tsconfig.json             CREATE
│       └── src/
│           ├── index.ts              CREATE — placeholder
│           └── index.test.ts         CREATE — smoke test
├── apps/
│   ├── docs/
│   │   └── package.json              CREATE — @cascade-ui/docs placeholder
│   ├── storybook/
│   │   └── package.json              CREATE — @cascade-ui/storybook placeholder
│   ├── landing/
│   │   └── package.json              CREATE — @cascade-ui/landing placeholder
│   └── examples/
│       ├── react-vite/
│       │   └── package.json          CREATE — @cascade-ui/example-react-vite placeholder
│       └── react-next/
│           └── package.json          CREATE — @cascade-ui/example-react-next placeholder
├── skills/
│   └── README.md                     CREATE — skills directory placeholder
├── registry.json                     CREATE — empty component registry
└── factory-backlog.json              CREATE — empty dark factory queue
```

---

## Task 1: Root workspace files

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `vite.config.ts`
- Create: `tsconfig.base.json`
- Create: `.npmrc`
- Modify: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "cascade",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vp run -r build",
    "test": "vp run -r test",
    "check": "vp check",
    "dev:docs": "vp run @cascade-ui/docs#dev",
    "dev:landing": "vp run @cascade-ui/landing#dev",
    "ready": "vp check && vp run -r test && vp run -r build"
  },
  "devDependencies": {
    "vite-plus": "catalog:"
  },
  "engines": {
    "node": ">=22.12.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

The `catalog:` entries define the canonical version for every shared dep. Packages reference them as `"react": "catalog:"` to guarantee version consistency. The `overrides` block ensures any transitive dep on `vite` or `vitest` resolves to the vite+ versions.

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'apps/examples/*'

catalogMode: prefer

catalog:
  '@types/node': ^24
  '@types/react': ^18
  '@types/react-dom': ^18
  '@preact/signals-react': ^2
  preact: ^10
  react: ^18
  react-dom: ^18
  typescript: ^5
  vite-plus: ^0.1.24

overrides:
  vite: 'npm:@voidzero-dev/vite-plus-core@latest'
  vitest: 'npm:@voidzero-dev/vite-plus-test@latest'
```

- [ ] **Step 3: Create root `vite.config.ts`**

This is the single config file for lint, format, and task caching across the entire monorepo. Individual packages have their own `vite.config.ts` for build/test specifics.

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    cache: true,
  },
  lint: {
    ignorePatterns: ['dist/**', 'node_modules/**', '*.d.ts', 'pnpm-lock.yaml'],
  },
  fmt: {
    semi: false,
    singleQuote: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
})
```

- [ ] **Step 4: Create `tsconfig.base.json`**

All package-level `tsconfig.json` files extend this. The `noEmit: true` here is intentional — individual packages set `"noEmit": false` and configure their own `outDir`.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

- [ ] **Step 5: Create `.npmrc`**

```ini
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
```

- [ ] **Step 6: Update `.gitignore`**

Add to the existing `.gitignore` (create it if missing):

```gitignore
# Dependencies
node_modules/

# Build output
dist/
*.d.ts.map

# Tooling cache
.vp-cache/
.turbo/
*.tsbuildinfo

# Environment
.env
.env.local

# Editor
.DS_Store

# Brainstorm sessions (already ignored, confirm it's here)
.superpowers/
```

---

## Task 2: Library package scaffolding

**Files:** All files under `packages/core/`, `packages/tokens/`, `packages/themes/`, `packages/components/`, `packages/icons/`, `packages/cli/`, `packages/mcp/`

The pattern for TypeScript library packages is:

- `package.json` with `"build": "vp pack"` and `"test": "vp test"`
- `vite.config.ts` with `lib` entry config for `vp pack`
- `tsconfig.json` extending `../../tsconfig.base.json` with `"noEmit": false`
- `src/index.ts` with a placeholder export
- `src/index.test.ts` with a smoke test

CSS-only packages (tokens, themes) have no build step — they export source CSS files directly.

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@cascade-ui/core",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test",
    "dev": "vp pack --watch"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "@preact/signals-react": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 2: Create `packages/core/vite.config.ts`**

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@preact/signals-react'],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `packages/core/src/index.ts`**

```ts
export const VERSION = '0.0.0'
```

- [ ] **Step 5: Create `packages/core/src/index.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('@cascade-ui/core', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
```

- [ ] **Step 6: Create `packages/tokens/package.json`**

CSS-only package — no TypeScript, no build step. Exports are raw CSS files.

```json
{
  "name": "@cascade-ui/tokens",
  "version": "0.0.0",
  "private": false,
  "exports": {
    ".": "./src/index.css"
  },
  "scripts": {
    "build": "echo 'tokens: CSS-only, no build'",
    "test": "echo 'tokens: no tests yet'"
  }
}
```

- [ ] **Step 7: Create `packages/tokens/src/index.css`**

```css
/* @cascade-ui/tokens — placeholder until Plan 2 */
:root {
  --cascivo-version: '0.0.0';
}
```

- [ ] **Step 8: Create `packages/themes/package.json`**

```json
{
  "name": "@cascade-ui/themes",
  "version": "0.0.0",
  "private": false,
  "exports": {
    "./light": "./src/light.css",
    "./dark": "./src/dark.css",
    "./warm": "./src/warm.css"
  },
  "scripts": {
    "build": "echo 'themes: CSS-only, no build'",
    "test": "echo 'themes: no tests yet'"
  },
  "peerDependencies": {
    "@cascade-ui/tokens": "workspace:*"
  }
}
```

- [ ] **Step 9: Create placeholder theme CSS files**

Create `packages/themes/src/light.css`:

```css
/* @cascade-ui/themes/light — placeholder until Plan 2 */
[data-theme='light'] {
  color-scheme: light;
}
```

Create `packages/themes/src/dark.css`:

```css
/* @cascade-ui/themes/dark — placeholder until Plan 2 */
[data-theme='dark'] {
  color-scheme: dark;
}
```

Create `packages/themes/src/warm.css`:

```css
/* @cascade-ui/themes/warm — placeholder until Plan 2 */
[data-theme='warm'] {
  color-scheme: light;
}
```

- [ ] **Step 10: Create `packages/components/package.json`, `vite.config.ts`, `tsconfig.json`, and placeholder `src/`**

Private — never published. This is the registry source only. Needs `vite.config.ts` for `vp test` (components are React components requiring jsdom) and a `tsconfig.json` so TypeScript finds source files in Plan 3.

`packages/components/package.json`:

```json
{
  "name": "@cascade-ui/components",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "echo 'components: registry source — no npm build'",
    "test": "vp test"
  },
  "devDependencies": {
    "@cascade-ui/core": "workspace:*",
    "@cascade-ui/tokens": "workspace:*",
    "@types/react": "catalog:",
    "react": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

`packages/components/vite.config.ts`:

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
```

`packages/components/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

`packages/components/src/.gitkeep`: create an empty file so the `src/` directory is tracked in git. Component source files are added in Plan 3.

- [ ] **Step 11: Create `packages/icons/package.json`, `vite.config.ts`, `tsconfig.json`, `src/index.ts`, `src/index.test.ts`**

`packages/icons/package.json`:

```json
{
  "name": "@cascade-ui/icons",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "react": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

`packages/icons/vite.config.ts`:

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react'],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
```

`packages/icons/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`packages/icons/src/index.ts`:

```ts
export const VERSION = '0.0.0'
```

`packages/icons/src/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('@cascade-ui/icons', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
```

- [ ] **Step 12: Create `packages/cli/package.json`, `vite.config.ts`, `tsconfig.json`, `src/index.ts`, `src/index.test.ts`**

`packages/cli/package.json`:

```json
{
  "name": "cascade",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "bin": {
    "cascade": "./dist/index.js"
  },
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test",
    "dev": "vp pack --watch"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

`packages/cli/vite.config.ts`:

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^node:/],
    },
  },
  test: {
    environment: 'node',
  },
})
```

`packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`packages/cli/src/index.ts`:

```ts
export const VERSION = '0.0.0'
```

`packages/cli/src/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('cascade CLI', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
```

- [ ] **Step 13: Create `packages/mcp/package.json`, `vite.config.ts`, `tsconfig.json`, `src/index.ts`, `src/index.test.ts`**

`packages/mcp/package.json`:

```json
{
  "name": "@cascade-ui/mcp",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

`packages/mcp/vite.config.ts`:

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^node:/],
    },
  },
  test: {
    environment: 'node',
  },
})
```

`packages/mcp/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`packages/mcp/src/index.ts`:

```ts
export const VERSION = '0.0.0'
```

`packages/mcp/src/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('@cascade-ui/mcp', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
```

---

## Task 3: App package scaffolding

**Files:** `apps/docs/`, `apps/storybook/`, `apps/landing/`, `apps/examples/react-vite/`, `apps/examples/react-next/`

App packages have no `vp pack` — they use `vp build` / `vp dev`. Plan 7 (docs) and later plans will add the actual app source. For now, placeholder `package.json` files establish the workspace graph.

- [ ] **Step 1: Create `apps/docs/package.json`**

```json
{
  "name": "@cascade-ui/docs",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp preview",
    "test": "echo 'docs: no tests yet'"
  },
  "dependencies": {
    "@cascade-ui/core": "workspace:*",
    "@cascade-ui/tokens": "workspace:*",
    "@cascade-ui/themes": "workspace:*",
    "preact": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 2: Create `apps/storybook/package.json`**

```json
{
  "name": "@cascade-ui/storybook",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "echo 'storybook: configured in Plan 8'",
    "build": "echo 'storybook: configured in Plan 8'",
    "test": "echo 'storybook: no tests yet'"
  },
  "dependencies": {
    "@cascade-ui/components": "workspace:*"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 3: Create `apps/landing/package.json`**

```json
{
  "name": "@cascade-ui/landing",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp preview",
    "test": "echo 'landing: no tests yet'"
  },
  "dependencies": {
    "@cascade-ui/core": "workspace:*",
    "@cascade-ui/tokens": "workspace:*",
    "@cascade-ui/themes": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 4: Create `apps/examples/react-vite/package.json`**

```json
{
  "name": "@cascade-ui/example-react-vite",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "test": "echo 'example: no tests yet'"
  },
  "dependencies": {
    "@cascade-ui/core": "workspace:*",
    "@cascade-ui/tokens": "workspace:*",
    "@cascade-ui/themes": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 5: Create `apps/examples/react-next/package.json`**

```json
{
  "name": "@cascade-ui/example-react-next",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "echo 'next example: no tests yet'"
  },
  "dependencies": {
    "@cascade-ui/core": "workspace:*",
    "@cascade-ui/tokens": "workspace:*",
    "@cascade-ui/themes": "workspace:*",
    "next": "latest",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

---

## Task 4: Registry, factory, and skills placeholders

**Files:** `registry.json`, `factory-backlog.json`, `skills/README.md`

- [ ] **Step 1: Create `registry.json`**

```json
{
  "version": "0.0.0",
  "generatedAt": "2026-06-09",
  "components": []
}
```

- [ ] **Step 2: Create `factory-backlog.json`**

```json
{
  "queue": [
    {
      "name": "button",
      "category": "inputs",
      "priority": 1,
      "spec": "Primary interactive element. Supports variants (primary, secondary, ghost, destructive), sizes (sm, md, lg), loading state, disabled state, and optional leading/trailing icons. Keyboard: Enter, Space. Role: button.",
      "status": "pending"
    },
    {
      "name": "input",
      "category": "inputs",
      "priority": 2,
      "spec": "Text input field. Supports label, helper text, error state, disabled state, leading/trailing adornments. Fully controlled and uncontrolled modes.",
      "status": "pending"
    },
    {
      "name": "modal",
      "category": "overlay",
      "priority": 3,
      "spec": "Dialog overlay using native <dialog> element. Controlled open/close. Focus trap. Backdrop click to dismiss. Keyboard: Escape to close.",
      "status": "pending"
    },
    {
      "name": "card",
      "category": "display",
      "priority": 4,
      "spec": "Container component. Optional header, body, footer sections. Supports hover/interactive variant.",
      "status": "pending"
    },
    {
      "name": "badge",
      "category": "display",
      "priority": 5,
      "spec": "Inline label for status, count, or category. Variants: default, success, warning, error, info. Sizes: sm, md.",
      "status": "pending"
    }
  ]
}
```

- [ ] **Step 3: Create `skills/README.md`**

````markdown
# Cascade Claude Code Skills

Claude Code skills for working with the cascade design system.

## Available Skills

| Skill                  | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `cascade:add`          | Add a component to your project with customization guidance |
| `cascade:design-page`  | Generate a page layout using cascade components             |
| `cascade:create-theme` | Create a custom theme from your brand colors                |
| `cascade:extend`       | Extend or fork an existing component                        |

## Installation

Add the `skills/` directory from this repository to your Claude Code skills path:

```json
// ~/.claude/settings.json
{
  "skills": ["/path/to/cascade/skills"]
}
```
````

Skills are implemented in Plans 5–6 alongside the MCP server and CLI.

````

---

## Task 5: Install and verify

- [ ] **Step 1: Install all dependencies**

```bash
vp install
````

Expected: pnpm resolves all workspace packages and installs dependencies. No errors. A `pnpm-lock.yaml` is created at the root.

- [ ] **Step 2: Verify TypeScript config resolves**

```bash
vp check
```

Expected: `vp check` runs Oxfmt, Oxlint, and tsc across all packages. It may report formatting issues on the freshly created files — run `vp fmt` to auto-fix, then re-run `vp check`.

If tsc fails with "cannot find module 'vite-plus'" in a package's `vite.config.ts`, that package is missing `"vite-plus": "catalog:"` in its `devDependencies`. Fix and re-run `vp install`.

- [ ] **Step 3: Run all tests**

```bash
vp run -r test
```

Expected: smoke tests pass in `packages/core`, `packages/icons`, `packages/cli`, `packages/mcp`. CSS-only packages and apps echo their placeholder messages. All exit 0.

- [ ] **Step 4: Run all builds**

```bash
vp run -r build
```

Expected: `vp pack` runs for core, icons, cli, mcp — each producing a `dist/index.js` and `dist/index.d.ts`. CSS packages and apps echo their placeholder messages. All exit 0.

- [ ] **Step 5: Verify caching works**

Run the build a second time immediately:

```bash
vp run -r build
```

Expected: all tasks complete instantly with cache hits. Output should indicate tasks were restored from cache (look for "cache hit" or near-instant completion).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold cascade monorepo with vite+ and pnpm workspaces"
```

---

## Troubleshooting

**`vp` not found:** The global install is at `~/.vite-plus/0.1.24/bin/vp`. Add `~/.vite-plus/0.1.24/bin` to `PATH`, or run commands as `~/.vite-plus/0.1.24/bin/vp <cmd>`.

**`catalog:` not resolving:** Requires pnpm 9+. Check `pnpm --version`. If older, update pnpm first.

**`@voidzero-dev/vite-plus-core` not found:** The vite/vitest overrides in `pnpm-workspace.yaml` point to vite+ internal packages. These must be present in the vite+ install. If resolution fails, remove the `overrides` block temporarily and re-add after confirming base install works.

**`exactOptionalPropertyTypes` errors:** Some generated `.d.ts` files from vite+ internals may fail under this flag. If tsc errors point to `node_modules`, ensure `"skipLibCheck": true` is in `tsconfig.base.json`.
