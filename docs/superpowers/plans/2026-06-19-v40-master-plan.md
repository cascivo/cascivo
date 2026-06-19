# v40 — OpenUI Study → Adopt Generative-UI Token-Efficiency, Grammar & Streaming — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study [OpenUI](https://openui.com) ("The Open Standard for Generative UI",
[thesysdev/openui](https://github.com/thesysdev/openui)) and adopt the **five** things cascivo genuinely
lacks — **not** rebuild the renderer. cascivo already ships a generative-UI stack: `@cascivo/render`
(`ViewConfig` JSON + `CascadeView`), `@cascivo/ai` (StreamingText/AiChat/Terminal), `component.meta.ts`
manifests, `@cascivo/mcp`, and `registry.json`. The concept map (in `docs/ROADMAP-V40.md`) shows the
renderer, library, data binding, and AI components are all present. OpenUI's net-new contributions are the
layers it builds **on top of** a JSON renderer: a **token-efficient compact DSL** (OpenUI Lang is up to
67% smaller than JSON), **library-derived prompt/grammar generation** (bound vocabulary →
anti-hallucination), **streaming/progressive rendering**, **deep conformance validation**, and a **public
interop spec** (cf. the sibling "AI-Native Specification for UIs", `openui.yaml`). OpenUI's React runtime,
LiteLLM multi-provider proxy, and Zod dependency are explicitly **rejected** as contrary to cascivo's
owned-code, minimal-dependency principles.

Target state (verified after T5):

| Metric                                | Today                              | Target |
| ------------------------------------- | --------------------------------- | ------ |
| Render wire format                    | verbose `ViewConfig` JSON only    | `cvl` compact DSL ↔ `ViewConfig` (lossless) + token benchmark |
| LLM output guidance                   | keyword `scaffoldView`            | prompt + grammar generated from manifests (bound vocabulary) |
| Rendering                             | one-shot (complete config)        | optional streaming/progressive (skeleton-first), signal-driven |
| Validation                            | names + `$data`/`$actions` prefix | + prop type/enum conformance; partial/invalid-tolerant parse |
| Interop                               | cascivo registry (+ v39 shadcn)   | standard `openui.json` AI-native spec (additive) |
| Full CI gate (`pnpm ready`)           | green                             | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Render schema:** `packages/render/src/types.ts` defines `ViewConfig = { $schema?, version?: 1, view: {
  layout?, regions: Record<string, ComponentNode[]> } }` and `ComponentNode = { component, props?, bind?:
  Record<string, "$data.*">, events?: Record<string, "$actions.*">, children?: ComponentNode[] | string |
  TranslationRef }`. JSON Schema at `packages/render/schema/view.v1.json`. Exported from
  `packages/render/src/index.ts` alongside `CascadeView` and `validateView`.
- **Renderer:** `packages/render/src/cascade-view.tsx` + `component-map.ts` map node `component` names to
  cascivo components. It expects a **complete** `ViewConfig`.
- **Validation:** `packages/render/src/validate.ts` — `validateView(config)` checks each node's `component`
  exists in `componentMap` (with a Levenshtein "did you mean"), `bind` values start `$data.`, `events`
  values start `$actions.`, and recurses `children`. It does **not** check prop names/types/enums.
- **Scaffold (current "AI"):** `packages/mcp/src/scaffold-view.ts` — `scaffoldView` picks a layout and up to
  4 components by **keyword** match against the registry, fills required+default props. This is the slot the
  T2 prompt/grammar generator upgrades.
- **AI components:** `packages/ai/src/index.ts` exports `StreamingText`, `AiChat`, `Terminal`, `AiLabel` —
  the streaming idioms T3 reuses.
- **MCP:** `packages/mcp/src/server.ts` registers tools; the registry surface lives in
  `packages/mcp/src/registry.ts`. Manifests (`component.meta.ts`) carry prop `type`/`enum`/`default`,
  `variants`, `sizes` — the source for T2's grammar and T4's conformance checks.
- **Interop precedent:** v39 added a shadcn-registry emitter in `packages/registry`
  (`docs/superpowers/plans/2026-06-18-v39-master-plan.md`, Decision 6) without touching `registry.json`.
  T5 follows that exact additive pattern for `openui.json`.

**Tech Stack:** TypeScript (hand-written `cvl` encoder/parser + validator) + Vitest in `@cascivo/render`;
TypeScript generator + Vitest in `@cascivo/mcp`; signal-driven TSX (no Tailwind, no Zod, no
`useState`/`useEffect`) for the streaming renderer, reusing `@cascivo/core` signals and `@cascivo/ai`
idioms; a TS emitter for the interop spec in `packages/registry`. vite+ (`vp`) for check/build/test
throughout.

---

## Tranche Overview

| Tranche | Title                                   | Goal                                                                                                  |
| ------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| T1      | Cascade View Language (`cvl`)           | Compact, line-oriented DSL with lossless `encode`/`parse` round-trip to `ViewConfig`; token benchmark. The headline adoption. |
| T2      | Library-derived prompt + grammar        | Generate the system prompt + allowed-vocabulary grammar (components/props/enums) from manifests so an LLM emits valid `cvl`. |
| T3      | Streaming / progressive rendering       | Incremental `cvl` parser + a streaming `CascadeView` that paints nodes as they arrive; signal-driven.  |
| T4      | Deep conformance validation             | Validate node props against manifest types/enums; make the parser partial/invalid-tolerant.           |
| T5      | `openui.json` interop + docs & gate     | Emit a standard AI-native spec from manifests (additive); document everything; `pnpm regen`; full gate. |

Ordering rationale: **T1 first** — `cvl` is the wire format the rest depends on, and lossless round-trip
with the canonical `ViewConfig` JSON makes it safe and additive. **T2** teaches an LLM to emit `cvl`, so it
follows T1 (it must describe the format). **T3** consumes the T1 parser to stream-render. **T4** hardens
the parser + validator across T1/T3. **T2/T3/T4 are independent of each other** and could run in parallel
after T1, but are sequenced for a single reviewer. **T5** publishes the public interop spec, documents the
roadmap, and runs the final gate + drift.

---

## Files Created / Modified per Tranche

### T1 — Cascade View Language (`cvl`)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/render/src/lang/encode.ts` (`ViewConfig` → `cvl` string)                     |
| Create | `packages/render/src/lang/parse.ts` (`cvl` string → `ViewConfig`)                      |
| Create | `packages/render/src/lang/index.ts`, `packages/render/src/lang/grammar.ts` (token/line shapes) |
| Create | `packages/render/src/lang/roundtrip.test.ts` (+ `tokens.test.ts` benchmark)            |
| Modify | `packages/render/src/index.ts` (export `encode`/`parse`/types)                          |
| Modify | `packages/render/README.md` (document `cvl` + token-saving number)                     |

### T2 — Library-derived prompt + grammar generation

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/mcp/src/grammar.ts` (manifests → allowed vocabulary) + `prompt.ts` (system prompt for `cvl`) |
| Create | `packages/mcp/src/grammar.test.ts` (every referenced name exists in the registry)      |
| Modify | `packages/mcp/src/server.ts` (expose prompt/grammar via a tool or extend `scaffold_*`) |
| Modify | `packages/mcp/src/scaffold-view.ts` (optionally emit `cvl` + grammar context)          |
| Modify | `packages/mcp/README.md`                                                                |

### T3 — Streaming / progressive rendering

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/render/src/lang/stream.ts` (incremental parser yielding complete nodes)      |
| Create | `packages/render/src/streaming-view.tsx` (or a `streaming` mode on `CascadeView`) + `.module.css` |
| Create | `packages/render/src/streaming-view.test.tsx` (chunked feed → progressive renders)     |
| Modify | `packages/render/src/index.ts` (export streaming API)                                   |

### T4 — Deep conformance validation

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/render/src/validate.ts` (prop type/enum checks from manifests; reuse Levenshtein) |
| Modify | `packages/render/src/component-map.ts` / a meta-lookup (wire prop schemas in for validation) |
| Modify | `packages/render/src/lang/parse.ts` (partial/invalid-tolerant: structured errors, never throw) |
| Create | `packages/render/src/validate.conformance.test.ts` (unknown prop, bad enum, type mismatch, truncated `cvl`) |

### T5 — `openui.json` interop export + docs & final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/registry/src/openui.ts` (manifests/registry → standard `openui.json` spec)   |
| Create | `packages/registry/src/openui.test.ts` (shape/validation smoke test)                    |
| Modify | `packages/registry/src/build.ts` (emit `openui.json` alongside existing output)         |
| Modify | `packages/registry/README.md` (CSS-native caveats + discovery)                          |
| Modify | `docs/ROADMAP-V40.md` (status → in progress/done as tranches land)                      |
| Verify | `pnpm regen`; full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, drift) |

