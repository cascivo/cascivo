# cascade — Roadmap v13: The Context Layer

**Last updated:** 2026-06-13
**Status:** 📋 Planned (builds on v12 — The Long Run)
**Plan documents:** `docs/superpowers/plans/2026-06-13-v13-master-plan.md` + tranches 1–6

---

## Vision

v11 opened cascade into an ecosystem; v12 made adopting it safe for years. v13 makes it
**generate correctly under AI**. Three pieces of 2026 industry writing converge on the same
gap, and cascade sits on the wrong side of it:

1. _"AI doesn't recognize and implement components in isolation. What AI consumes — and
   amplifies — is **context**."_ (Robin Cannon, "Design systems are over — product context")
2. _"Treat design decisions as infrastructure. Maintain an exhaustive token layer so AI
   selects from closed sets rather than inventing values. Add an audit layer that detects
   hard-coded values and missing states."_ (Smashing, "How to make a design system AI-ready")
3. _"CSS `@function` and `if()` let style logic — math, conditionals, type-safe utilities —
   live in the stylesheet instead of JavaScript."_ (Frontend Masters, "The fundamentals and
   dev experience of CSS `@function`")

cascade today publishes the **structure** of the system — `component.meta.ts` manifests,
`registry.json`, the three-level token CSS, the MCP server, `llms.txt`. That is the _WHAT_.
What it does not publish is the _WHY_: when to use a component versus its neighbour, what
not to do, which areas are strict versus flexible, the rationale behind an a11y decision,
the tone of user-facing copy. An AI agent handed the manifest gets shape without
constraint — so it produces output that compiles and looks plausible but drifts: it reaches
for `Alert` when the situation calls for `Toast`, hard-codes `#3b82f6` instead of
`var(--cascade-color-accent)`, and silently violates the invisible rules that live in
`CLAUDE.md`, the roadmaps, and nobody's head.

> Concept: **"The context layer."** cascade ships the WHAT. v13 ships the WHY — as
> machine-readable infrastructure an agent reads _before_ it writes, plus an audit that
> checks what it wrote _after_. And where modern CSS can now carry logic the WHAT used to
> push into JS, v13 moves it into the stylesheet, progressively.

## The diagnosis (pain → what cascade has → what's missing)

| #   | Pain                                  | cascade today (incl. v12)                                                          | Gap v13 closes                                                                                                                           |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Intent is undocumented                | `ComponentMeta` = props, tokens, states, variants, a11y role, examples — pure WHAT | No when-to-use / when-not, no anti-patterns, no component-selection edges, no a11y rationale, no content/tone — AI gets shape not intent |
| 2   | Closed sets aren't AI-explicit        | Three-level token CSS exists; `llms.txt` + MCP expose components                   | The token set is not published as a closed, machine-readable catalog — AI invents literal values instead of selecting named tokens       |
| 3   | No audit of AI output                 | v12 CSS-contract test runs **inside our repo** on our CSS                          | Nothing checks the code an agent writes in the **user's** repo: hard-coded values, invented props, missing required wiring, raw strings  |
| 4   | Context is fragmented                 | Rules scattered across `CLAUDE.md`, roadmaps, manifests, theme files               | No single machine-readable bundle; boundaries (strict vs flexible) and historical exceptions are tribal knowledge AI can't read          |
| 5   | Conditional/variant logic is JS-bound | Variant→token mapping lives in TSX + CSS class switches                            | Modern CSS (`@function`, `if(style())`) can express token math + conditional styling declaratively; cascade ships none of it             |
| 6   | The claims need proof                 | "AI-first" is in the tagline                                                       | No reproducible receipt that an agent generates better cascade code with the context layer than without                                  |

## The pitch additions (extends v12's claims 1–13)

| #   | Claim                              | Substance                                                                                                                                             |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | **AI gets intent, not just shape** | Every component ships when-to-use, when-not, anti-patterns, a11y rationale, and selection edges to its neighbours — machine-read.                     |
| 15  | **Closed sets, machine-readable**  | A published token catalog + component/prop index let an agent _select_ from a closed set; inventing a value is now a detectable error.                |
| 16  | **AI output is audited**           | `cascade audit --ai` flags hard-coded values, invented APIs, and missing required wiring in **your** code — the FigmaLint moment for generated React. |
| 17  | **Context is consolidated**        | One `context.json` + per-component `context.md` + enriched `llms.txt` unify the rules, boundaries, and exceptions scattered today.                    |
| 18  | **Logic goes CSS-native**          | `@function` token math + `if(style())` conditional styling, behind `@supports` fallbacks — less JS, more declarative, zero regression.                |
| 19  | **Receipts, not adjectives**       | A Context Explorer page + a reproducible before/after agent-generation demo prove the layer changes output quality.                                   |

## Workstreams

| #   | Workstream         | Tranche | Summary                                                                                                                                                          |
| --- | ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Intent schema      | T1      | Extend `ComponentMeta` with an `intent` block (when-to-use/not, anti-patterns, related edges, a11y rationale, content tone, flexibility); backfill all 72 items. |
| B   | Context surfaces   | T2      | Token-catalog generator (closed set), consolidated `context.json`, per-component `context.md`, enriched `llms.txt`, new MCP tools.                               |
| C   | AI-output audit    | T3      | `cascade audit --ai <paths>` — hard-coded values vs catalog, invented/missing props vs registry, raw strings vs i18n, with fix hints.                            |
| D   | Specs + governance | T4      | Machine-readable design-decision spec files (`specs.json`), strict-vs-flexible boundary registry, decisions/exceptions log; folded into context.                 |
| E   | CSS-native logic   | T5      | Progressive `@function`/`if(style())` adoption for token math + variant selection on a pilot set, behind `@supports` fallbacks + fallback audit.                 |
| F   | Receipts + launch  | T6      | Context Explorer docs page, "Why cascade" claims 14–19 with receipts, README/llms refresh, before/after demo, DoD walkthrough.                                   |

