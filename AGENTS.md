# AGENTS.md — cascivo for AI agents

Vendor-neutral guide for AI coding agents (Cursor, Copilot, Windsurf, etc.)
working in this repo. Claude Code users: see `CLAUDE.md` for the full
contributor rules — this file points at the machine-readable surfaces and the
few rules that matter most for generating correct cascivo code.

## What cascivo is

The CSS-native, signal-driven, AI-first React design system. Components are
**owned code** (copy-pasted into user projects, shadcn-style), styled with modern
CSS (`@layer`, `@container`, `:has()`, custom properties) — **no Tailwind, no
CSS-in-JS** — and made reactive with Preact Signals via `@cascivo/core` — **no
`useState`/`useEffect`/`useContext`/`useReducer`**.

## Machine-readable surfaces (use these first)

- **`registry.json`** — the source of truth: every component with its props,
  variants, sizes, tokens, a11y, and examples. CLI + MCP + docs all read it.
- **`@cascivo/mcp`** — MCP server exposing the registry to agents. Key tools:
  `list_components`, `get_component`, `search_components`, `validate_view`,
  `scaffold_view`, and `get_view_grammar` (a bound-vocabulary prompt + grammar
  for generating valid `ViewConfig` JSON — use it to avoid hallucinating
  components/props/enums).
- **`llms.txt`** — `apps/site/public/llms.txt` (+ per-component markdown under
  `apps/site/public/llms/`).
- **`component.meta.ts`** — per-component manifest beside each component in
  `packages/components/src/<name>/`.
- **`skills/`** — Claude Code skills (`cascivo:add`, `cascivo:design-page`,
  `cascivo:create-theme`, `cascivo:extend`).

## Generating UI from JSON

`@cascivo/render` renders a `ViewConfig` (JSON) via `<CascadeView />`. To produce
one reliably: call `get_view_grammar` for the system prompt + allowed vocabulary,
emit JSON bounded to that vocabulary, then `validate_view` it (checks component
names, prop types/enums, and `$data.`/`$actions.` refs) before rendering.

## Non-negotiable rules when writing components

1. **Reactivity:** `useSignal`/`useComputed`/`useSignalEffect` + `useRef` only.
   No `useState`/`useEffect`/`useContext`/`useReducer`. DOM side effects go in
   `useSignalEffect`. React apps must call `useSignals()` first when reading a
   signal during render.
2. **Styling:** CSS Modules in `@layer cascivo.component`; read `var(--cascivo-*)`
   tokens, never hard-coded values. Hover/focus/active/disabled are CSS, not JS.
3. **Responsive + a11y:** mobile-first; only the canonical breakpoint scale
   (`30/40/64/80rem`); ≥44px coarse-pointer targets; never `display:none` to hide
   content; WCAG 2.2 AA; RTL via logical properties.
4. **i18n:** user-visible strings default from `@cascivo/i18n` `builtin`
   (`t(builtin.<component>.<key>)`) with a `labels` override — never hard-coded
   English.
5. **Registration:** export new components from `packages/react/src/index.ts` and
   add their meta to `packages/components/src/_all-metas.ts`, then `pnpm regen`.

## Verify before you finish

`pnpm ready` runs the full gate: `regen` → `vp check --fix` → build → type check →
tests. It must pass with zero warnings, and `git diff --exit-code` after `regen`
must be clean (commit regenerated artifacts).
