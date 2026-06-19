# cascivo — Roadmap v40: OpenUI Study — Make Agent-Generated UI Reliable (Bounded Vocabulary + Conformance)

**Last updated:** 2026-06-19
**Status:** 🟡 Planned (T1–T2 core; T3 optional)
**Plan documents:** `docs/superpowers/plans/2026-06-19-v40-master-plan.md` + tranches 1–3
**Builds on:** the existing — and **dogfooded** — generative-UI stack: `@cascivo/render` (`ViewConfig` JSON
+ `CascadeView`, `packages/render`), surfaced on the landing page (`apps/landing/src/sections/AgentLayer.tsx`,
`JsonPlayground.tsx`), the docs playground (`apps/docs/src/pages/PlaygroundPage.tsx`), the CLI
(`packages/cli/src/commands/generate.ts`), and six example apps. Plus `component.meta.ts` manifests feeding
`@cascivo/mcp` (incl. `scaffold-view.ts`) and `registry.json`.

---

## Why this roadmap exists

The brief was to **study [OpenUI](https://openui.com) — "The Open Standard for Generative UI"
([thesysdev/openui](https://github.com/thesysdev/openui))** and find concepts/UX/DX/AI ideas worth adopting
into cascivo.

The honest headline from the study: **cascivo already has the AI-first foundation OpenUI assumes a design
system lacks** — manifests, an MCP server, a registry, AI components (`@cascivo/ai`), **and a runtime
JSON→UI renderer** (`@cascivo/render`: `ViewConfig` JSON rendered by `CascadeView`). The renderer is not an
experiment — it is a **flagship demo** on the landing page (marketed as "perfect for AI agents"), in the
docs playground, the CLI, and example apps. So v40 is **not** about building generative UI from scratch.

**The scope was deliberately trimmed after a value review** (see the decision log below). The original study
surfaced five adoptable ideas; on reflection only the two that improve **reliability of agent-generated UI**
clear the "Simplicity First / nothing speculative" bar as core work. The rest is either an optional
positioning play (one) or deferred until a real use case exists (two).

The single biggest added value is this: **turn the manifests into a bound vocabulary so an LLM cannot go
off-rails.** That moves the existing `AgentLayer` demo from "renders whatever JSON it's handed, errors when
wrong" to "the model is structurally prevented from inventing components, props, or enum values." For a
product whose entire thesis is *AI-first design system*, **reliability of agent generation is the moat —
more than token savings or streaming polish.** And it is nearly free, because the manifests already encode
everything the grammar needs.

This document records the full study (so the deferral decisions are auditable), then scopes the trimmed
roadmap.

---

## OpenUI at a glance (what the study found)

[OpenUI](https://openui.com) (`openui.com`, `thesysdev/openui`, MIT) is a **full-stack generative-UI
framework** in three layers:

| Layer                | What it is                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **OpenUI Lang**      | A compact, **streaming-first DSL** for model-generated UI — line-oriented `identifier = Expression`, `root = Stack([...])`, component calls, primitives/arrays/objects, data binding, interactions. Claimed **up to 67% fewer tokens than JSON** (52.8% vs Vercel JSON-Render; 0°C, GPT-5.2, `tiktoken`, 7 scenarios) |
| **Component library**| Components defined with schemas; a **system prompt is generated from the library** so the model can only emit registered components/props — a *bound vocabulary* that suppresses hallucination; validated against JSON Schema |
| **React runtime**    | A **streaming parser** + **React renderer** that paints **progressively** as the model streams; a CLI + ready-made chat UIs |

A sibling project also named **OpenUI** ([ctate/openui](https://github.com/ctate/openui), "AI-Native
Specification for UIs") proposes an **OpenAPI-for-components** file (`openui.yaml`/`openui.json` at repo
root) for AI tools to discover. (And note **[wandb/openui](https://github.com/wandb/openui)** — an unrelated
"describe-and-render" playground; mentioned only to disambiguate.)

### Concept map: OpenUI → cascivo

| OpenUI concept                              | cascivo today                                                       | Verdict |
| ------------------------------------------- | ------------------------------------------------------------------- | ------- |
| Render tree → live UI                       | `@cascivo/render` `ViewConfig` + `CascadeView` (dogfooded)          | ✅ already have |
| Component library / schema                  | `component.meta.ts` manifests + `registry.json` + `componentMap`    | ✅ already have |
| AI components (chat, streaming text)        | `@cascivo/ai` `AiChat` / `StreamingText` / `Terminal`               | ✅ already have |
| MCP / agent tooling                         | `@cascivo/mcp` (OpenUI has none)                                    | ✅ already have |
| Data binding / actions                      | `bind: $data.*` / `events: $actions.*` in `ComponentNode`          | ✅ already have |
| **System-prompt / grammar from the library**| `scaffoldView` is a *keyword* matcher, not a bound vocabulary       | ⬅ **adopt — T1 (core)** |
| **Deep conformance validation** (props/enums)| `validateView` checks names + ref prefixes only, not props          | ⬅ **adopt — T2 (core)** |
| **Token-efficient compact DSL** (vs JSON)   | `ViewConfig` is verbose JSON                                        | 🟡 **optional — T3** |
| **Streaming / progressive render**          | `CascadeView` needs a complete config                              | ⏸ **deferred** |
| **Public interop spec** (`openui.*`)        | `registry.json` is cascivo's own schema only                       | ⏸ **deferred** |

### Explicitly rejected (does not fit cascivo)

- **OpenUI's React runtime + component libraries + chat UI** — cascivo owns ~140 components + `@cascivo/ai`.
  Importing OpenUI's runtime would duplicate and contradict "owned code." (Same posture as v39 rejecting
  Base UI.)
- **LiteLLM / multi-provider proxy** — cascivo is a design system, not an LLM gateway; defaults to Claude.
- **Zod as a schema dependency** — cascivo validates with its own JSON Schema + `validate.ts`; the
  dependency policy keeps runtime deps minimal. v40 extends the existing validator instead.

---

## What's worth adopting (trimmed)

| #   | Workstream                                       | Tranche | Status   | Category | Why this tier |
| --- | ------------------------------------------------ | ------- | -------- | -------- | ------------- |
| A   | **Library-derived prompt + grammar** (bound vocabulary) | T1 | **core** | AI | Highest leverage, nearly free (manifests exist), directly hardens the flagship demo |
| B   | **Deep conformance validation** (props/enums)    | T2      | **core** | AI / correctness | Closes a real hole; the enforcement backstop for T1 |
| C   | **`cvl` compact DSL** ↔ `ViewConfig`             | T3      | optional | DX / positioning | Real differentiator *story*, but permanent maintenance cost; build only as a deliberate bet |
| —   | Streaming / progressive rendering                | —       | deferred | UX | Demo polish; needs a real live-streaming use case (and ideally T3) first |
| —   | `openui.json` interop export                      | —       | deferred | interop | OpenUI ecosystem is brand-new — exporting to an audience that barely exists yet |

### Why T1 + T2 are the core (and the rest is not)

1. **T1 — prompt + grammar from manifests (the real value).** OpenUI's anti-hallucination mechanism is a
   system prompt generated from the component library so the model emits only registered components/props.
   cascivo's `scaffoldView` is a keyword matcher. Deriving a **bound-vocabulary prompt + grammar** from
   `component.meta.ts` makes every agent generation valid-by-construction and always in sync with the
   components. It targets the **JSON `ViewConfig`** format that already ships and is dogfooded — no new wire
   format required. This is the cheapest, most on-thesis change with the largest reliability payoff.
2. **T2 — deep conformance validation (the backstop).** Today `validateView` checks that a component exists
   and that `bind`/`events` use the right prefixes — but **not** prop names, types, or enum values, so a
   model can emit a real component with invented props and it renders silently. Validating props against the
   manifests closes that hole and enforces what T1 asks the model to do.
3. **T3 — `cvl` (optional, positioning).** OpenUI Lang's ~50–67% token saving over JSON is real, but token
   *cost* only bites at volume — and the renderer is today a **showcase**, not a metered production path. So
   `cvl` is not justified on cost; it is justified (if at all) as a **benchmarkable differentiator story**
   ("our generative-UI format is ~50% cheaper than JSON") that upgrades the landing pitch. Weighed against
   it: a hand-written DSL + parser + grammar to keep in lockstep with `ViewConfig` **forever**. Build it
   only as a deliberate strategic bet; it is sequenced last and may be cut cleanly.
4. **Deferred — streaming + interop.** Streaming/progressive render is genuine UX polish but only pays off
   with a real live-streaming product (which doesn't exist yet) and is most useful atop `cvl`. The
   `openui.json` interop export is cheap and additive, but unlike v39's shadcn interop (huge install base),
   the OpenUI ecosystem is immature — there's little to consume it. Both are recorded in "Deferred /
   revisit when" with clear trigger conditions, not built now.

---

## What exists today (verified against the codebase)

| Area                       | State                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Render schema              | `ViewConfig = { $schema?, version?: 1, view: { layout?, regions: Record<string, ComponentNode[]> } }`; node = `{ component, props?, bind?: $data.*, events?: $actions.*, children? }` (`packages/render/src/types.ts`); JSON Schema at `packages/render/schema/view.v1.json` |
| Renderer (dogfooded)       | `CascadeView` (`packages/render/src/cascade-view.tsx`) → landing `AgentLayer`/`JsonPlayground`, docs `PlaygroundPage`, CLI `generate`, 6 example apps |
| Validation                 | `validateView(config)` (`packages/render/src/validate.ts`) — `component in componentMap` (Levenshtein "did you mean"), `$data.`/`$actions.` prefixes, recurses children. **No prop type/enum checks.** |
| Scaffold (current "AI")    | `scaffoldView(input, registry)` (`packages/mcp/src/scaffold-view.ts`) — **keyword** layout/component picker; not an LLM grammar/prompt |
| Manifests                  | `component.meta.ts` per component (props w/ type/enum/default, variants, sizes) → MCP/docs/registry        |
| AI components / MCP        | `@cascivo/ai` (`StreamingText`, `AiChat`, …); `@cascivo/mcp` server tools                                   |
| Compact DSL / streaming    | **None** — `ViewConfig` JSON only; `CascadeView` is one-shot                                                |

---

## Target state (after v40 core, T1–T2)

| Concern                          | Today                                  | Target (T1–T2)                                                          |
| -------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| LLM output guidance              | keyword scaffolder                     | prompt + grammar generated from manifests (bound vocabulary, valid-by-construction `ViewConfig`) |
| Validation                       | names + ref prefixes                   | + prop **type/enum** conformance against manifests (unknown prop, type mismatch, out-of-enum) |
| Flagship demo reliability        | renders any JSON; silent on bad props  | model bounded to real API; bad props caught with actionable errors     |
| Docs                             | —                                      | OpenUI study recorded; prompt/grammar + conformance documented; deferred items logged with triggers |
| Full CI gate (`pnpm ready`)      | green                                  | green                                                                  |

(If T3 ships: `cvl` ↔ `ViewConfig` lossless round-trip + a recorded token-saving benchmark.)

---

## Key decisions (recommendations in the master plan)

1. **Trim to reliability-first.** _Recommendation: ship **T1 + T2** as core; treat **T3 (`cvl`)** as an
   optional, separately-justified bet; **defer** streaming and `openui.json` interop._ The reliability work
   captures ~80% of the value for ~40% of the surface area and is squarely in line with "Simplicity First."
2. **T1 targets JSON `ViewConfig`, not a new format.** _Recommendation: generate the prompt + grammar for the
   format that already ships and is dogfooded._ It needs no `cvl`; if `cvl` (T3) lands later, the prompt
   gains an optional `cvl` section. Keeps T1 valuable on its own.
3. **Grammar fidelity.** _Recommendation: generate a **prompt + a machine-checkable allowed-vocabulary**
   (components → props → enums/sizes/variants) from the manifests, not free prose._ A test asserts every
   referenced name exists in the registry, so it can never drift from the components.
4. **Conformance by extending the validator, no Zod.** _Recommendation: extend `validateView` to validate
   props against manifest types/enums, reusing the Levenshtein "did you mean" UX for prop names._ Keeps the
   no-extra-deps policy. Do not weaken existing checks.
5. **`cvl` (if built) is additive; JSON stays canonical.** _Recommendation: a submodule under
   `packages/render/src/lang/` (exported from `@cascivo/render`), lossless `encode`/`parse` round-trip,
   `ViewConfig` JSON unchanged; name **Cascade View Language / `cvl` / `.cvl`**._ A new `@cascivo/lang`
   package is rejected (workspace-alias maintenance for no benefit).
6. **Deferred items get trigger conditions, not silence.** _Recommendation: record streaming and interop in a
   "Deferred / revisit when" section so the decision is explicit and reversible_ (e.g. "build streaming when a
   product streams LLM-generated views to end users"; "emit `openui.json` when a consumer/tool in the OpenUI
   ecosystem actually requests it").

---

## Cross-cutting rules

1. **Owned code, no heavy deps.** No OpenUI runtime, no LiteLLM, no Zod. The generator and the validator are
   hand-written over cascivo's existing manifests/schema.
2. **`ViewConfig` JSON is canonical and unchanged.** T1/T2 operate on it directly; `view.v1.json` and
   `CascadeView`'s contract are untouched. If T3 lands, `cvl` is additive serialization with a lossless
   round-trip as a hard test.
3. **Derived-from-manifests.** T1's grammar/prompt and T2's conformance both read `component.meta.ts` so they
   never drift; a test asserts every name they reference exists in the registry.
4. **Validation never throws on bad input.** `validateView` returns structured `{ path, message }` errors so
   untrusted LLM output degrades gracefully (the existing `CascadeView onInvalid` contract is preserved).
5. **Generated artifacts stay in sync.** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready`
   green before each commit.

---

## Definition of Done

### T1 — Library-derived prompt + grammar generation (core)

- [ ] A generator (in `@cascivo/mcp` and/or `@cascivo/render`) produces, from the manifests, a **system
      prompt** + an **allowed-vocabulary grammar** (components → props → enums/sizes/variants) describing how
      to emit valid **`ViewConfig` JSON** bounded to cascivo's real components.
- [ ] Bounded: a test asserts every component/prop/enum it references exists in the registry/manifests.
- [ ] Exposed to agents (a new MCP tool or an extension of `scaffold_*`); documented.
- [ ] `pnpm exec vp run @cascivo/mcp#test` green.

### T2 — Deep conformance validation (core)

- [ ] `validateView` validates node **props against manifest types/enums** (unknown prop with Levenshtein
      "did you mean", type mismatch, out-of-enum) with actionable `{ path, message }` errors; existing checks
      unchanged.
- [ ] Tests cover: unknown prop, bad enum value, type mismatch, and a valid view (no errors).
- [ ] `pnpm exec vp run @cascivo/render#test` green (existing `validate.test.ts` still passes).

### T3 — `cvl` compact DSL (optional)

- [ ] `packages/render/src/lang/` ships `encode(config): string` / `parse(src): { config, errors }`,
      exported from `@cascivo/render`; lossless round-trip on every fixture; a recorded token-saving benchmark.
- [ ] T1's prompt gains an optional `cvl` section; T2's conformance applies to parsed `cvl` too.
- [ ] `pnpm exec vp run @cascivo/render#test` green. **May be cut cleanly without affecting T1/T2.**

### Roadmap close-out

- [ ] This roadmap + the prompt/grammar (T1) and conformance (T2) documented (READMEs + a docs section);
      "Deferred / revisit when" section records streaming + `openui.json` interop with trigger conditions.
- [ ] `pnpm regen`; drift gate green; full CI gate passes: `vp check`, `pnpm build`, `vp run -r check`,
      `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`.

---

## Deferred / revisit when

| Idea | Build it when… | Notes |
| ---- | -------------- | ----- |
| **Streaming / progressive rendering** | a product actually streams LLM-generated views to end users (live latency matters) | Most useful atop `cvl` (T3); signal-driven (`useSignalEffect`, no `useEffect`); can reuse `@cascivo/ai` `StreamingText` for text leaves |
| **`openui.json` interop export** | a real consumer/tool in the OpenUI ("AI-Native Spec") ecosystem requests it, or that ecosystem gains an install base | Additive emitter in `packages/registry`, derived from manifests, leaving `registry.json` + the v39 shadcn output untouched (same pattern as v39 Decision 6) |
| **Docs generative-UI playground upgrade** | T3 or streaming lands and you want to showcase it | A `cvl`/streaming text box driving the existing `CascadeView` in `apps/docs` |
</content>
