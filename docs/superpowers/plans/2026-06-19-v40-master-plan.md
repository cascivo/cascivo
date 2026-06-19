# v40 — OpenUI Study → Make Agent-Generated UI Reliable — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study [OpenUI](https://openui.com) ("The Open Standard for Generative UI",
[thesysdev/openui](https://github.com/thesysdev/openui)) and adopt — in a **deliberately trimmed** scope —
the things that make cascivo's **already-shipping, dogfooded** generative-UI stack *reliable*, not the
things that rebuild it. cascivo already has `@cascivo/render` (`ViewConfig` JSON + `CascadeView`, surfaced
on the landing page, docs playground, CLI, and six example apps), `@cascivo/ai`, `component.meta.ts`
manifests, `@cascivo/mcp`, and `registry.json`. The concept map (in `docs/ROADMAP-V40.md`) shows the
renderer, library, binding, and AI components all exist; OpenUI itself has no MCP/manifest layer.

After a value review the scope is **two core tranches** + **one optional** + **two deferred**:

- **T1 (core) — library-derived prompt + grammar** from the manifests (OpenUI's bound-vocabulary
  anti-hallucination mechanism), targeting the **JSON `ViewConfig`** that already ships. The single biggest
  value: an LLM is structurally prevented from inventing components/props/enums.
- **T2 (core) — deep conformance validation**: extend `validateView` to check props against manifest
  types/enums (today it checks names only). The enforcement backstop for T1.
- **T3 (optional) — `cvl` compact DSL** ↔ `ViewConfig`: OpenUI Lang's ~50–67% token saving over JSON. Real,
  but justified as a **positioning differentiator**, not on cost (the renderer is a showcase, not a metered
  path); weighed against permanent DSL maintenance. Sequenced last; cuttable cleanly.
- **Deferred — streaming/progressive rendering** and **`openui.json` interop export**: recorded with trigger
  conditions, not built now (no real use case / immature ecosystem).

OpenUI's React runtime, LiteLLM proxy, and Zod dependency are explicitly **rejected** (owned-code / scope /
dependency-policy).

Target state (verified after T2; T3 optional):

| Metric                                | Today                              | Target (core) |
| ------------------------------------- | --------------------------------- | ------------- |
| LLM output guidance                   | keyword `scaffoldView`            | prompt + grammar from manifests (bounded `ViewConfig` JSON) |
| Validation                            | names + `$data`/`$actions` prefix | + prop type/enum conformance |
| Flagship demo reliability             | renders any JSON; silent on bad props | model bounded to real API; bad props caught with actionable errors |
| Full CI gate (`pnpm ready`)           | green                             | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Render schema:** `packages/render/src/types.ts` — `ViewConfig` + `ComponentNode` (`component`, `props`,
  `bind: $data.*`, `events: $actions.*`, `children`). JSON Schema at `packages/render/schema/view.v1.json`.
  Exported from `packages/render/src/index.ts` with `CascadeView` + `validateView`.
- **Dogfooded:** `CascadeView` is imported by `apps/landing/src/sections/{AgentLayer,JsonPlayground}.tsx`,
  `apps/docs/src/pages/PlaygroundPage.tsx`, `packages/cli/src/commands/generate.ts`, and example apps
  (`json-playground`, `flow`, `deploy`, `pay`, `pulse`, `track`). It is `private/0.0.0` because components
  ship copy-paste, **not** because it is experimental.
- **Validation gap:** `packages/render/src/validate.ts` — `validateView(config)` checks `component in
  componentMap` (Levenshtein "did you mean"), `bind`→`$data.`, `events`→`$actions.`, recurses `children`.
  It does **not** check prop names/types/enums. This is the T2 hole.
- **Scaffold (current "AI"):** `packages/mcp/src/scaffold-view.ts` — `scaffoldView` picks layout + up to 4
  components by **keyword** match, fills required/default props. The slot T1 upgrades to a bound-vocabulary
  generator.
- **Manifests:** `component.meta.ts` carry per-prop `type`/`enum`/`default`, plus `variants`/`sizes` — the
  source for T1's grammar and T2's conformance checks.