---

## Key Decisions

### Decision 1 — Do NOT rebuild the renderer (firm)

cascivo already has `@cascivo/render` (`ViewConfig` + `CascadeView`), `@cascivo/ai`, MCP, manifests, and a
registry. The concept map in `docs/ROADMAP-V40.md` shows the renderer, component library, data binding, and
AI components are all present — OpenUI itself has no MCP/manifest layer. **Decision: adopt only the layers
OpenUI builds on top of a renderer (efficiency, grammar, streaming, conformance, interop); do not re-port
OpenUI's runtime.** This is the central honest finding and the reason v40 is scoped around ideas, not a
rewrite.

### Decision 2 — Reject OpenUI's runtime, LiteLLM, and Zod (firm)

OpenUI ships a React runtime + built-in component libraries + chat UI, a LiteLLM-style multi-provider
proxy, and Zod schemas. cascivo owns its components + `@cascivo/ai`, defaults to Claude (not a gateway),
and validates with its own JSON Schema + `validate.ts` under a minimal-dependency policy. **Decision: none
of the three is adopted.** Each contradicts a core principle (owned code / scope / dependency policy). The
study records them as "considered, rejected, with reason."

### Decision 3 — Build `cvl` as additive serialization; JSON stays canonical (recommended)

OpenUI Lang's 50–67% token saving over JSON is real and lowers cost/latency on every generated view.
**Decision: add a compact line-oriented DSL (`cvl`) with lossless `encode`/`parse` round-trip to
`ViewConfig`, keeping `ViewConfig` JSON as the canonical in-memory form and `view.v1.json` unchanged.**
Risk is low (round-trip is a hard test; JSON remains authoritative). It lives as a **submodule** in
`packages/render/src/lang/` (exported from `@cascivo/render`), not a new `@cascivo/lang` package, to avoid
workspace-alias maintenance for no benefit (CLAUDE.md "workspace package aliases"). Name: **Cascade View
Language / `cvl` / `.cvl`** — matches `CascadeView`/`ViewConfig`, short, greppable. Rejected: keep JSON only
(pays the token tax OpenUI exists to remove); a separate package (needless alias churn).

