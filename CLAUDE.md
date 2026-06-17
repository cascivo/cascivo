# native-ui

## Part 1 — Behavioral Guidelines

### Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

## Part 2 — General Coding Quality

### Code Correctness

- Zero compiler/type errors. Always.
- Zero linting warnings. Always.
- All existing tests must pass after your changes.
- If you change behavior, update or add tests to cover it.

### Formatting & Linting

- Run the project's formatter and linter before considering any task complete.
- Never submit code that fails formatting or linting checks.
- Match the project's existing formatting configuration — do not override it.

### Testing

- Write tests for new functionality.
- Bug fixes must include a regression test.
- Don't delete or skip existing tests unless explicitly asked.
- Tests must be deterministic — no flaky assertions, no timing dependencies.

### Error Handling

- Handle errors at the appropriate level — don't swallow them silently.
- Provide actionable error messages that help debugging.
- Fail fast on invalid input — don't let bad data propagate.

### Security

- Never commit secrets, tokens, or credentials.
- Validate and sanitize all external input.
- Use parameterized queries for database access.
- Prefer established security libraries over hand-rolled solutions.

### Performance

- Consider performance implications of your changes.
- Avoid unnecessary allocations, copies, or iterations.
- Don't optimize prematurely — but don't write obviously slow code either.

### Documentation

- Update documentation when your changes affect public APIs or user-facing behavior.
- Code comments explain _why_, not _what_. The code itself should explain _what_.
- Don't add comments that merely restate the code.

### Pre-Completion Checklist

Before finishing any task, verify:

1. The project builds with zero warnings and zero errors.
2. Formatting and linting pass.
3. Type checking passes with zero errors.
4. All tests pass.

### Gate Before Committing

**All gates below must pass before committing.** No exceptions. If any fails, fix it before pushing — do not commit broken state.

Run the single command that covers everything:

```sh
pnpm ready
```

This runs: `pnpm regen` → `vp check --fix` → type check → tests → build. Commit any files that `regen` or `--fix` modified alongside your changes.

To reproduce individual CI steps:

```sh
# Format + lint (mirrors CI "Format + lint" step)
pnpm exec vp check

# Build all packages (mirrors CI "Build" step)
pnpm build

# Type check all packages (mirrors CI "Type check" step)
pnpm exec vp run -r check

# Tests (mirrors CI "Test" step)
pnpm test

# Drift check — regenerate and confirm no diff (mirrors CI "drift" job)
pnpm regen
pnpm exec vp check --fix
git diff --exit-code

# Breakpoint literal check (off-scale @media/@container widths)
pnpm breakpoint:check
```

All must exit 0. The drift check is especially important: regenerated artifacts must be committed if changed.

### Workspace package aliases — keep in sync

Several CI jobs build apps **without** a prior `pnpm build` step (perf, storybook deploy, landing deploy). When those apps import a workspace package whose `package.json` exports point to `./dist/`, Rolldown fails to resolve the import because no dist exists.

**Rule:** Every `@cascivo/*` package whose root export resolves to `./dist/` **must** have an explicit source alias in the vite config of every app that builds without a prior full build. Currently affected packages: `core`, `storage`, `i18n`, `ai`, `render`, `icons`.

The alias maps the package name to its TypeScript source entry so Rolldown can bundle it directly:

```ts
'@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
'@cascivo/icons':  resolve(root, 'packages/icons/src/index.tsx'),
```

**Checklist when adding a new `@cascivo/*` package or changing an existing package's exports:**

1. Check if the package's `package.json` `exports["."].import` points to `./dist/`.
2. If yes, add a source alias to **all** of the following:
   - `apps/docs/vite.config.ts`
   - `apps/landing/vite.config.ts`
   - `apps/storybook/.storybook/main.ts` (`viteFinal` alias block)
3. Verify each builds locally: `pnpm exec vp run @cascivo/docs#build @cascivo/landing#build @cascivo/storybook#build`

Packages that export source directly (components, layouts, charts, themes, tokens) do **not** need aliases — Rolldown resolves them via the `exports` map to their `.tsx`/`.css` source files.

---

## Part 3 — Cascade Design System: Architecture Reference

### Project Identity

- **Name**: cascivo / `@cascivo`
- **Tagline**: The CSS-native, signal-driven, AI-first React design system
- **Competitors**: shadcn/ui, IBM Carbon Design System
- **Core thesis**: Modern CSS + fine-grained signals + AI-native tooling = zero compromise on quality, performance, or developer experience

### Core Principles