- **Interop precedent (deferred here):** v39 added a shadcn-registry emitter in `packages/registry` without
  touching `registry.json` (`docs/superpowers/plans/2026-06-18-v39-master-plan.md`, Decision 6). The
  deferred `openui.json` export would follow that exact additive pattern.

**Tech Stack:** TypeScript generator + Vitest in `@cascivo/mcp` (T1); hand-written validator extension +
Vitest in `@cascivo/render` (T2); optional hand-written `cvl` encoder/parser + Vitest in `@cascivo/render`
(T3). No Tailwind, no Zod, no OpenUI runtime. vite+ (`vp`) for check/build/test throughout.

---

## Tranche Overview

| Tranche | Title                                   | Status   | Goal                                                                                                  |
| ------- | --------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| T1      | Library-derived prompt + grammar        | **core** | Generate the system prompt + allowed-vocabulary grammar (components/props/enums) from manifests so an LLM emits valid, bounded `ViewConfig` JSON. The biggest value. |
| T2      | Deep conformance validation             | **core** | Validate node props against manifest types/enums; the enforcement backstop for T1.                    |
| T3      | `cvl` compact DSL (optional)            | optional | Token-efficient line-oriented DSL with lossless `encode`/`parse` round-trip to `ViewConfig`; benchmark. Positioning bet; cuttable. |

Ordering rationale: **T1 first** — it delivers the core reliability value and depends only on the existing
manifests + JSON `ViewConfig`. **T2** is its backstop and is independent (it can run in parallel) but
sequenced second for a single reviewer. **T3 last** — optional, additive, and only worth its permanent
maintenance cost as a deliberate positioning bet; cutting it does not affect T1/T2. Streaming and
`openui.json` interop are **not tranches** — they are logged in the roadmap's "Deferred / revisit when"
section with trigger conditions.

---

## Files Created / Modified per Tranche

### T1 — Library-derived prompt + grammar generation (core)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/mcp/src/grammar.ts` (manifests → allowed-vocabulary descriptor)              |
| Create | `packages/mcp/src/prompt.ts` (system prompt for emitting bounded `ViewConfig` JSON)    |
| Create | `packages/mcp/src/grammar.test.ts` (every referenced name exists in the registry)      |
| Modify | `packages/mcp/src/server.ts` (expose prompt/grammar via a tool or extend `scaffold_*`) |
| Modify | `packages/mcp/src/scaffold-view.ts` (optionally return grammar context)                |
| Modify | `packages/mcp/README.md`                                                                |

### T2 — Deep conformance validation (core)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/render/src/validate.ts` (prop type/enum checks from manifests; reuse Levenshtein) |
| Modify | `packages/render/src/component-map.ts` / `registry-data.ts` (expose per-component prop schemas to the validator) |
| Create | `packages/render/src/validate.conformance.test.ts` (unknown prop, bad enum, type mismatch, valid view) |

### T3 — `cvl` compact DSL (optional)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/render/src/lang/{encode,parse,grammar,index}.ts`                              |
| Create | `packages/render/src/lang/{roundtrip,tokens}.test.ts`                                   |
| Modify | `packages/render/src/index.ts` (export `encode`/`parse` + lang types)                   |
| Modify | `packages/mcp/src/prompt.ts` (optional `cvl` section)                                   |
| Modify | `packages/render/README.md` (document `cvl` + token-saving number)                      |

### Roadmap close-out

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `docs/ROADMAP-V40.md` (status → done as tranches land; "Deferred" section maintained)  |
| Verify | `pnpm regen`; full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, drift) |

---

## Key Decisions

### Decision 1 — Trim to reliability-first (firm)

The study surfaced five adoptable ideas; a value review keeps only the two that improve **reliability of
agent-generated UI** as core, because the renderer is a dogfooded showcase whose moat is correctness, not
token cost or streaming polish. **Decision: T1 (prompt/grammar) + T2 (conformance) are core; T3 (`cvl`) is
optional; streaming and `openui.json` interop are deferred with trigger conditions.** This captures ~80% of
the value for ~40% of the surface area and honours "Simplicity First / nothing speculative."

### Decision 2 — Do NOT rebuild the renderer; reject OpenUI's runtime, LiteLLM, Zod (firm)

