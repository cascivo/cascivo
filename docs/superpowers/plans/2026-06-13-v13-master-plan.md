# v13 Master Plan — The Context Layer (Intent, Surfaces, Audit, Specs, CSS-Native Logic, Receipts)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-13-v13-tranche-1.md` … `2026-06-13-v13-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.
>
> **Hard dependency:** v13 builds on the shipped state of the monorepo as of v12. T1 extends
> `ComponentMeta` in `@cascade-ui/core` and the `RegistryItem` meta in `@cascade-ui/registry`;
> T2 extends the existing `scripts/llms` + `scripts/registry` generators and the
> `@cascade-ui/mcp` server; T3 extends the CLI's `audit`/`doctor` surface (v12). Re-verify
> each surface at tranche start — if a named file/command is absent, STOP and re-sequence.

**Goal:** Execute `docs/ROADMAP-V13.md` — close the gap between publishing the system's
_structure_ (WHAT) and publishing its _intent and constraints_ (WHY): (1) an `intent` block
on every manifest; (2) a closed-set token catalog + consolidated machine-readable context
bundle + MCP context tools; (3) `cascade audit --ai` that checks agent-written code in the
user's repo; (4) machine-readable design specs + strict-vs-flexible boundaries + an
exceptions log; (5) progressive CSS-native logic (`@function`/`if(style())`) on a pilot set
with fallbacks; (6) a Context Explorer page and reproducible receipts.

**Architecture:** No new packages. Intent types live in `@cascade-ui/core` (consumed by
component manifests) and are mirrored into `@cascade-ui/registry`'s published item `meta`.
The token catalog, `context.json`, per-component `context.md`, and `specs.json` are
**generated** by new `scripts/` generators wired into the existing regen pipeline
(`registry:generate` / `llms:generate`) and guarded by the drift gate. `@cascade-ui/mcp`
gains read tools over the context bundle. The CLI's `audit` command (v12) gains an `--ai`
mode that parses user TSX/CSS against the catalog + registry. CSS-native logic lands as
`@supports`-guarded additions to `@cascade-ui/tokens` and a pilot of component CSS, with a
fallback-audit script in `scripts/checks`.

**Tech stack:** unchanged — React 18+, modern CSS, Preact signals, vitest, vp toolchain.
The `audit --ai` parser uses a lightweight TSX/CSS parse (evaluate what the repo already
pulls in — the CSS-contract test in v12 already parses `*.module.css`; reuse that approach
for CSS, and a minimal JSX walk for component/prop detection — decided in T3).

---

## Research findings (ground truth — verified 2026-06-13)

### The three source articles (user-supplied research, cross-checked)

1. **"How to make a design system AI-ready"** (Smashing Magazine, 2026-06). Core moves:
   _treat design decisions as infrastructure_ (document them in spec files AI consumes);
   a **three-layer architecture** — spec files (markdown), a **token layer** as an
   exhaustive closed set so AI selects rather than invents, and an **audit layer**
   (FigmaLint-style) that detects hard-coded values, detached instances, missing interactive
   states, unbound tokens, and naming inconsistency; publish `/llms.txt` (Atlassian, Carbon,
   CMS Design System, Nordhealth cited as exemplars); keep specs synced to releases.
2. **"Design systems are over — product context"** (Robin Cannon, 2026). Core argument: the
   _scope_ of design systems no longer matches the work. AI consumes and amplifies
   **context**, not isolated components. Missing operational knowledge — decision hierarchies
   (strict vs flexible), accessibility tradeoffs with rationale, tone shifts, historical
   exceptions, implicit rules in Slack/docs — makes AI output "superficially correct" but
   structurally drifting. Recommendations: shift from artifact maintenance to **intent
   preservation** (document _why_); make context **machine-readable**; **define boundaries
   rather than enforce consistency**; consolidate fragmented context.
