# cascivo — Roadmap v40: OpenUI Study — Adopt Generative-UI Token-Efficiency, Grammar & Streaming

**Last updated:** 2026-06-19
**Status:** 🟡 Planned (T1–T5)
**Plan documents:** `docs/superpowers/plans/2026-06-19-v40-master-plan.md` + tranches 1–5
**Builds on:** the existing generative-UI stack — `@cascivo/render` (`ViewConfig` JSON + `CascadeView`,
`packages/render`), `@cascivo/ai` (StreamingText / AiChat / Terminal, `packages/ai`), the
`component.meta.ts` manifests feeding `@cascivo/mcp` (`packages/mcp`, incl. `scaffold-view.ts`), and
`registry.json` / `packages/registry`.

---

## Why this roadmap exists

The brief was to **study [OpenUI](https://openui.com) — "The Open Standard for Generative UI"
([thesysdev/openui](https://github.com/thesysdev/openui))** and find concepts, UX/DX/AI ideas worth
adopting into cascivo.

The honest headline from the study: **cascivo already has the AI-first foundation OpenUI assumes a design
system lacks.** cascivo ships `component.meta.ts` manifests, an MCP server, a `registry.json`, auto-docs,
AI-native components (`@cascivo/ai`), **and a runtime JSON→UI renderer** (`@cascivo/render`: a `ViewConfig`
JSON tree rendered by `CascadeView`, validated against the registry). So v40 is deliberately **not** a
"build generative UI from scratch" roadmap — that layer exists.

What OpenUI genuinely innovates is the set of things it builds **on top of** a JSON renderer, and those are
exactly the gaps in cascivo's current stack:

1. A **compact, streaming-first serialization** that is ~50–67% more token-efficient than JSON. cascivo's
   `ViewConfig` is the verbose JSON tree OpenUI Lang set out to beat.
2. **Library-derived prompt/grammar generation** that bounds an LLM's output vocabulary to real
   components/props/enums (prevents hallucination). cascivo's `scaffoldView` is a keyword matcher, not an
   LLM-grammar generator.
3. **Streaming / progressive rendering** — paint the skeleton before the full document arrives. `CascadeView`
   needs a complete `ViewConfig`.
4. **Deep conformance validation** against the component schema. cascivo's `validateView` checks component
   names + `$data`/`$actions` ref prefixes, but **not** prop types/enums.
5. A **public interop spec** — a standard, framework-agnostic descriptor (cf. the sibling "OpenUI =
   AI-Native Specification for UIs" `openui.yaml` idea, [ctate/openui](https://github.com/ctate/openui)) so
   the OpenUI ecosystem and external AI tools can consume cascivo. cascivo's `registry.json` is its own
   schema only.

This document records the full study so the decision **not** to rebuild the renderer is auditable, then
scopes the five adoptable workstreams — each filtered through cascivo's principles (CSS-native,
signal-driven, owned code, AI-first; no new heavy deps).

---

## OpenUI at a glance (what the study found)

[OpenUI](https://openui.com) (`openui.com`, `thesysdev/openui`, MIT) is a **full-stack generative-UI
framework** in three layers:

| Layer                | What it is                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **OpenUI Lang**      | A compact, **streaming-first DSL** for model-generated UI — line-oriented `identifier = Expression`, `root = Stack([...])`, component calls (`Table(cols, rows)`), arrays/objects/primitives, data binding, interactions |
| **Component library**| Components defined with **Zod** schemas; a **system prompt is generated from the library** so the model can only emit registered components/props (a *bound vocabulary* that suppresses hallucination); validated against JSON Schema |
| **React runtime**    | A **streaming parser** (`@openuidev/lang-core`) + **React renderer** (`@openuidev/react-lang`) that maps parsed elements to the library's components and paints **progressively** as the model streams; a CLI (`@openuidev/cli`) and ready-made chat UIs |

**The headline claim:** OpenUI Lang is **up to 67% fewer tokens than equivalent JSON** (benchmarked at
0°C, GPT-5.2, `tiktoken`, 7 scenarios): **52.8%** vs Vercel's JSON-Render, **51.7%** vs Thesys C1 JSON
trees. The mechanism is the line-oriented DSL: the same employee table is ~148 tokens in OpenUI Lang vs
several hundred in a JSON tree. Streaming + a bound vocabulary are the other two pillars.

A sibling project also named **OpenUI** ([ctate/openui](https://github.com/ctate/openui), "AI-Native
Specification for UIs") proposes an **OpenAPI-for-components** file — an `openui.yaml`/`openui.json` at repo
root listing components, props (`type`/`enum`/`default`/`required`), and examples for AI tools to discover
and consume. It informs the **interop** workstream (T5).

> Not to be confused with **[wandb/openui](https://github.com/wandb/openui)** — a *different* tool
> ("describe UI → render live in the browser → export to React/Svelte/Web Components", LiteLLM
> multi-provider). That is a playground product, not a standard; noted only to disambiguate.

### Concept map: OpenUI → cascivo (what already exists)

| OpenUI concept                              | cascivo today                                                                 | Gap? |
| ------------------------------------------- | ----------------------------------------------------------------------------- | ---- |
| Render tree → live UI                       | `@cascivo/render` `ViewConfig` + `CascadeView`                                 | ✅ covered |
| Component library / schema                  | `component.meta.ts` manifests + `registry.json` + `componentMap`              | ✅ covered |
| AI components (chat, streaming text)        | `@cascivo/ai` `AiChat` / `StreamingText` / `Terminal`                          | ✅ covered |
| MCP / agent tooling                         | `@cascivo/mcp` (`list_components`, `get_component`, `scaffold_*`, …)           | ✅ covered (OpenUI has none) |
| Data binding / actions in the tree          | `bind: $data.*` / `events: $actions.*` in `ComponentNode`                      | ✅ covered |
| **Token-efficient compact DSL** (vs JSON)   | **— none —** `ViewConfig` is verbose JSON                                      | ⬅ **gap (T1)** |
| **System-prompt / grammar from the library**| `scaffoldView` is a *keyword* matcher, not an LLM-grammar/prompt generator     | ⬅ **gap (T2)** |
| **Streaming / progressive render**          | `CascadeView` needs a *complete* `ViewConfig`                                  | ⬅ **gap (T3)** |
| **Deep conformance validation** (props/enums)| `validateView` checks names + ref prefixes only — not prop types/enums         | ⬅ **gap (T4)** |
| **Public interop spec** (`openui.*` / std)  | `registry.json` is cascivo's own schema only                                  | ⬅ **gap (T5)** |

**Conclusion:** the generative-UI *renderer* already exists. The five net-new things are the
**efficiency / grammar / streaming / conformance / interop** layers OpenUI built on top of one.

### Explicitly rejected (does not fit cascivo)

- **OpenUI's React runtime + built-in component libraries + chat UI** — cascivo has its own ~140 components
  and `@cascivo/ai` (`AiChat`, `StreamingText`). Importing OpenUI's runtime would duplicate and contradict
  "owned code." **Not adopted** (same posture as v39 rejecting Base UI).
- **LiteLLM / multi-provider proxy** — cascivo is a design system, not an LLM gateway; it defaults to
  Claude. Provider routing is out of scope. **Not adopted.**
- **Zod as a schema dependency** — cascivo validates with its own JSON Schema (`packages/render/schema/`)
  + `validate.ts`; the dependency policy keeps runtime deps minimal. v40 extends the existing validator
  rather than adopting Zod. **Not adopted.**
- **A `wandb/openui`-style hosted "describe-and-render" product** — overlaps cascivo's docs + skills; out of
  scope as a product. (A small **docs playground** that drives the *existing* renderer is noted as optional
  in T5, not core.)

---

## What *is* worth adopting (the five workstreams)

| #   | Workstream                                       | Tranche | Origin in OpenUI                                                | Category |
| --- | ------------------------------------------------ | ------- | -------------------------------------------------------------- | -------- |
| A   | **Cascade View Language (`cvl`)** — compact DSL ↔ `ViewConfig` | T1 | OpenUI Lang's line-oriented, token-efficient DSL              | AI / DX |
| B   | **Library-derived prompt + grammar generator**   | T2      | "System-prompt generation from the library" (bound vocabulary) | AI |
| C   | **Streaming / progressive rendering**            | T3      | OpenUI's streaming parser + progressive React renderer         | AI / UX |
| D   | **Deep conformance validation** (props/enums)    | T4      | OpenUI's schema-validated, hallucination-resistant output      | AI / correctness |
| E   | **`openui.json` interop export** + docs & gate   | T5      | The "AI-Native Specification for UIs" (`openui.yaml`) sibling  | DX / interop |

Why these five, and why in this order:

1. **T1 — `cvl` (the wire format, foundation).** Define a compact, line-oriented serialization that
   round-trips losslessly with the existing `ViewConfig` JSON, plus a **token-count benchmark** proving the
   savings on cascivo's own views. This is the literal lesson of OpenUI Lang and the foundation T2/T3 build
   on. It's purely additive — `ViewConfig` JSON stays the canonical in-memory form; `cvl` is the
   over-the-wire / LLM-output form.
2. **T2 — Prompt + grammar generation.** Generate, from the `component.meta.ts` manifests, the **system
   prompt + grammar** an LLM needs to emit valid `cvl` bounded to cascivo's real components, props, enums,
   sizes, and variants. Upgrades today's keyword-matching `scaffoldView` into a true bound-vocabulary
   generator. Depends on T1 (it must describe the `cvl` format).
3. **T3 — Streaming / progressive rendering.** A signal-driven streaming parser (partial/invalid-tolerant)
   + a `CascadeView` mode that paints regions/nodes as they arrive — "skeleton before the full document."
   Reuses `@cascivo/ai` streaming idioms; obeys the reactivity rules (`useSignalEffect`, no `useEffect`).
   Depends on T1's parser.
4. **T4 — Deep conformance validation.** Extend `validateView` to check prop **types and enums** against the
   manifests (today it only checks component existence + ref prefixes), and make the `cvl` parser tolerant
   of partial/invalid streamed input. Hardens both T1 and T3.
5. **T5 — Interop export + docs + gate.** Emit a standard, framework-agnostic `openui.json` (the AI-native
   spec) from the manifests/registry so the OpenUI ecosystem and external AI tools can discover cascivo —
   additive interop, like v39's shadcn-registry emitter. Then document the whole roadmap and run the full
   gate + drift.

---

## What exists today (verified against the codebase)

| Area                       | State                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Render schema              | `@cascivo/render` `ViewConfig` = `{ view: { layout?, regions: Record<string, ComponentNode[]> } }`; node = `{ component, props?, bind?, events?, children? }` (`packages/render/src/types.ts`); JSON Schema at `packages/render/schema/view.v1.json` |
| Renderer                   | `CascadeView` (`packages/render/src/cascade-view.tsx`) maps nodes via `component-map.ts`; **needs a complete config** |
| Validation                 | `validateView(config)` (`packages/render/src/validate.ts`) — checks `component in componentMap` (with Levenshtein "did you mean"), `$data.`/`$actions.` ref prefixes, recurses children. **No prop type/enum checks.** |
| Scaffold                   | `scaffoldView(input, registry)` (`packages/mcp/src/scaffold-view.ts`) — **keyword** layout/component picker; not an LLM grammar/prompt |
| AI components              | `@cascivo/ai`: `StreamingText`, `AiChat`, `Terminal`, `AiLabel` (`packages/ai/src/index.ts`)               |
| MCP                        | `@cascivo/mcp` server (`list_components`, `get_component`, `create_theme`, `scaffold_*`, `add_to_project`)  |
| Manifests                  | `component.meta.ts` per component (name, props w/ type/enum/default, variants, sizes, …) → MCP/docs/registry |
| Registry / distribution    | `registry.json` (cascivo's own schema), `packages/registry/src/build.ts`; shadcn-interop emitter added v39  |
| Compact DSL                | **None** — `ViewConfig` JSON only                                                                           |
| Streaming render           | **None** — `CascadeView` is one-shot                                                                        |
| Public interop spec        | **None** beyond cascivo's own `registry.json` (+ v39 shadcn `/r/<name>.json`)                               |

---

## Target state (after v40)

| Concern                          | Today                                  | Target                                                                              |
| -------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| Render wire format               | verbose `ViewConfig` JSON only         | `cvl` compact DSL ↔ `ViewConfig` (lossless round-trip) + token benchmark (~≥40% fewer) |
| LLM output guidance              | keyword scaffolder                     | prompt + grammar generated from manifests (bound vocabulary, valid-`cvl`-by-construction) |
| Rendering                        | one-shot (complete config)             | optional streaming/progressive render (skeleton-first), signal-driven                |
| Validation                       | names + ref prefixes                   | + prop **type/enum** conformance against manifests; partial/invalid-tolerant parse  |
| Interop                          | cascivo registry (+ shadcn `/r/*`)     | standard `openui.json` AI-native spec emitted from manifests (additive)             |
| Docs                             | —                                      | OpenUI study recorded; `cvl` + prompt-gen + streaming + interop documented           |
| Full CI gate (`pnpm ready`)      | green                                  | green                                                                                |

---

## Key open decisions (recommendations in the master plan)

1. **Build a compact DSL at all, or keep JSON?** _Recommendation: **build `cvl`**, but keep `ViewConfig`
   JSON as the canonical in-memory form._ OpenUI Lang's 50–67% token saving is real and directly lowers LLM
   cost/latency for every generated view; the DSL is purely a serialization (encode/parse) over the schema
   cascivo already has. Risk is low because round-trip is lossless and JSON stays authoritative. Rejected
   alternative: do nothing (leaves cascivo paying the JSON token tax that OpenUI exists to remove).
2. **Where does `cvl` live — new package or submodule?** _Recommendation: a **submodule** under
   `packages/render/src/lang/` (exported from `@cascivo/render`), not a new `@cascivo/lang` package._ It
   compiles to/from `ViewConfig`, so it belongs with the schema; a new package would add workspace-alias
   maintenance (CLAUDE.md "workspace package aliases — keep in sync") for no benefit. `@cascivo/lang`
   rejected on Simplicity-First grounds.
3. **Name + extension.** _Recommendation: **Cascade View Language**, abbreviated **`cvl`**, files `.cvl`._
   Matches `CascadeView`/`ViewConfig`; short and greppable. Alternatives `cv`/`casc`/`cascade-lang`
   rejected (ambiguous or verbose).
4. **Grammar fidelity for T2.** _Recommendation: generate a **prompt + a machine grammar** (the allowed
   component/prop/enum surface) from the manifests, not free prose._ A bound vocabulary is OpenUI's
   anti-hallucination mechanism; deriving it from `component.meta.ts` keeps it always in sync. Optional
   stretch: emit a formal grammar artifact for constrained decoding — flagged, not required.
5. **Streaming scope for T3.** _Recommendation: a **progressive `CascadeView` mode** that renders complete
   nodes as they parse, with a skeleton/placeholder for in-flight nodes._ Signal-driven
   (`useSignal`/`useSignalEffect`, never `useEffect`), partial-tolerant. Do **not** attempt mid-prop partial
   rendering (paint a node only once it parses cleanly). Full token-by-token character streaming of text
   leaves can reuse `@cascivo/ai` `StreamingText`.
6. **Interop spec shape for T5.** _Recommendation: emit a standard `openui.json` (and/or `.yaml`) **from the
   manifests/registry**, additive, alongside the existing outputs — do **not** change `registry.json`._ Same
   posture as v39's shadcn emitter: pure interop, zero blast radius. Document discovery (root-level file)
   and the CSS-native caveats (cascivo ships CSS Modules + `@cascivo/themes`, not Tailwind).
7. **Validation: extend, don't adopt Zod.** _Recommendation: **extend `validateView`** to read prop
   types/enums from the manifests and validate node props against them._ Keeps the no-extra-deps policy;
   reuses the existing Levenshtein "did you mean" UX for prop names too.

---

## Cross-cutting rules

1. **Owned code, no heavy deps.** Adopt ideas, not OpenUI's stack. No OpenUI runtime, no LiteLLM, no Zod.
   `cvl` and the validator are hand-written over cascivo's existing schema; the streaming renderer uses
   `@cascivo/core` signals + `@cascivo/ai` idioms.
2. **`ViewConfig` JSON stays canonical.** `cvl` is additive serialization; the in-memory form, the JSON
   Schema (`view.v1.json`), and `CascadeView`'s contract are unchanged. Round-trip
   (`parse(encode(config)) === config`) is a hard test.
3. **Reactivity rules apply.** Any new TSX (streaming renderer) obeys CLAUDE.md: no
   `useState`/`useEffect`/`useContext`/`useReducer`; `useSignal*` + `useRef` only; `useSignals()` when
   reading signals during render in React apps; DOM side effects via `useSignalEffect`.
4. **Interop is additive.** The `openui.json` emitter is net-new output; `registry.json`'s own schema and
   the v39 shadcn output are untouched.
5. **AI-first discipline.** The prompt/grammar generator and the interop spec both derive from
   `component.meta.ts` so they never drift from the components; `pnpm regen` refreshes generated artifacts.
6. **Generated artifacts stay in sync.** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready`
   green before each commit. No off-scale breakpoint literals (`breakpoint:check`); CSS `@function`/`if()`
   only with static fallbacks (`fallback:check`).

---

## Definition of Done

### T1 — Cascade View Language (`cvl`) — compact DSL ↔ `ViewConfig`

- [ ] `packages/render/src/lang/` ships `encode(config: ViewConfig): string`, `parse(src: string): ViewConfig`,
      and types, exported from `@cascivo/render`.
- [ ] Round-trip is lossless on every cascivo example view: `parse(encode(config))` deep-equals `config`
      (property-style test over fixtures incl. `bind`/`events`/`children`/`$t` translation refs).
- [ ] A token-count benchmark (using a tokenizer or a documented proxy) shows `cvl` is materially smaller
      than the JSON for the sample views; the number is recorded in the README.
- [ ] `pnpm exec vp run @cascivo/render#test` green.

### T2 — Library-derived prompt + grammar generation

- [ ] A generator (in `@cascivo/mcp` and/or `@cascivo/render`) produces, from the manifests, a **system
      prompt** + the **allowed-vocabulary grammar** (components → props → enums/sizes/variants) describing how
      to emit valid `cvl`.
- [ ] Output is bounded: every component/prop/enum it mentions exists in the registry; a test asserts the
      generated grammar references only real registry entries.
- [ ] The MCP `scaffold_*` path can return the prompt/grammar (or a new tool does); documented.
- [ ] `pnpm exec vp run @cascivo/mcp#test` green.

### T3 — Streaming / progressive rendering

- [ ] A streaming parser consumes `cvl` incrementally and yields complete nodes as they finish; a
      `CascadeView` streaming mode (or `StreamingView`) paints them progressively with placeholders for
      in-flight nodes.
- [ ] Signal-driven: `useSignal`/`useSignalEffect` only — **no** `useState`/`useEffect`; passes the React
      explicit-subscription rule (`useSignals()`); text leaves may reuse `@cascivo/ai` `StreamingText`.
- [ ] A test feeds chunked `cvl` and asserts intermediate renders show the already-parsed nodes and the
      final render equals the one-shot render.
- [ ] `pnpm exec vp run @cascivo/render#test` green.

### T4 — Deep conformance validation

- [ ] `validateView` (or a sibling) validates node **props against manifest types/enums** (unknown prop,
      wrong type, out-of-enum value) with actionable messages, reusing the Levenshtein "did you mean" UX for
      prop names.
- [ ] The `cvl` parser tolerates partial/invalid input (returns structured errors, never throws) so
      streaming (T3) degrades gracefully.
- [ ] Tests cover: unknown prop, bad enum value, type mismatch, truncated `cvl`.
- [ ] `pnpm exec vp run @cascivo/render#test` green.

### T5 — `openui.json` interop export + docs & final gate

- [ ] An emitter produces a standard, framework-agnostic `openui.json` (AI-native component spec:
      name/description/props/enum/default/example) derived from the manifests/registry — additive, no change
      to `registry.json` or the v39 shadcn output.
- [ ] A smoke test validates the emitted spec's shape against the documented schema.
- [ ] This roadmap + `cvl` + prompt-gen + streaming + interop documented (READMEs + a docs section);
      CSS-native interop caveats noted.
- [ ] `pnpm regen`; drift gate green; full CI gate passes: `vp check`, `pnpm build`, `vp run -r check`,
      `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`.
</content>
</invoke>