cascivo already has the renderer, library, binding, AI components, and MCP. **Decision: adopt only the
bound-vocabulary + conformance ideas (and optionally the DSL); import none of OpenUI's runtime, no LiteLLM
multi-provider proxy, no Zod.** Each contradicts a core principle (owned code / scope / dependency policy).
Recorded as "considered, rejected, with reason."

### Decision 3 — T1 generates a bound vocabulary from manifests, for JSON `ViewConfig` (recommended)

OpenUI's anti-hallucination mechanism is a system prompt generated from the library. cascivo's `scaffoldView`
is a keyword matcher. **Decision: generate, from `component.meta.ts`, a system prompt + a machine-checkable
allowed-vocabulary grammar (components → props → enums/sizes/variants) for emitting valid `ViewConfig`
JSON** — the format that already ships and is dogfooded. A test asserts every referenced name exists in the
registry, so it never drifts. It needs no new wire format; if T3 lands, the prompt gains an optional `cvl`
section. Rejected: free-prose prompts (drift, unbounded); requiring `cvl` first (couples the highest-value
work to the optional work).

### Decision 4 — T2 extends the existing validator, no Zod (recommended)

`validateView` checks component existence + ref prefixes but not props, so a real component with invented
props renders silently. **Decision: extend `validateView` to validate node props against manifest
types/enums (unknown prop with Levenshtein "did you mean", type mismatch, out-of-enum), returning structured
`{ path, message }` errors; existing checks unchanged.** Reuse the JSON Schema + hand-written checks; no Zod
(dependency policy). It preserves the `CascadeView onInvalid` contract. Rejected: adopting Zod; leaving
validation shallow (lets hallucinated props through).

### Decision 5 — `cvl` (if built) is additive; JSON canonical; submodule not package (recommended)

OpenUI Lang's 50–67% token saving is real but only bites at volume; the renderer is a showcase, so `cvl` is
justified as a **positioning differentiator**, not on cost — and weighed against a hand-written DSL + parser
+ grammar maintained in lockstep with `ViewConfig` forever. **Decision: if built, add `cvl` as a submodule
under `packages/render/src/lang/` (exported from `@cascivo/render`) with lossless `encode`/`parse`
round-trip; `ViewConfig` JSON and `view.v1.json` unchanged. Name: Cascade View Language / `cvl` / `.cvl`.**
A new `@cascivo/lang` package is rejected (workspace-alias maintenance for no benefit, CLAUDE.md). T3 may be
cut cleanly without affecting T1/T2.

### Decision 6 — Defer streaming + interop with explicit triggers (recommended)

Streaming/progressive rendering is genuine UX polish but needs a real live-streaming product and is most
useful atop `cvl`. The `openui.json` interop export is cheap/additive but the OpenUI ecosystem has no
install base yet (unlike shadcn in v39). **Decision: record both in the roadmap's "Deferred / revisit when"
section with trigger conditions ("build streaming when a product streams LLM-generated views to end users";
"emit `openui.json` when a real OpenUI-ecosystem consumer requests it"), not as tranches.** Keeps the
decision explicit and reversible without building speculatively.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **`ViewConfig` JSON is canonical and unchanged.** T1/T2 operate on it directly; `view.v1.json` and
   `CascadeView`'s contract are untouched. If T3 lands, `cvl` is additive with a lossless round-trip as a
   hard gate.
3. **Derived-from-manifests.** T1's grammar/prompt and T2's conformance both read `component.meta.ts`; a test
   asserts every name they reference exists in the registry, so they never drift.
4. **No Tailwind, no Zod, no OpenUI runtime, no banned hooks.** Any TSX obeys CLAUDE.md (no
   `useState`/`useEffect`/`useContext`/`useReducer`; `useSignal*` + `useRef`; i18n-defaulted strings).
5. **Validation never throws on bad input:** `validateView` (and, if built, the `cvl` parser) return
   structured errors so untrusted LLM output degrades gracefully.
6. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check`,
   `breakpoint:check`, `fallback:check` green.
7. **Deferred ≠ forgotten:** keep the roadmap's "Deferred / revisit when" table current; revisit when a
   trigger fires.
</content>