## Decisions baked in

1. **Intent lives in the manifest, not a side file.** `ComponentMeta` gains an optional
   `intent` block. It is optional at the type level (additive, no break) but **required by
   a CI completeness check** for first-party components — the factory template includes it,
   so new components ship intent from day one.
2. **The token catalog is generated, never hand-maintained.** A script parses
   `packages/tokens/src/index.css` (and theme files for resolved defaults) into a closed-set
   JSON: every `--cascade-*` custom property with its value, layer (primitive/semantic/
   component), and group. This is the single source AI selects from; the CSS file stays the
   source of truth.
3. **`context.json` is a consolidation, not a new source.** It is generated by joining the
   registry, the intent blocks, the token catalog, the design specs (T4), and the authoring
   rules. Editing it by hand is forbidden; the drift gate (`git diff --exit-code`) enforces it.
4. **`audit --ai` reports against the closed set, honestly.** It flags a literal color/size
   only when an equivalent token exists in the catalog (with the suggested token); it flags
   a prop only when the JSX element is a known cascade component and the prop is absent from
   that component's registry props. It never claims code is "correct" — it reports
   _detectable deviations from the published contract_. Unknown elements are skipped, not
   guessed.
5. **Specs are markdown the agent reads, plus a generated index.** Following the AI-ready
   article, design decisions become structured spec files in `docs/specs/`; a generator
   emits `specs.json` for machine consumption. The strict-vs-flexible boundaries come from
   the per-component `intent.flexibility` (T1) plus a small global boundary file.
6. **CSS-native logic is progressive enhancement, never a dependency.** Every `@function`
   or `if(style())` use ships with a static `@supports`-guarded fallback that reproduces the
   current value. An audit asserts the fallback exists. cascade still works pixel-identically
   in Safari/Firefox; the CSS-native path is a Chrome-leading bonus, in line with the alpha,
   accepted-risk stance for emerging platform features.
7. **The CSS-native pilot is small and reversible.** Two or three components (Button, Badge,
   Alert) get the `@function`/`if()` treatment in v13 — enough to prove the pattern and the
   fallback discipline. A full migration is explicitly deferred; the v9 theme-parity test and
   visual diffs gate even the pilot.
8. **No new packages.** Intent types land in `@cascade-ui/core`; the token catalog, context
   bundle, and specs generators land in `scripts/` wired into the regen pipeline; MCP tools
   extend `@cascade-ui/mcp`; the audit extends the existing CLI; CSS-native partials live in
   `@cascade-ui/tokens`/component CSS. `@cascade-ui/registry` (v11) carries the intent type
   for the published registry items.

## Definition of Done

- [ ] `ComponentMeta` has an `intent` block; all 72 first-party items have it populated; a
      CI completeness check fails when a first-party component omits a required intent field;
      the factory template emits intent for new components.
- [ ] The token catalog generator emits a closed-set JSON covering every `--cascade-*`
      property with layer + group + resolved default; a drift test fails if the CSS changes
      without regeneration.
- [ ] `context.json` is generated by joining registry + intent + catalog + specs + rules;
      per-component `context.md` files and an enriched `llms.txt` are generated; editing any
      by hand and running regen restores them (drift gate green).
- [ ] MCP exposes `get_tokens`, `get_context`, and `select_component`; each returns the
      consolidated context for an agent and is covered by tests.
- [ ] `cascade audit --ai <paths>` flags, on a fixture file: a hard-coded color with the
      suggested token, an invented prop on a known component, a missing required prop, and a
      raw English string where i18n is expected — and reports clean on a correct fixture;
      `--json` works; exit code reflects findings.
- [ ] Design spec files exist in `docs/specs/` (spacing, color usage, decision hierarchy,
      content/tone); `specs.json` is generated; a boundary registry encodes strict-vs-flexible
      areas; a decisions/exceptions log records at least the real historical exceptions the
      project already has.
- [ ] The CSS-native pilot (Button + Badge + Alert) uses `@function` token math and/or
      `if(style())` variant selection, each behind an `@supports` fallback; a fallback-audit
      script fails if any `@function`/`if()` lacks a guarded fallback; the v9 theme-parity
      test stays green and a screenshot pair shows no visual regression in fallback mode.
- [ ] A Context Explorer docs page browses intent, boundaries, specs, and the token catalog,
      and runs the `audit --ai` demo; the "Why cascade" page states claims 14–19 with
      reproducible receipts including a before/after agent-generation comparison.
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v13)

- **Full CSS-native migration of all components** — the pilot proves the pattern; a sweep is
  its own version, gated on broader browser support and `@function` spec stabilization
  (spread/multi-value returns are still landing per the source article).
- **Hosted context/RAG service for agents** — `context.json` + MCP is the v13 ceiling; a
  hosted retrieval service is infrastructure cascade doesn't need yet.
- **Auto-generated intent from code/LLM** — intent is authored by humans (with optional LLM
  drafting in the factory), reviewed like design; no silent generation of the WHY.
- **`audit --ai` auto-fix-everything** — v13 suggests fixes and fixes only the unambiguous
  cases (literal→token where exactly one token matches); rewriting component selection is out.
- **Figma kit / FigmaLint integration** — still gated on DTCG adoption (v11/v12 deferral
  stands); cascade's own code-side audit is the v13 analogue.
- **Tone/content enforcement at runtime** — content guidelines are documented and audited
  statically; a runtime linter for copy is out of scope.