### Decision 4 — Prompt + grammar generated from manifests (recommended)

OpenUI's anti-hallucination mechanism is a system prompt generated from the library so the model can only
emit registered components/props. cascivo's `scaffoldView` is a keyword matcher. **Decision: generate, from
`component.meta.ts`, the system prompt + a machine-checkable allowed-vocabulary grammar (components → props
→ enums/sizes/variants) describing how to emit valid `cvl`.** Deriving it from manifests keeps it always in
sync; a test asserts every referenced name exists in the registry. Optional stretch (flagged, not required):
emit a formal grammar for constrained decoding. Rejected: free-prose prompts (drift, no boundedness).

### Decision 5 — Streaming is a progressive render mode, node-granular (recommended)

**Decision: add a streaming `CascadeView` mode (or `StreamingView`) that renders each node once it parses
cleanly, with a placeholder/skeleton for in-flight nodes** — "skeleton before the full document." It is
signal-driven (`useSignal`/`useSignalEffect`, never `useEffect`; `useSignals()` for React apps), backed by
an incremental `cvl` parser (`lang/stream.ts`). Text leaves may reuse `@cascivo/ai` `StreamingText`. Do
**not** attempt mid-prop partial rendering (paint a node only when it parses cleanly). Rejected: a
`useEffect`/`useState` stream loop (violates reactivity rules); character-level partial nodes (flicker,
invalid intermediate states).

### Decision 6 — Deep conformance by extending the existing validator, no Zod (recommended)

`validateView` checks component existence + ref prefixes but not props. **Decision: extend `validateView`
(or a sibling) to validate node props against manifest types/enums** (unknown prop, wrong type, out-of-enum),
reusing the Levenshtein "did you mean" UX for prop names, and make the `cvl` parser return structured errors
instead of throwing so streaming degrades gracefully. No Zod — reuse the JSON Schema + hand-written checks.
Rejected: adopting Zod (dependency policy); leaving validation shallow (lets hallucinated props render).

### Decision 7 — Interop spec is a second emitter, not a schema change (recommended)

cascivo's `registry.json` is consumed by the CLI/MCP/docs; changing it is high-blast-radius (the same logic
that drove v39's separate shadcn emitter). **Decision: add `packages/registry/src/openui.ts` that maps the
manifests/registry into a standard, framework-agnostic `openui.json` AI-native spec
(name/description/props/enum/default/example) and writes it alongside the existing output.** `registry.json`
and the v39 shadcn output are untouched. CSS-native caveats documented (cascivo ships CSS Modules +
`@cascivo/themes`, not Tailwind). Pure additive interop. Rejected: rewriting `registry.json` to the OpenUI
schema (breaks consumers).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **`ViewConfig` JSON is canonical and unchanged.** `cvl` is additive; `view.v1.json`, `CascadeView`'s
   contract, and the in-memory `ViewConfig` type are untouched. Round-trip (`parse(encode(config))` deep-eq
   `config`) is a hard gate across all example views, including `bind`/`events`/`children`/`$t` refs.
3. **No Tailwind, no Zod, no OpenUI runtime, no banned hooks.** New TSX (streaming renderer) obeys
   CLAUDE.md: no `useState`/`useEffect`/`useContext`/`useReducer`; `useSignal*` + `useRef` only; CSS handles
   hover/focus/active/disabled; i18n-defaulted strings; `useSignals()` if signals are read during render in
   React apps; DOM side effects via `useSignalEffect`.
4. **Generator + interop derive from manifests.** T2's grammar/prompt and T5's `openui.json` both read
   `component.meta.ts`/the registry so they never drift; a test asserts every name they reference exists.
5. **Interop is additive:** the `openui.json` emitter is net-new output; `registry.json` and the v39 shadcn
   output are untouched.
6. **Validation never throws on bad input:** the `cvl` parser and `validateView` return structured errors so
   streaming (T3) and untrusted LLM output degrade gracefully.
7. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check`,
   `breakpoint:check`, `fallback:check` green.
</content>