1. **Simplicity** — adoption must be frictionless. No config hell, no wrapper components, no hidden magic.
2. **Owned code** — components are copy-pasted into user projects (shadcn model). Users own what they use.
3. **Modern CSS only** — `@layer`, `@container`, `:has()`, CSS custom properties. No Tailwind, no CSS-in-JS.
4. **Signal-driven** — custom micro-FSM + Preact Signals in `@cascivo/core`. No `useState`/`useContext` for component interactivity. Zero unnecessary re-renders.
5. **Beautiful by default** — three first-party themes (light, dark, warm). Theming via `data-theme` attribute + CSS custom properties. Scoped to any container.
6. **AI-first** — every component has a machine-readable manifest. MCP server, Claude Code skills, and auto-generated docs all derive from it.

### Dependency Policy

- Always use the **latest stable** version of every dependency (dev or runtime).
- Peer dependencies must be explicit and version-ranged (`>=18.0.0`).
- Runtime dependencies in `@cascivo/core`: none beyond `@preact/signals-react`.
- Dev tooling: use vite+ (`vp`) as the single CLI — it bundles Oxlint, Oxfmt, Rolldown, Vitest (all Rust-backed).
- vite+ is alpha (v0.1.24) — accepted risk. On `vp` breaking changes, check https://viteplus.dev before updating.

### Monorepo Structure

```
cascade/
├── packages/
│   ├── core/           # @cascivo/core — micro-FSM, Preact Signals integration, base utilities
│   ├── tokens/         # @cascivo/tokens — CSS design tokens (primitive → semantic → component)
│   ├── themes/         # @cascivo/themes — light.css, dark.css, warm.css
│   ├── components/     # Registry source — component TSX + CSS + manifest + tests (not published to npm)
│   ├── react/          # @cascivo/react — prebuilt npm distribution of all components (use without copying)
│   ├── i18n/           # @cascivo/i18n — signal-driven locale store, typed catalogs, Intl formatting
│   ├── storage/        # @cascivo/storage — persisted signals over localStorage/IndexedDB, SSR-safe
│   ├── icons/          # @cascivo/icons — optional SVG icon components
│   ├── cli/            # cascivo CLI — npx cascivo init / add / list / update
│   └── mcp/            # @cascivo/mcp — MCP server exposing component registry to AI agents
├── apps/
│   ├── docs/           # Vite + Preact + cascivo (dogfood) — auto-generated from manifests
│   ├── storybook/      # Storybook — auto-generated stories from manifests
│   ├── landing/        # Landing page — built with cascivo
│   └── examples/
│       ├── react-vite/ # Vite + React example app
│       └── react-next/ # Next.js App Router example (RSC demo)
├── skills/             # Claude Code skills — cascivo:add, cascivo:design-page, cascivo:create-theme, cascivo:extend
├── scripts/
│   ├── factory/        # Dark factory — headless Claude Code agents, factory-supervisor.sh
│   └── registry/       # registry.json generation + GitHub raw URL map
├── registry.json       # Component registry manifest — source of truth for CLI + MCP + docs
└── factory-backlog.json # Queue of component specs for the dark factory
```

### Tech Stack

Primary CLI: `vp` (vite+, installed globally via `~/.vite-plus/`). Single command for dev, build, test, lint, format, and task running. Alpha software — accepted risk for a greenfield project. Track breaking changes on updates.

| Concern               | Tool                            | Notes                                                      |
| --------------------- | ------------------------------- | ---------------------------------------------------------- |
| Primary CLI           | vite+ (`vp`)                    | unified toolchain — wraps all tools below                  |
| Package manager       | pnpm (via `vp install`)         | workspaces, fast installs, disk-efficient                  |
| Task orchestration    | `vp run`                        | replaces Turborepo — caching + dependency-aware task graph |
| Build / dev server    | Vite + Rolldown (via `vp`)      | fastest HMR, Rust bundler                                  |
| Linting               | Oxlint (via `vp lint`)          | Rust-based, ~100× faster than ESLint                       |
| Formatting            | Oxfmt (via `vp fmt`)            | Rust-based formatter bundled with vite+                    |
| Type checking         | `vp check`                      | runs fmt + lint + tsc together                             |
| Testing (unit)        | Vitest (via `vp test`)          | native Vite integration                                    |
| Testing (components)  | @testing-library/react (latest) |                                                            |
| Testing (e2e)         | Playwright (latest)             |                                                            |
| TypeScript            | 5.x strict mode                 | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`   |
| React (components)    | 18+                             | RSC-compatible via `"use client"`                          |
| Preact (docs/signals) | latest                          | `preact/compat` for rendering React components in docs     |
| State (core)          | @preact/signals-react (latest)  | fine-grained reactivity                                    |

pnpm workspaces (`pnpm-workspace.yaml`) remain the underlying monorepo mechanism. `vp run` orchestrates tasks across packages with caching, replacing `turbo.json`.

### Token Architecture

Three-level CSS custom property system:

```
Primitive tokens:  --cascivo-color-blue-500: #3b82f6
        ↓ (theme maps primitive → semantic)