3. **"The fundamentals and dev experience of CSS `@function`"** (Frontend Masters, 2026).
   `@function --name(--arg <type>: default) returns <type> { result: … }`; functions can
   nest (no recursion); internal variables are private (don't leak/inherit); `if(style(): …;
else: …)` enables conditional branching. Many gotchas: silent failures on arg-count
   mismatch (mitigate with defaults), single-value returns, no variable spreading in custom
   func params (spread `...` planned), decimal-vs-integer strictness (defer with `calc()`),
   return-type mismatch defaults to `initial`. **Browser support: Chrome-leading, not
   cross-browser; DevTools support absent.** Conclusion for cascade: usable now only as
   progressive enhancement with fallbacks.

### cascade ground truth relevant to v13

- **Manifests:** `ComponentMeta` (`packages/core/src/types.ts`) has `name, description,
category, states, variants, sizes, props, tokens, accessibility{role,wcag,keyboard},
examples, dependencies, tags`. **No intent/why fields.** 72 `*.meta.ts` files in
  `packages/components/src/**`. `PropMeta` has `name, type, required, default?, description?`.
- **Registry:** `@cascade-ui/registry` `RegistryItem` (schema v2) has `meta?: unknown` —
  the intent block rides there for published items. `advisories` already added (v12). The
  generator is `scripts/registry`.
- **Tokens:** single source `packages/tokens/src/index.css` (~10k) — primitive → semantic →
  component custom properties. Themes (`packages/themes`) override the semantic layer; the
  v9 parity test (`packages/themes/src/parity.test.ts`) guards the key set.
- **AI surfaces today:** `scripts/llms/generate.ts` emits `apps/docs/public/llms.txt` + per
  item `/llms/<name>.md`. `@cascade-ui/mcp` (`packages/mcp/src/server.ts`) registers tools:
  `list_components`, `get_component`, `scaffold_view`, `validate_view`, `add_to_project`
  (and `theme`). New tools extend this file.
- **CLI:** commands include `init/add/list/update/theme/generate/doctor/audit` (audit +
  doctor `--drift` from v12). `audit --ai` is a new mode on the existing `audit` command.
  The v12 CSS-contract test (`scripts/quality` or `scripts/checks`) already parses
  `*.module.css` for token coverage — reuse its CSS-value classifier for `audit --ai`.
- **Regen pipeline:** `pnpm registry:generate && pnpm readme:generate && pnpm llms:generate`
  then `vp check --fix` then `git diff --exit-code` (CLAUDE.md drift gate). New generators
  (catalog, context, specs) hook here.
- **Scripts dirs:** `scripts/{checks,directory,factory,llms,quality,readme,registry,schema}`.
- **Factory:** `factory-backlog.json` + `scripts/factory` + the `factory` skill generate new
  components from templates — the intent block must be added to the template (T1) so new
  components ship it.
- **CSS conventions:** `@layer`, `@container`, `:has()`, logical properties. **No
  `@function`/`if()` usage today** (grep clean). Adding them is greenfield + accepted-risk.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                               | Rationale                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | `ComponentMeta` gains optional `intent?: ComponentIntent` with `whenToUse: string[]`, `whenNotToUse: string[]`, `antiPatterns: {bad, good?, why}[]`, `related: {name, relationship: 'alternative'\|'pairs-with'\|'contains'\|'contained-by', reason}[]`, `a11yRationale: string`, `content?: {tone, notes?}`, `flexibility: {area, level: 'strict'\|'flexible', note}[]`                                                                               | The WHY layer; optional in types (additive), required by CI for first-party  |
| 2   | Intent completeness check: a test asserts every first-party `*.meta.ts` has a non-empty `intent` with `whenToUse`, `whenNotToUse`, `related`, `a11yRationale`, `flexibility`; charts/blocks may use a relaxed subset (decided in T1)                                                                                                                                                                                                                   | Makes the WHY non-optional in practice without breaking the public type      |
| 3   | Token catalog generator (`scripts/registry` or new `scripts/catalog`): parse `packages/tokens/src/index.css` into `tokens.catalog.json` — `[{name, value, layer: 'primitive'\|'semantic'\|'component', group, resolvedDefault}]`; resolvedDefault computed against the light theme; emitted to `apps/docs/public/` for AI fetch                                                                                                                        | Closed set AI selects from (article 1); generated, CSS stays source of truth |
| 4   | `context.json` generator: join registry items + their intent + token catalog + specs (T4) + authoring rules into one document at `apps/docs/public/context.json`; per-component `context.md` (human+agent readable) under `/context/<name>.md`; `llms.txt` enriched to link them and summarize intent                                                                                                                                                  | Consolidation (article 2); one machine-readable bundle                       |
| 5   | MCP tools: `get_tokens` (the catalog, optional group filter), `get_context` (consolidated context for one component incl. intent + tokens + boundaries), `select_component` (given a natural-language need, return ranked candidates using `related` edges + tags + intent — deterministic ranking, no model call inside the server)                                                                                                                   | Agents read the WHY through the protocol they already speak                  |
| 6   | `cascade audit --ai <paths...>`: parse target `.tsx`/`.css`; checks — (a) CSS/inline literal color or size that has an exact token match in the catalog → flag with suggested token; (b) JSX element whose name matches a registry component, using a prop absent from that component's `props` → flag "unknown prop"; (c) required prop missing on a known component → flag; (d) raw non-whitespace text child where the manifest expects i18n → warn | The audit layer (article 1), applied to the user's/AI's actual code          |
| 7   | `audit --ai` honesty + scope: skips elements not in the registry (never guesses third-party/native); only flags literals where **exactly one** token matches (ambiguous → info, not error); `--json` for tooling; `--fix` applies only the unambiguous literal→token rewrites; exit 1 on errors at/above `--level` (default: error)                                                                                                                    | Honest, low false-positive; mirrors v12 audit ergonomics                     |
| 8   | Design spec files: `docs/specs/{spacing,color-usage,decision-hierarchy,content-tone}.md` (markdown the agent consumes) + a generator emitting `specs.json`; content seeded by consolidating `CLAUDE.md` token architecture + house rules (not duplicating — specs reference and structure them)                                                                                                                                                        | Spec files as infrastructure (article 1); intent preservation (article 2)    |
| 9   | Boundary registry: `docs/specs/boundaries.json` (generated from per-component `intent.flexibility` + a small hand-authored global section) listing strict areas (e.g. token names, a11y roles) vs flexible (e.g. spacing within scale, copy) — surfaced to agents via context                                                                                                                                                                          | "Define boundaries, not consistency" (article 2)                             |
| 10  | Exceptions log: `docs/specs/exceptions.md` — a structured list of real historical exceptions and _why_ they exist (e.g. a component that deliberately breaks a house rule), each with a stable id; folded into `context.json`                                                                                                                                                                                                                          | Preserve historical reasoning to prevent AI regression (article 2)           |
| 11  | CSS-native pilot: `@cascade-ui/tokens` gains an optional `functions.css` defining `@function` token-math helpers (e.g. a tint/shade or density-scale function); Button/Badge/Alert CSS adopt one `@function` and/or one `if(style(--variant: …): …; else: …)` for variant→token selection; every use wrapped so a non-supporting browser falls back to the current static value                                                                        | Article 3, progressive; small + reversible (roadmap decision 7)              |
| 12  | Fallback discipline: every `@function`/`if()` use sits behind `@supports (…)` (or pairs a static declaration before the enhanced one so unsupported browsers ignore the unknown-function declaration and keep the static one); a `scripts/checks` script parses pilot CSS and fails if an `@function`/`if()` declaration has no preceding/guarded static fallback                                                                                      | No regression; emerging-feature accepted-risk stance                         |
| 13  | Context Explorer docs page (`apps/docs`, Preact, signals, house rules): browse intent per component, the boundary map, the spec files, and the token catalog; an interactive `audit --ai` demo (paste code → findings, run client-side against the catalog/registry JSON)                                                                                                                                                                              | Receipts surface; dogfoods the context bundle                                |
| 14  | "Why cascade" page extends with claims 14–19, each linking its receipt (intent example, catalog JSON, audit demo, context bundle, CSS-native pilot with fallback proof, before/after agent-generation comparison)                                                                                                                                                                                                                                      | Receipts-not-adjectives bar (v11/v12)                                        |
| 15  | Before/after demo: a recorded, reproducible comparison — same prompt to an agent with only the manifest vs. with the full context bundle — showing measurable difference (correct component selection, token usage, no invented props). Method documented; not a live model call in CI                                                                                                                                                                 | Proves claim 19 honestly                                                     |
| 16  | Deferred explicitly: full CSS-native migration, hosted context service, auto-generated intent, audit auto-fix beyond literal→token, Figma/FigmaLint integration, runtime content linting                                                                                                                                                                                                                                                               | Scope control                                                                |

## Tranche map

| Tranche | File                          | Contents                                                                                                                                                | Risk                                                                               |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| T1      | `2026-06-13-v13-tranche-1.md` | `ComponentIntent` type + `ComponentMeta.intent`; registry mirror; completeness CI check; backfill all 72 items; factory template update                 | Medium (72-item backfill is real authoring work; relaxed subset for charts/blocks) |
| T2      | `2026-06-13-v13-tranche-2.md` | Token-catalog generator, `context.json` + per-component `context.md` generators, enriched `llms.txt`, MCP `get_tokens`/`get_context`/`select_component` | Medium (CSS parsing + default resolution; deterministic ranking)                   |
| T3      | `2026-06-13-v13-tranche-3.md` | `cascade audit --ai` (literals vs catalog, props vs registry, missing required, raw strings), `--json`/`--fix`/`--level`, fixture suite                 | High (TSX/CSS parsing + false-positive discipline is the hard part)                |
| T4      | `2026-06-13-v13-tranche-4.md` | Design spec files, `specs.json` generator, boundary registry, exceptions log; folded into `context.json`                                                | Low-medium (mostly authoring + a join generator)                                   |
| T5      | `2026-06-13-v13-tranche-5.md` | CSS-native `@function`/`if()` pilot on Button/Badge/Alert, `functions.css`, fallback-audit script, parity + visual proof                                | Medium-high (emerging CSS; fallback correctness; jsdom can't render `@function`)   |
| T6      | `2026-06-13-v13-tranche-6.md` | Context Explorer page, Why-page claims 14–19, before/after demo, README/llms refresh, DoD walkthrough                                                   | Low                                                                                |

## Cross-cutting rules (every tranche)

1. **Generated, never hand-maintained:** token catalog, `context.json`, `context.md`,
   `specs.json`, boundary registry — all flow through the regen pipeline and the drift gate
   (`git diff --exit-code`). Hand-edit only the _source_ (CSS, manifests, spec markdown).
2. **Intent is authored, reviewed like design.** No silent LLM generation of the WHY; the
   factory may _draft_ intent but a human reviews it (the factory's PR-for-new-components
   gate already exists). Backfill intent reflects the component's real behavior — verify
   against the source, don't invent.
3. **Honesty in tooling output:** `audit --ai` reports _detectable deviations from the
   published contract_, never "your code is correct." `select_component` ranks
   deterministically and says it is heuristic. The before/after demo states its method.
4. **CSS-native is additive and fallback-guarded.** No component loses its static styling;
   the pilot must render pixel-identically in a non-supporting browser. The fallback-audit
   gate is non-negotiable.
5. **House component rules** bind all component/docs work (signals, tokens, logical
   properties, i18n chrome strings, `useSignals()` in React apps, no `useEffect`).
6. **Offline-testable:** any context/catalog fetch in tooling goes through an injectable
   fetch (v11 `http.ts` pattern); MCP tool tests read fixtures, not the network.
7. **Gate before committing** (CLAUDE.md): `pnpm exec vp check` → `pnpm build` →
   `pnpm exec vp run -r check` → `pnpm test` → regen (`registry:generate` + `readme:generate`
   - `llms:generate` + new catalog/context/specs generators) → `pnpm exec vp check --fix` →
     `git diff --exit-code`. All five exit 0.

## Edge cases / risks registry

1. **Backfill quality (T1):** 72 intent blocks written carelessly are worse than none —
   they'd teach agents wrong things. Each must be grounded in the component's actual
   behavior and existing examples. Budget real authoring time; review in batches by category.
2. **Relaxed intent subset (T1):** charts and blocks are composites; forcing the full intent
   schema may be noise. Decide a documented minimal subset for `category: 'chart' | 'block'`
   (likely `whenToUse`, `whenNotToUse`, `related`) and encode it in the completeness check.
3. **Token-default resolution (T2):** component tokens resolve through semantic → primitive
   chains and theme overrides. Resolve `resolvedDefault` against the **light** theme and
   say so in the catalog metadata; don't fabricate values for properties only set per-theme.
4. **`select_component` determinism (T2):** ranking must be reproducible (no model call,
   no `Math.random`). Use a documented scoring function over tags + `related` edges +
   keyword overlap with `whenToUse`. Snapshot a few queries in tests.
5. **`audit --ai` false positives (T3):** the highest-risk item. Literal flags only when an
   exact token match exists; prop flags only on confirmed cascade elements (track imports
   from `@cascade-ui/react` / known component names — decided in T3); ambiguous → info.
   Build the fixture suite to include _negative_ cases (correct code must report clean).
6. **JSX parsing scope (T3):** full TS type inference is out of scope. Detect components by
   JSX element name + import source; detect props by attribute name. Spread props
   (`{...rest}`) suppress the missing/unknown-prop check for that element (can't know) — say
   so. Document the boundary on the audit help text.
7. **`--fix` safety (T3):** only rewrite a literal to a token when exactly one catalog token
   has that value AND the value is a full declaration value (not part of a shorthand/gradient
   it can't safely split). Everything else is suggest-only. Tests must prove no destructive
   rewrite.
8. **Specs duplicating CLAUDE.md (T4):** specs must _structure and reference_ the existing
   rules, not fork them — drift between `CLAUDE.md` and `specs/` would be its own context
   rot. Where a rule already lives in `CLAUDE.md`, the spec links it and adds the
   _rationale/boundary_ framing, not a second copy of the rule text.
9. **CSS `@function` gotchas (T5):** arg-count mismatch fails silently; integer-typed args
   reject decimals at parse time; return-type mismatch falls to `initial`. Use defaults on
   optional args, `calc()` wrappers to defer numeric validation, and keep functions
   single-purpose. No recursion. Pilot functions stay trivial.
10. **jsdom can't evaluate `@function`/`if()` (T5):** unit tests assert the CSS _source_
    contains the guarded fallback and that components render with the static value in jsdom;
    cross-browser visual proof is a screenshot pair (Chrome supporting vs a fallback render),
    recorded in the PR — not asserted in CI.
11. **Parity drift from CSS-native (T5):** even the pilot could shift a computed value. The
    v9 theme-parity test must stay green; if a `@function` changes a resolved token value,
    that's a regression, not an enhancement — the fallback and the function must produce the
    same value.
12. **Context bundle size (T2/T6):** `context.json` joining 72 items × full intent could get
    large. Keep per-component `context.md` as the granular fetch; `context.json` carries the
    index + boundaries + catalog, with components linking to their `.md`. Measure and note
    the size on the Context Explorer page.
