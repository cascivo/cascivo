# v58 — Derivable Theming & Unambiguous Specs: Semantic Type, OKLCH-Derived Color, Canonical Tokens for Agents — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the genuinely-new ideas from two external articles — Evil Martians' *"Building a design system
specced for engineers and agents"* and Una Kravets' *"Modern CSS theming"* — to cascivo, per the analysis in
`docs/ROADMAP-V58.md`. The study confirmed: OKLCH (post 1's headline) is **already shipped** (C-3); typography has
**no "exactly one correct token"** layer — the one design axis where agents still guess (M-1); the shipped themes
**hand-author** every `*-hover/-active/-subtle/-muted` variant across 12 files and never use relative color syntax,
`@property`, or `contrast-color()` (M-2/M-3); the `create_theme` MCP generator **contradicts the all-OKLCH thesis**
with `color-mix` ladders and hardcoded hex (M-4); and the alias sprawl gives the AI surfaces **more than one correct
token** (M-5). It also confirmed two corrections: `light-dark()` **does not fit** a 12-theme `[data-theme]` system
(C-1) and `@container style()` palette branching is **deferred** (C-2).

Governing thesis: **derive within the system we have; give engineers and agents exactly one correct answer; build
nothing that already exists.** No new component, no utility-CSS layer, no new token system, no move off `[data-theme]`
or OKLCH, no `@container style()` micro-theming. Reuse the color **variant-matrix** generator
(`scripts/variants/generate.ts`) as the template for typography, the **canonical/alias** tracking in
`scripts/tokens/generate-manifest.mjs`, the MCP surfaces (`get_tokens`/`get_variant_matrix`/`create_theme`/
`validate_component`), and the **static-fallback contract** (`packages/tokens/src/functions.css` + `pnpm
fallback:check`) — extend each at its seam.

Deliver: **(T1)** a semantic typography layer (`--cascivo-text-{display,heading-lg,heading-md,heading-sm,body,body-sm,
ui,label,caption,code}`) + a `typography` family in the variant matrix; **(T2)** relative-color-syntax derivation of
the `accent/primary/secondary/destructive` state variants in all 12 themes, `@property`-registered, behind static
fallbacks; **(T3)** `contrast-color()`-computed `text-on-*` with literal fallbacks, AA-verified; **(T4)** a rewritten
`create_theme` that emits OKLCH relative-color ramps + `contrast-color()` and no hex; **(T5)** canonical-only MCP
`get_tokens` + a `typography` matrix family + a `validate_component` alias warning; **(T6)** a `derivable-theming.md`
cookbook + `THEMING.md` corrections (why `[data-theme]` stays; `@container style()` deferred). **Do not** ship
utilities, a new component, a `light-dark()` migration, or a non-fallback'd progressive feature.

Target state (verified after T6):

| Finding (severity)                                              | Today                                                                                   | Target                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| M-1 No semantic typography tokens (🟠)                         | raw scale `text-xs..4xl`; variant matrix is color-only                                  | role layer `--cascivo-text-{ui,body,heading-*,…}`, each → one primitive; `typography` family in the matrix; Button uses `text-ui` |
| M-2 Theme variants hand-authored 12×; no relative color (🟡)   | literal OKLCH per state per theme; `oklch(from …)`/`@property` unused                   | `*-hover/-active/-subtle/-muted` derived via `oklch(from var(--base) …)` + `@property`, behind static fallbacks, parity green |
| M-3 Contrast hand-picked; `contrast-color()` unused (🟡)       | `text-on-accent/-destructive` literal per theme                                         | `contrast-color(var(--…))` with literal fallback; AA holds on all 12 themes                                                  |
| M-4 `create_theme` breaks all-OKLCH thesis (🟠)                | `color-mix(… black/white %)` + hardcoded hex status colors                              | OKLCH relative-color ramps + `contrast-color()`, each with a fallback; **no hex**                                            |
| M-5 Alias sprawl on AI surfaces (🟡)                           | `get_tokens` returns aliases undifferentiated; no type family in matrix                 | canonical-only by default (+ opt-in `includeAliases`), `aliasOf` flagged; `typography` family; `validate_component` warns     |
| C-1 `light-dark()` adoption (✋)                                | n/a                                                                                     | **rejected & documented** — `[data-theme]` stays                                                                            |
| C-2 `@container style()` branching (🟡)                        | n/a                                                                                     | **deferred & documented** — future candidate                                                                                |
| C-3 OKLCH (✅)                                                  | already shipped                                                                         | unchanged — the floor v58 builds on                                                                                         |
| Full gate (`pnpm ready`)                                       | green                                                                                   | green                                                                                                                       |

**Architecture & evidence (reproduced in-repo before planning):**

- **Primitive tokens** (`packages/tokens/src/index.css`): all-OKLCH; type scale `--cascivo-text-xs..4xl` (8 sizes,
  L106–113), `--cascivo-leading-*`, `--cascivo-tracking-*`, `--cascivo-font-*`. **No** semantic/role type tokens.
- **CSS function contract** (`packages/tokens/src/functions.css` + `pnpm fallback:check`): every `@function`/`if()`
  declaration must be preceded by a static fallback for the same property in the same rule block. T2–T4 extend this
  discipline to `oklch(from …)` and `contrast-color()` (and extend the check to recognize them).
- **Themes** (`packages/themes/src/*.css` in `@layer cascivo.theme`, keyed `[data-theme='…']`): **12** selectable
  themes (`light, dark, warm, flat, minimal, midnight, pastel, brutalist, corporate, terminal, cyberpunk, arcade`);
  `base.css`/`all.css` are non-selectable. Each theme restates the derived state ladders as literals; contrast
  literals at `light.css:39–40` (`oklch(1 0 0)`) and `dark.css:38–39` (`oklch(0.145 0.005 250)`). `parity.test.ts`
  asserts all themes define the same token set. Grep for `oklch(from`/`@property`/`light-dark`/`contrast-color`
  across tokens+themes is **empty**.
- **Variant-matrix generator** (`scripts/variants/generate.ts` → `apps/site/public/tokens.variants.json`): builds
  `families: role → slot → token` and `byTheme` resolved values; `SLOTS` = `foreground/content/subtle/muted/active/
  hover/disabled/fg` (L35–44); `role`/`slot` documented "only set for the `color` group" (L50–55). This is the exact
  template T1 follows for typography.
- **Token manifest generator** (`scripts/tokens/generate-manifest.mjs`): categorizes tokens (typography branch
  L62–66) and tracks `canonical`/`aliasOf` via the `ALIASES` map (`bg`↔`background`, `text`↔`foreground`,
  `error`↔`destructive`, `foreground-muted`↔`text-muted`, …). T5 surfaces this on the MCP side.
- **MCP** (`packages/mcp/src/`): `tokens.ts` (`get_tokens` — closed-set catalog, `layer`/`group`), `variants.ts`
  (`get_variant_matrix` — loads `tokens.variants.json`), `theme.ts` (`create_theme` — `color-mix` + hex,
  `theme.ts:62–68`), `validate-component.ts` (structural invariants: banned hooks, off-scale breakpoints, missing
  fallbacks, hallucinated tokens).
- **Contrast CI** (`scripts/checks/color/contrast.ts`): already checks WCAG AA; T3 relies on it as the acceptance
  gate for `contrast-color()`.
- **CLAUDE.md constraints (binding on every tranche):** modern CSS + `@layer`; `@function`/`if()`/relative-color/
  `contrast-color()` are **progressive enhancement only, static fallback required**; signals not hooks (any docs-app
  interactivity); user-visible strings from `@cascivo/i18n`; WCAG 2.2 AA + ≥44px coarse targets; no off-scale
  `@media`/`@container` literals (`pnpm breakpoint:check`); manifest-derived artifacts survive `pnpm regen` + the
  drift check.

**Tech Stack:** `@cascivo/tokens` + `@cascivo/themes` CSS, the token/variant generators (`scripts/tokens`,
`scripts/variants`), the `apps/site` docs app (Preact), `@cascivo/core` types, the `@cascivo/mcp` server. Pure CSS +
TypeScript. **No backend, no new runtime dependency, no new component.**

---

## Tranche Overview

| Tranche | Title                                       | Goal                                                                                                                                                                                                                                                                                                          |
| ------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Semantic typography tokens + matrix family  | Add `--cascivo-text-{display,heading-lg,heading-md,heading-sm,body,body-sm,ui,label,caption,code}` (each → exactly one primitive size, + paired leading/weight/tracking where it removes ambiguity); extend `scripts/variants/generate.ts` to emit a `typography` family; regen manifests + docs; migrate Button label → `--cascivo-text-ui`. (M-1) |
| T2      | Derivable color in shipped themes           | Derive `*-hover/-active/-subtle/-muted` for `accent/primary/secondary/destructive` via `oklch(from var(--base) …)` in all 12 themes, with the current literal as the static fallback line preceding each; `@property`-register the themeable color props; extend `fallback:check`; keep `parity.test.ts` green. (M-2) |
| T3      | Automatic contrast via `contrast-color()`   | Set `text-on-accent`/`-on-destructive` (and the `*-content` aliases) via `contrast-color(var(--…))` with literal fallbacks; verify AA on all 12 themes with the existing contrast CI. (M-3)                                                                                                                      |
| T4      | `create_theme` onto the derivation model    | Rewrite `packages/mcp/src/theme.ts` to emit OKLCH relative-color ramps + `contrast-color()` (each with a fallback) and **no hex**; keep a valid `@layer cascivo.theme [data-theme]` block; update `theme.test.ts`. (M-4)                                                                                          |
| T5      | Canonical tokens for agents                 | MCP `get_tokens` canonical-only by default (+ opt-in `includeAliases`), `aliasOf` flagged; `get_variant_matrix` gains the T1 `typography` family; `validate_component` warns on alias-where-canonical-exists; document the rule. (M-5)                                                                            |
| T6      | Correct the record & document the seams     | `docs/cookbooks/derivable-theming.md` (relative-color + `contrast-color` + `@property` with fallbacks); `THEMING.md` sections: why `[data-theme]` stays (C-1), `@container style()` deferred (C-2), OKLCH already the floor (C-3); flip `docs/ROADMAP-V58.md` status when implemented. (C-1/C-2/C-3)               |

Ordering rationale: **T1** independent (typography), can land first. **T2→T3→T4** are the color spine (T2 sets the
relative-color + fallback pattern; T3 layers `contrast-color()` on it; T4 mirrors the model in the generator). **T5**
depends on T1 (surfaces the `typography` family) and is otherwise independent. **T6** is the wrap-up, lands last.
Critical path T2→T3→T4; T1 and (post-T1) T5 parallelize; T6 last.

---

## Files Created / Modified per Tranche

### T1 — Semantic typography tokens + matrix family

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/tokens/src/index.css` (add the `--cascivo-text-{role}` semantic type layer mapping each role → one primitive) |
| Modify | `scripts/variants/generate.ts` (emit a `typography` family: role → token; relax the "color-only" `role`/`slot` doc) + `scripts/variants/generate.test.ts` |
| Modify | `scripts/tokens/generate-manifest.mjs` if a `role`/`canonical` note is needed for the new tokens; regen `packages/tokens/tokens.json`, `tokens.d.ts`, `docs/TOKENS.md` |
| Modify | `apps/site/src/pages/TokensPage.tsx` (render the typography role group) |
| Modify | `packages/components/src/button/button.module.css` + `button.meta.ts` `tokens[]` (label → `--cascivo-text-ui`, as the documented exemplar) |

### T2 — Derivable color in shipped themes

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/themes/src/{light,dark,warm,flat,minimal,midnight,pastel,brutalist,corporate,terminal,cyberpunk,arcade}.css` (derive state variants via `oklch(from var(--base) …)`, each preceded by today's literal fallback) |
| Modify | `packages/tokens/src/index.css` or a new `packages/tokens/src/properties.css` (`@property` registrations for themeable color custom properties) + its import in `all.css` |
| Modify | `scripts/checks/*` — extend `fallback:check` to recognize `oklch(from …)`/`contrast-color()` as progressive declarations needing a preceding static fallback |
| Modify | `packages/themes/src/parity.test.ts` (confirm no token dropped; values may now be derived) |

### T3 — Automatic contrast via `contrast-color()`

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | the 12 theme files: `--cascivo-color-text-on-accent`/`-on-destructive` via `contrast-color(var(--…))` with the literal as the preceding fallback |
| Modify | `scripts/checks/color/contrast.ts` if needed (assert the *fallback* value passes AA, since that is what non-supporting browsers render) |

### T4 — `create_theme` onto the derivation model

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/mcp/src/theme.ts` (replace `darken`/`lighten` `color-mix` helpers + hex status colors with OKLCH relative-color ramps + `contrast-color()`, each emitted with a static fallback) |
| Modify | `packages/mcp/src/theme.test.ts` (assert the new shape: relative-color present, fallback present, no hex literal) |

### T5 — Canonical tokens for agents

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/mcp/src/tokens.ts` (`get_tokens`: surface `aliasOf`/`canonical`; default canonical-only; opt-in `includeAliases`) + `tokens.test.ts` |
| Modify | `packages/mcp/src/server.ts` (`get_tokens` input schema: `includeAliases?: boolean`; tool description) |
| Modify | `scripts/variants/generate.ts` already emits the `typography` family from T1 — confirm `get_variant_matrix` returns it; add a `variants.test.ts` case |
| Modify | `packages/mcp/src/validate-component.ts` (warn when source/manifest uses an alias where a canonical token exists) + `validate-component.test.ts` |

### T6 — Correct the record & document the seams

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `docs/cookbooks/derivable-theming.md` (relative color + `contrast-color` + `@property`, always with the static-fallback contract) |
| Modify | `docs/THEMING.md` (sections: "Why `[data-theme]`, not `light-dark()`" — C-1; "`@container style()` palette branching — deferred" — C-2; "OKLCH is the floor" — C-3) |
| Modify | `docs/ROADMAP-V58.md` (Status → Shipped + implementation log, when implemented) |

---

## Key Decisions

### Decision 1 — Build the typography role layer; mirror the color variant matrix (firm)

Type is the one design axis with no semantic/intent token, so agents pick from 8 raw sizes for a button label.
**Decision: add a purpose layer (`--cascivo-text-ui`, `-body`, `-heading-*`, …), each resolving to exactly one
primitive, and add a `typography` family to the variant matrix — the same structure the color variant matrix already
provides.** **Rejected:** leaving type as a raw scale (the ambiguity persists), or auto-deriving roles from usage
(an AST/usage miner is out of scope — the color semantic layer is hand-authored too).

### Decision 2 — Derive color variants in CSS via relative color syntax; do not hand-author 12× (firm)

`accent/primary/secondary/destructive` state variants are restated as literals in all 12 themes; post 2's relative
color syntax derives them from a single base. **Decision: emit `--cascivo-color-accent-hover: oklch(from
var(--cascivo-color-accent) calc(l - .08) c h)` etc., with today's literal as the static fallback line immediately
preceding it** (the existing `@function`/`if()` contract). **Rejected:** keeping the literals (the duplication and
drift remain) or dropping the literals for the derived form only (violates the fallback contract — non-supporting
browsers would get nothing).

### Decision 3 — `contrast-color()` for text-on-*, behind a literal fallback (firm)

Contrast colors are hand-picked per theme and can silently fail AA when an accent is re-tinted. **Decision: compute
them with `contrast-color(var(--cascivo-color-accent))` and keep today's literal as the fallback; the CI contrast
check asserts the *fallback* (what non-supporting browsers render) passes AA.** **Rejected:** trusting hand-picked
literals (no guarantee under re-tint) or computing in JS (a build step where CSS suffices).

### Decision 4 — `@property`-register the themeable color custom properties (firm)

Registering the themeable props (`syntax:"<color>"; inherits:true; initial-value`) gives type-checked custom
properties, smooth interpolation on theme transitions, and the substrate a future `@container style()` branch would
need. **Decision: register them in a `properties.css` imported by `all.css`.** **Rejected:** leaving them unregistered
(no interpolation, no future style-query substrate) — registration is cheap and forward-compatible.

### Decision 5 — Bring `create_theme` onto the same OKLCH derivation model (firm)

The generator emits `color-mix` ladders and hardcoded hex status colors — inconsistent with the all-OKLCH thesis and
the T2 themes. **Decision: rewrite it to emit OKLCH relative-color ramps + `contrast-color()` (each with a fallback)
and no hex.** **Rejected:** leaving `color-mix`/hex (an agent-facing tool that contradicts the system) or hand-coding
status colors per generated theme (the inputs can derive them).

### Decision 6 — Steer agents to canonical tokens; keep aliases in the CSS (firm)

The aliases (`bg`/`background`, `text`/`foreground`, `error`/`destructive`) give agents more than one "correct"
token — the opposite of post 1's discipline — but removing them breaks consumers. **Decision: MCP `get_tokens`
returns canonical-only by default (opt-in `includeAliases`) and flags `aliasOf`; `validate_component` warns on
alias-where-canonical-exists; the CSS aliases stay.** **Rejected:** deleting aliases (breaking change) or doing
nothing (agents keep seeing duplicates).

### Decision 7 — Keep `[data-theme]`; reject `light-dark()`; defer `@container style()` (firm)

`light-dark()` is a 2-way `color-scheme` pair; cascivo has 12 container-scoped themes. **Decision: keep
`[data-theme]` and document why `light-dark()` does not fit (C-1); record `@container style()` palette branching as a
deferred future candidate (C-2); note OKLCH is already the floor (C-3).** **Rejected:** a `light-dark()` migration
(deletes 10 themes, breaks scoped theming) or shipping `@container style()` branching now (advanced, orthogonal to
v58's core).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final
   push if the token/theme build pipeline changed; `pnpm fallback:check` + `pnpm breakpoint:check` clean.
2. **Extend, never rebuild.** Each tranche is checked against "did we just re-implement an existing generator,
   matrix, MCP tool, fallback contract, or token layer?" The answer must stay **no** (Decisions 1/2/5/6).
3. **No new component, no utility CSS, no new token system, no move off `[data-theme]` or OKLCH, no `@container
   style()`** (Out of scope; Decision 7).
4. **Every progressive CSS feature ships behind a static fallback.** No `oklch(from …)`, `contrast-color()`, or
   `@property`-dependent value renders nothing in a non-supporting browser; `fallback:check` is extended to enforce
   this for the new constructs and must pass (Decisions 2/3/4).
5. **The token/manifest are the source of truth.** New type tokens, the `typography` matrix family, and any
   `canonical` notes live in source; `tokens.json`/`tokens.d.ts`/`TOKENS.md`/`tokens.variants.json` + the docs site
   regenerate from them; after `pnpm regen` the drift check (`git diff --exit-code`) is clean.
6. **Theme parity holds.** `parity.test.ts` stays green — derivation changes *values*, never the *set* of tokens a
   theme defines (Decision 2).
7. **AA is proven, not asserted.** T3 is not done until the CI contrast check passes on all 12 themes against the
   fallback values (Decision 3).
8. **Out-of-scope stays out.** No `light-dark()` migration, no `@container style()` branching, no alias removal, no
   typography-usage AST miner, no new runtime dependency.
</content>