Semantic tokens:   --cascivo-color-accent: var(--cascivo-color-blue-500)
        ↓ (component maps semantic → usage)
Component tokens:  --cascivo-button-bg: var(--cascivo-color-accent)
```

Themes override the semantic layer only. Users override component tokens for per-component brand adaptation. Applied via `data-theme="light|dark|warm"` on any DOM element.

### Component Manifest Schema

Every component in `packages/components/` ships a `component.meta.ts`:

```ts
export const meta: ComponentMeta = {
  name: string,           // 'Button'
  description: string,    // one-line purpose
  category: string,       // 'inputs' | 'display' | 'overlay' | 'layout' | 'feedback'
  states: string[],       // FSM states: ['default', 'hover', 'focus', 'disabled', 'loading']
  variants: string[],     // visual variants: ['primary', 'secondary', 'ghost', 'destructive']
  sizes: string[],        // ['sm', 'md', 'lg']
  props: PropMeta[],      // derived from TypeScript types
  tokens: string[],       // CSS custom properties this component reads
  accessibility: {
    role: string,
    wcag: 'AA',
    keyboard: string[],   // ['Enter', 'Space']
  },
  examples: ExampleMeta[],     // { title, code, description }
  dependencies: string[],      // ['@cascivo/core']
  tags: string[],              // for search/discovery
}
```

### AI Layer

| Surface             | Package                           | Purpose                                                                                      |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Component manifest  | `component.meta.ts` per component | Ground truth for all AI surfaces                                                             |
| MCP server          | `@cascivo/mcp`                    | Tools: `list_components`, `get_component`, `create_theme`, `scaffold_page`, `add_to_project` |
| Claude Code skills  | `skills/`                         | `cascivo:add`, `cascivo:design-page`, `cascivo:create-theme`, `cascivo:extend`               |
| Auto-generated docs | `apps/docs/`                      | Markdown + interactive examples generated from manifests                                     |
| Registry manifest   | `registry.json`                   | Machine-readable index — CLI + MCP + docs all read from this                                 |

### Dark Factory Pipeline

Tiered automation:

- **New components**: dark factory opens a PR → human reviews design + a11y → merge
- **Patches, doc regeneration, story updates, lint fixes**: fully automated, auto-merged
- **Trigger**: `factory-backlog.json` — queue of component specs the factory works through
- **Loop**: generate → lint → type-check → test → if pass: open PR; if fail: self-heal (max 5 attempts) → escalate

### v1 Component List (~20)

`inputs`: Button, Input, Textarea, Select, Checkbox, Radio, Toggle, Slider
`overlay`: Modal/Dialog, Dropdown, Tooltip, Toast
`display`: Card, Badge, Alert, Avatar, Separator
`navigation`: Tabs, Accordion
`feedback`: Spinner

### Distribution Model

- `@cascivo/core`, `@cascivo/tokens`, `@cascivo/themes`, `@cascivo/icons`, `@cascivo/mcp`: versioned npm packages
- Components: copy-paste via `npx cascivo add <component>` (source fetched from GitHub raw URLs, indexed in `registry.json`)
- Themes: `import '@cascivo/themes/light.css'`

### Browser & Accessibility Targets

- **Browsers**: last 2 versions of Chrome, Firefox, Safari (required for `:has()`, `@container`)
- **Accessibility**: WCAG 2.1 AA minimum
- **RTL**: CSS logical properties throughout (`margin-inline-start`, `padding-block`, etc.)

### Component Authoring Rules

These rules are non-negotiable. Violating them ships broken code.

#### Responsive by default (mobile-first)

Base styles target the smallest screen (320px); enhancements layer via `min-width`/min container queries.
Prefer `@container` (component adapts to its slot) over `@media` (viewport) wherever a component can live
in arbitrary containers.

**Canonical scale** (the only allowed width literals in `@media`/`@container` — `breakpoint:check` enforces this):

| Name | Value   | px (16px root) | Used for                             |
| ---- | ------- | -------------- | ------------------------------------ |
| `sm` | `30rem` | 480            | narrow/small phone                   |
| `md` | `40rem` | 640            | tablet/wide phone                    |
| `lg` | `64rem` | 1024           | desktop (AppShell drawer breakpoint) |
| `xl` | `80rem` | 1280           | wide desktop                         |

`@media`/`@container` **cannot read CSS custom properties** — copy the rem value directly. The
`--cascivo-screen-*` custom properties exist as documentation and JS/`calc` use only.

**Touch targets:** Interactive controls must reach ≥44px effective tap target under
`@media (pointer: coarse)`. Use `var(--cascivo-target-min-coarse, 2.75rem)` via `min-block-size`.
Desktop density (pointer: fine) is untouched.

**Never hide content:** `display:none` on mobile is data loss. Relocate content to a disclosure,
drawer, or bottom-sheet so it stays keyboard-reachable and in the a11y tree.

**Verify:** Pass the mobile-overflow + touch-target sweep at 320/360/390/414 before merging.
Run: `pnpm breakpoint:check` to confirm no off-scale literals.

#### Reactivity — use signals, not React hooks

| Allowed                                                            | Forbidden                                    |
| ------------------------------------------------------------------ | -------------------------------------------- |
| `useSignal`, `useComputed`, `useSignalEffect` from `@cascivo/core` | `useState`                                   |
| `useRef` for DOM references                                        | `useContext`                                 |
| `useMachine` / `createMachine` for genuine internal FSM state      | `useEffect`, `useLayoutEffect`, `useReducer` |

#### React apps must subscribe explicitly

The docs app is Preact (signals are natively reactive there). The React apps —
`apps/landing`, `apps/examples/*`, `apps/bench/*` — get NO Babel signals transform:
**any component that reads `signal.value` during render must call `useSignals()`
(from `@cascivo/core`) as its first statement**, or it will never re-render on
signal writes. Symptom: handlers fire, UI freezes (toggles that don't toggle, modals
that don't open).

`useEffect` is banned in cascade components without exception. Any async DOM side effect (adding event listeners, calling imperative DOM methods like `showModal()`) must use `useSignalEffect` instead.

`useRef` is allowed only for direct DOM element references (`useRef<HTMLElement>(null)`). It is not a state workaround.

#### Syncing a controlled React prop into a signal

When a component accepts a controlled boolean/string prop that needs to drive a signal effect, sync it during render:

```tsx
const isOpen = useSignal(open)
isOpen.value = open // no-op if unchanged; triggers effects if changed
```

For callbacks that must always be current in an effect, use a ref:

```tsx
const onCloseRef = useRef(onClose)
onCloseRef.current = onClose // sync during render
// inside useSignalEffect: onCloseRef.current?.()
```

#### FSM — only create machines for genuine internal state

A machine is justified when the component **itself drives the transitions** via user interaction. It is not justified when the state is entirely controlled by external props.

**Good:** Input `idle` ↔ `focused` driven by onFocus/onBlur events — the component controls these transitions.

**Bad:** Button `idle` ↔ `loading` when `loading` is a controlled prop passed in by the parent — the machine is never driven and `state.value` is always `'idle'`.

**Bad:** Modal `closed` ↔ `open` when `open` is a controlled prop — same problem. Remove the machine; the signal IS the state.

If a state can only be reached by the parent passing a prop, that state belongs in the parent, not in a machine inside the component.

#### Visual states handled by CSS, not JS

Hover, focus, active, and disabled visual states are handled by CSS (`:hover`, `:focus-visible`, `:active`, `:disabled`). Do not track these in a machine or signal. Use `data-state` attributes only for states that CSS pseudo-classes cannot express (e.g., `loading`, `error`).

#### CSS `@function` and `if()` — progressive enhancement only

CSS `@function` and `if(style())` are available in Chrome 133+ but not in Firefox or Safari yet. Every use in cascade components is progressive enhancement only.

**Rules:**

- Every declaration using a `@function` call or `if()` expression **must** have a static fallback for the same property immediately preceding it in the same rule block. The static value is the one non-supporting browsers use.
- Functions must stay trivial: no recursion, single `result`, `calc()` for numeric deferral, defaults on all optional args.
- No variable-spreading in `@function` (not yet supported by any browser).
- The `fallback:check` script (`pnpm fallback:check`) enforces the static-fallback contract. It runs as part of the pre-commit check.

**Pattern:**

```css
.component {
  padding-block: 0.5rem; /* static fallback — all browsers */
  padding-block: --cascivo-step(2); /* progressive — Chrome 133+ */
}
```

**Browser support context:** As of 2026-06, `@function` is Chrome-only (133+). Cascade uses it as a forward-looking pilot; it becomes the primary form once Safari/Firefox ship.

#### Checklist before committing a component

1. No `useState`, `useContext`, `useEffect`, `useLayoutEffect`, `useReducer` imports anywhere in the file.
2. Every machine transition is reachable by code inside the component (not just by external props).
3. DOM side effects use `useSignalEffect`, not `useEffect`.
4. All tests pass: `vp run @cascivo/components#test`.
5. The component is exported from `packages/react/src/index.ts` (the prebuilt `@cascivo/react` distribution).
6. User-visible strings default from the `@cascivo/i18n` built-in catalog (`t(builtin.<component>.<key>)`); a `labels` prop overrides per-instance. Never hardcoded English fallbacks.
7. Passes the mobile-overflow + touch-target sweep at 320/360/390/414; no off-scale breakpoint literals (`pnpm breakpoint:check`).
