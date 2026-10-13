# cascivo

The CSS-native, signal-driven, AI-first React design system. Components are **owned code**
(copied into adopter projects by `npx cascivo add`), so they must pass the adopter's strict
config, not just ours. Full reasoning, the gate catalogue and the architecture reference:
`docs/internal/CONTRIBUTOR-REFERENCE.md`.

## Repository

pnpm workspace driven by vite+ (`vp`: Oxlint, Oxfmt, Rolldown, Vitest; `vp run` replaces
Turborepo). TypeScript 5 strict with `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.

- `packages/components/`: registry source (TSX + CSS module + `<name>.meta.ts` + tests), not on npm;
  copied by the CLI. `packages/react/` is the prebuilt npm distribution.
- `packages/core` (micro-FSM + signals primitives), `tokens`, `themes` (twelve themes), `i18n`,
  `storage`, `icons`, `charts`, `render`, `cli` (`cascivo`), `mcp`, and more: `ls packages`.
- `apps/site` (Preact, docs + marketing, data-driven from `registry.json`), `apps/storybook`,
  `apps/live`, `apps/examples/*` (React demos), `apps/bench/*`.
- `registry.json` is the source of truth for CLI, MCP and docs; `skills/` holds Claude Code skills;
  `scripts/factory/backlog.json` is the dark-factory queue (`factory` skill).

## Rules

- State assumptions; ask when a request is ambiguous. Prefer the simplest change, touch only what
  the task needs, don't refactor or reformat unrelated code, and match existing style.
- Done means zero lint warnings, zero type errors, passing tests. New behaviour gets tests; bug
  fixes get a regression test; tests are deterministic. Never skip or delete tests.
- Comments explain why, not what. Never commit secrets.
- Latest stable dependencies; peers explicit and ranged (`>=18.0.0`); `@cascivo/core` has no
  runtime dependency beyond `@preact/signals-react`.
- An app's `package.json` `name` must end with its directory name (`apps/examples/pulse` →
  `@cascivo/example-pulse`); a duplicate name stops every task in the monorepo
  (`scripts/checks/app-package-names.test.ts`).
- Use docspack (block below) before broad searches. A `PreToolUse` hook
  (`scripts/docspack-nudge.mjs`) nudges toward it; follow the nudge.

## Gates

- `pnpm ready` before every commit; all must pass. It runs `regen` → `vp check --fix` → host-lint
  → pre-build guards → build → post-build guards → type check → tests → `compiler:check`. Commit
  whatever `regen`/`--fix` changed; CI regenerates and fails on any diff.
- `ready` is not a superset of CI. After changing a **published** package also run
  `pnpm isolated:check` and `pnpm pack:check` (the only gates that see the packed tarballs). Other
  CI-only gates, and what each one catches: the reference doc. `pnpm ready:ci` mirrors CI's cold,
  sequential build.
- Host lint: `lint:host-strict` (oxlint) is only a fast subset; `lint:host-eslint` (real ESLint +
  adopter plugins) is the authority.
- Two type worlds: adopters load `@preact/signals-react`'s JSX augmentation, we don't. An
  "unnecessary" assertion on a JSX attribute may be load-bearing for them; never bulk-autofix
  `no-unnecessary-type-assertion` (`scripts/checks/host-lint/eslint/README.md`).
- Vite aliases: every `@cascivo/*` package whose root export resolves to `./dist/` needs a source
  alias in `apps/site/vite.config.ts` and `apps/storybook/.storybook/main.ts` (CI builds them
  without a prior build). A subpath (`@cascivo/core/pure`) needs its own alias **above** the bare
  one in every alias map, and `rollupOptions.external` must be subpath-aware
  (`/^@cascivo\/core($|\/)/`).

## Security: never `as` a payload you did not produce

`as` on parsed or fetched data is not validation: `cascivo add` once wrote registry-supplied
`files[].target` (`../../.zshrc`) outside the project. Bind payloads as `unknown` and parse once at
the boundary (`parseRegistry` in `packages/cli/src/utils/registry.ts`, `parseItem` in
`packages/registry/src/validate.ts`). Check an existing validator is actually called and covers the
fields that matter. Registry paths are untrusted: `isSafeRelativePath` at parse, `assertInside` at
the write. Narrow, then cast, never the reverse.

## Keeping AI docs in sync

- Component/block/chart/layout: edit its `.meta.ts`, then `pnpm regen` (registry, llms, context
  and schemas are generated from it).
- New `@cascivo/core` primitive or `@cascivo/react` theme/form primitive: catalogue it in
  `docs/HEADLESS.md` (enforced by `scripts/checks/primitive-docs.test.ts`). If it changes reactivity
  guidance, also update `docs/AI-RULES.md` and `scripts/llms/generate.ts`, then `pnpm regen`.

## Component authoring (non-negotiable)

- **Reactivity:** `useSignal`/`useComputed`/`useSignalEffect` (+ `useMachine` for genuine internal
  FSM state) from `@cascivo/core`; `useRef` only for DOM refs or always-current callbacks. Never
  `useState`, `useContext`, `useEffect`, `useLayoutEffect`, `useReducer`; DOM side effects go in
  `useSignalEffect`.
- **React apps** (`apps/examples/*`, `apps/bench/*`) have no signals transform: a component reading
  `signal.value` in render calls `useSignals()` first. App code holds local state with
  `useSignalState` and writes through the setter (React Compiler safe); library source may write `.value`.
- **Controlled prop → signal:** read in render → `useControllableSignal`; read only in an effect →
  `useEffectPropSignal`. Never hand-roll `s.value = prop` during render (it ran `showModal()`
  mid-render in seven components).
- **FSM** only when the component itself drives the transitions; a state reachable only via a prop
  belongs to the parent. Hover/focus/active/disabled are CSS; `data-state` only for what CSS can't express.
- **Responsive:** mobile-first; prefer `@container`; widths only from `30rem`/`40rem`/`64rem`/`80rem`
  (`pnpm breakpoint:check`); ≥44px coarse-pointer targets via `var(--cascivo-target-min-coarse, 2.75rem)`;
  never `display:none` content on mobile, relocate it. WCAG 2.2 AA; RTL via logical properties.
- **CSS:** everything inside `@layer cascivo.component` (blocks: `cascivo.blocks.<name>`); never
  unlayered (except forced-colors / prefers-contrast / reduced-motion queries), never an invented
  layer name, sub-elements via native nesting (`pnpm layers:check`, `pnpm unlayered:check`). No
  Tailwind, no CSS-in-JS. `@function`/`if()` only as progressive enhancement, with a static fallback
  declaration immediately before (`pnpm fallback:check`, not in `ready`).
- **A11y primitives:** `useId()` for ids; native `<dialog>.showModal()` (else `FocusScope`) for traps;
  `popover="auto"` (else `DismissableLayer`) for dismissal; `useRovingFocus` for static rows; the
  enabled-items DOM-query pattern (`menu.tsx`) for opened menus; `useTypeahead` (`pnpm primitives:check`).
- **Handler naming:** `onValueChange(value)`, `onChange(event)` only for a real DOM event,
  `onSelect(value)` for item activation (`docs/AI-RULES.md`).
- **Prop vocabulary:** collections `items` (form choices `options`, chart points `data`, never
  `entries`); visual style `variant` (type named after the prop); union tag `kind`; space steps are
  numeric (`gap={4}`); rich slots `actions: ReactNode`; feedback body text `description`
  (`docs/AI-RULES.md` "Data and shape props", `scripts/checks/vocabulary.test.ts`).
- **Before committing a component:** every signature default has a matching manifest `default`;
  `vp run @cascivo/components#test` passes; exported from `packages/react/src/index.ts`;
  user-visible strings from `@cascivo/i18n` (`t(builtin.<component>.<key>)`, `labels` override);
  passes the 320/360/390/414 overflow + touch-target sweep.

<!-- prettier-ignore-start -->
<!-- docspack:start recipe=repo -->
## Documentation for this project's dependencies

Run `npx docspack ask "<question>"` for documentation on this project's
dependencies. It answers from the installed versions.

## Finding things in this repository

Before reading files to find where something is, ask the index:

- `npx docspack recall --name repo-code "<what the code does>"` answers with the `file:line`,
  signature and doc comment of matching declarations. Then read only that range.
- `npx docspack recall --name repo-docs "<question>"` answers from this repository's Markdown.

An answer is a pointer: read the file before you edit it. If you already know a name,
`grep` is as good. If `recall` says nothing is indexed, run `npx docspack index --repo`.

## Working efficiently in this repository

Every tool call is a turn, and every turn resends the whole conversation. Use fewer, larger calls:

- Read several files, or several ranges of one file, in one shell command
  (`sed -n '40,90p' a.ts; sed -n '1,60p' b.ts`) instead of one Read per file.
- Search once, with a pattern that covers everything you are looking for.
- Make related edits together, and run the tests once the change is complete.

<!-- Written by `npx docspack agent install`. Re-run it to update this block. -->
<!-- docspack:end -->
<!-- prettier-ignore-end -->
