# cascivo — Roadmap v58: Derivable Theming & Unambiguous Specs — Semantic Type, OKLCH-Derived Color, Canonical Tokens for Agents

**Last updated:** 2026-06-29
**Status:** 📋 Planned — not yet implemented. Planning docs only; no code shipped.
**Plan documents:** `docs/superpowers/plans/2026-06-29-v58-master-plan.md` + tranches 1–5
**Builds on:** the all-OKLCH primitive token set (`packages/tokens/src/index.css` in `@layer cascivo.tokens`),
the 12-theme semantic layer (`packages/themes/src/*.css` in `@layer cascivo.theme`, keyed `[data-theme]`),
the progressive-enhancement CSS-function contract (`packages/tokens/src/functions.css` + `pnpm fallback:check`),
the token manifest generator that already tracks canonical/alias (`scripts/tokens/generate-manifest.mjs` `ALIASES`),
the variant-matrix generator (`scripts/variants/generate.ts` → `apps/site/public/tokens.variants.json`), and the
MCP surfaces that expose them to agents (`packages/mcp/src/{tokens,variants,theme}.ts`; `get_tokens`,
`get_variant_matrix`, `create_theme`, `validate_component`).

> **Source of this roadmap.** Two external articles on building design systems for the modern web, studied and
> verified against `main` at 2026-06-29:
>
> 1. **Evil Martians — "Building a design system specced for engineers and agents"**
>    (`https://evilmartians.com/chronicles/building-a-design-system-specced-for-engineers-and-agents`). Its
>    operative ideas: **(a)** OKLCH so machines can derive in-system shades ("hold the hue and lightness, step the
>    chroma"); **(b)** typography constrained so *"when an engineer or an agent needs a button label, there is
>    exactly one correct token: `ui.default`"*; **(c)** collapse sprawling palettes into a few functional groups.
> 2. **Una Kravets — "Modern CSS theming"** (`https://una.im/modern-css-theming`). Its techniques:
>    `light-dark()`, `contrast-color()`, relative color syntax (`oklch(from var(--bg) …)`), `@property`-registered
>    custom properties, `@container style()` palette branching, and `@function` for DRY elevation.
>
> The job — per CLAUDE.md "Think Before Coding" — was to **study both, verify each idea against what cascivo
> already ships, separate the genuine gaps from the already-done and the does-not-fit, and design the smallest
> correct fix.** Conclusion below: post 1's headline (OKLCH) is **already shipped** (C-3); post 1's typography
> insight is a **real, unbuilt gap** (M-1); post 2's relative-color / `contrast-color` / `@property` techniques are
> **genuinely applicable** and would retire hand-authored duplication across 12 themes (M-2/M-3); the
> `create_theme` generator is **internally inconsistent** with the all-OKLCH thesis and post-2's model (M-4); the
> alias sprawl **contradicts** post-1's "exactly one correct token" on the AI surfaces (M-5); and post 2's
> `light-dark()` **does not fit** a 12-theme `[data-theme]` system (C-1) while `@container style()` branching is
> **deferred** (C-2).

---

## The questions this roadmap had to answer first

### Q1 — Has cascivo already adopted the posts' headline color idea?

**Yes — OKLCH is done; that is the floor v58 builds on, not a task.** Every primitive and semantic color is OKLCH
(`packages/tokens/src/index.css`; e.g. `--cascivo-blue-500: oklch(0.623 0.214 250)`), and the shipped themes already
express contrast colors in OKLCH (`light.css:39` `--cascivo-color-text-on-accent: oklch(1 0 0)`; `dark.css:38`
`oklch(0.145 0.005 250)`). So post 1's *"express every color in OKLCH"* recommendation is **C-3: already shipped**.
What cascivo does **not** yet do is *derive* from those OKLCH bases at runtime — the next-level move both posts point
at (relative color syntax + `contrast-color()`). That is M-2/M-3.

### Q2 — Is there "exactly one correct token" for typography?

**No — this is the strongest unbuilt gap.** cascivo applied semantic-intent layering to **color** (54 semantic
tokens like `--cascivo-color-accent`, plus a deterministic role→token *variant matrix* in
`scripts/variants/generate.ts`) but **not** to typography. Type is still a raw t-shirt scale —
`--cascivo-text-xs … --cascivo-text-4xl` (8 sizes, named by scale), plus `leading-*`/`tracking-*`/`font-*`. There is
**no purpose layer** (`--cascivo-text-ui`, `-body`, `-heading-*`) and **no typography family in the variant matrix**
(`families` is color-only; verified — the matrix's `role`/`slot` fields are documented "only set for the `color`
group", `generate.ts:50–55`). So an agent asking *"what size is a button label?"* faces **eight** plausible answers
and no canonical one — exactly the ambiguity post 1 eliminates. → **M-1**.

### Q3 — Are post 2's CSS techniques used, and would they help here?

**Unused, and three of them genuinely help.** A grep for `oklch(from`, `@property`, `light-dark`, and
`contrast-color` across `packages/tokens/src` and `packages/themes/src` returns **nothing** — none are in the
codebase. Of post 2's techniques:

- **Relative color syntax (`oklch(from var(--base) …)`)** and **`@property`** would let the theme layer *derive*
  `accent-hover/active/subtle/muted` (and the primary/destructive families) from a single base token instead of
  hand-authoring each literal in **all 12** theme files. That is real duplication: every theme restates the full
  derived ladder. → **M-2**.
- **`contrast-color()`** would compute `text-on-accent`/`text-on-destructive` to a WCAG-passing black/white instead
  of the per-theme hand-picked literals (`light.css:39–40`, `dark.css:38–39`), so a re-tinted accent can't silently
  drop below AA. → **M-3**.
- **`light-dark()`** does **not** fit (Q5 / C-1). **`@container style()`** branching is powerful but advanced
  micro-theming — **deferred** (C-2).

Per CLAUDE.md, all of these ship as **progressive enhancement with a static fallback** (the existing
`@function`/`if()` contract enforced by `pnpm fallback:check`), so non-supporting browsers keep today's literals.

### Q4 — Is the `create_theme` generator consistent with the all-OKLCH thesis?

**No — it is the one place that breaks it.** `packages/mcp/src/theme.ts` (the MCP `create_theme` tool) derives shades
with `color-mix(in oklab, …, black/white X%)` and **hardcodes hex status colors**: `--cascivo-color-destructive:
#dc2626`, `--cascivo-color-success: #16a34a`, `--cascivo-color-warning: #f59e0b` (`theme.ts:62–68`). In an
all-OKLCH system whose hand-authored themes (after M-2) derive via relative color syntax, an agent-facing generator
that emits `color-mix` ladders and hex literals is both inconsistent and less coherent than post 1's "step the
chroma" model. → **M-4**: bring the generator onto the same derivation model the shipped themes use.

### Q5 — Should cascivo adopt `light-dark()` as its theming mechanism?

**No — and saying why is the point.** Post 2 builds its whole system on `color-scheme` + `light-dark()`, which
resolves a **two-way** light/dark pair off the computed `color-scheme`. cascivo is a **twelve-theme**
(`light, dark, warm, flat, minimal, midnight, pastel, brutalist, corporate, terminal, cyberpunk, arcade`)
`[data-theme]` attribute system, **scoped to any container**. `light-dark()` cannot express `warm` vs `brutalist`,
and keying on `color-scheme` would collapse container-scoped multi-theming to a binary. Adopting it wholesale would
**delete ten themes and break scoped theming**. → **C-1: keep `[data-theme]`; record the rejection in `THEMING.md`.**
(A *narrow* use of `light-dark()` strictly inside the light/dark pair is possible but buys little against the
`[data-theme]` machinery already in place; v58 does not pursue it.)

---

## Why this roadmap exists

Both posts converge on one principle: **derive, don't hand-author, and give engineers and agents exactly one
correct answer.** cascivo already nailed the foundation (OKLCH, a color variant matrix, machine-readable manifests,
an MCP server). The gaps are the *next layer up*: type has no semantic/intent tokens (so type is the one design axis
where agents still guess); color variants and contrast are hand-authored literals (12× duplication, no automatic
AA); the theme *generator* contradicts the OKLCH thesis; and the alias sprawl gives the AI surfaces more than one
"correct" token. v58 closes these **without a new component, without utility CSS, and without leaving `[data-theme]`
or OKLCH** — it extends the token layer, the theme layer, the generator, and the MCP surfaces at their seams, and
records where the source articles do not apply.

---

## The findings, verified against today's code

Legend: ✅ already present (reuse) · ⚠️ partial / adjacent · ❌ genuine gap · ✋ does-not-fit (correction).
"Verified state" reflects a read of `main` at 2026-06-29.

| #   | Finding (severity)                                                                  | Verified state today                                                                                                                                                                                                                          | Tranche |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-1 | No semantic/purpose typography tokens — type has no "exactly one correct token" (🟠) | ❌ type is a raw scale (`--cascivo-text-xs..4xl`, `leading/tracking/font-*`); no `--cascivo-text-{ui,body,heading-*}` role layer; the variant matrix `families` is **color-only** (`scripts/variants/generate.ts:50–55`). Agents pick from 8 sizes for a button label. | T1      |
| M-2 | Theme color variants hand-authored 12× — no relative-color derivation or `@property` (🟡) | ❌ `accent/primary/destructive` `hover/active/subtle/muted` are literal OKLCH in **each** of 12 theme files; `oklch(from …)` and `@property` appear **nowhere** (grep empty across tokens+themes). Post 2's "derive from a base" is unused. | T2      |
| M-3 | Contrast colors hand-picked per theme — `contrast-color()` unused (🟡)              | ❌ `--cascivo-color-text-on-accent`/`-on-destructive` are hand-chosen literals (`light.css:39–40`, `dark.css:38–39`); no automatic WCAG black/white. A re-tinted accent can drop below AA silently.                                          | T3      |
| M-4 | `create_theme` generator violates the all-OKLCH thesis (🟠)                         | ❌ `packages/mcp/src/theme.ts` derives via `color-mix(in oklab, …, black/white %)` and **hardcodes hex** status colors (`#dc2626`/`#16a34a`/`#f59e0b`, `theme.ts:62–68`). Inconsistent with OKLCH + the post-1 "step the chroma" model.       | T4      |
| M-5 | Alias sprawl on the AI surfaces — more than "one correct token" (🟡)               | ⚠️ generator tracks `canonical`/`aliasOf` (`generate-manifest.mjs` `ALIASES`: `bg`↔`background`, `text`↔`foreground`, `error`↔`destructive`, …), but MCP `get_tokens` returns aliases undifferentiated and `get_variant_matrix` has no type family. Agents see duplicate valid names. | T5      |
| C-1 | Adopt `light-dark()` as the theming mechanism (✋ correction)                       | ✋ **does not fit** — cascivo is a 12-theme `[data-theme]` system scoped to any container; `light-dark()` is a 2-way `color-scheme` pair. Wholesale adoption deletes 10 themes + breaks scoped theming. Keep `[data-theme]`.                  | T6→doc  |
| C-2 | `@container style()` palette branching (🟡 deferred)                                | ✋ **deferred** — powerful micro-theming (text palette branches by surface), but advanced and orthogonal to v58's "derive + disambiguate" core. Record as a future-roadmap candidate.                                                         | T6→doc  |
| C-3 | "Express every color in OKLCH" (✅ already done)                                     | ✅ **already shipped** — all primitives + semantics are OKLCH; themes already use OKLCH contrast literals. v58 builds the *derivation* layer on top; it does not "adopt OKLCH."                                                                | all     |
| R-1 | Variant-matrix + token-manifest generators, MCP surfaces, `@layer` order, fallback contract (✅ reuse) | ✅ `scripts/variants/generate.ts` (role→token, byTheme), `generate-manifest.mjs` (canonical/aliasOf), `get_tokens`/`get_variant_matrix`/`validate_component`, `functions.css` + `fallback:check`. **Extend; do not rebuild.**           | all     |

**Net:** **M-1** is the headline — type is the one axis with no canonical token, and it mirrors the color variant
matrix that already exists. **M-2/M-3** retire hand-authored duplication and add automatic AA via post-2's CSS
techniques, as progressive enhancement. **M-4** brings the agent-facing theme generator onto the same model.
**M-5** is a small AI-surface tightening over machinery (canonical/aliasOf) that already exists. **C-1/C-2/C-3 are
corrections** that stop the plan from ripping out `[data-theme]`, building speculative micro-theming, or "adopting"
OKLCH that already ships.

---

## Tranche map

| Tranche | Theme                                                                                                                                                                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | **Semantic typography tokens + type in the variant matrix (post 1's "ui.default")** — add a purpose layer `--cascivo-text-{display,heading-lg,heading-md,heading-sm,body,body-sm,ui,label,caption,code}`, each resolving to **exactly one** primitive size (+ paired leading/weight/tracking where it removes ambiguity); extend `scripts/variants/generate.ts` to emit a `typography` family (role→token); regen `tokens.json`/`tokens.d.ts`/`TOKENS.md` + the docs `TokensPage`; migrate the canonical reference component (Button label → `--cascivo-text-ui`) as the exemplar. (M-1) |
| T2      | **Derivable color in the shipped themes — relative color syntax + `@property` (post 2)** — in `@layer cascivo.theme`, derive each `*-hover/-active/-subtle/-muted` for `accent`/`primary`/`secondary`/`destructive` from its base via `oklch(from var(--base) …)`, with the current literal as the **static fallback line immediately preceding it** (the `fallback:check` contract); register the themeable color custom properties with `@property` (`syntax:"<color>"; inherits:true`). Extend `fallback:check` to cover relative-color/`contrast-color` declarations; keep `parity.test.ts` green (no token removed). (M-2) |
| T3      | **Automatic contrast — `contrast-color()` with fallbacks (post 2)** — set `--cascivo-color-text-on-accent`/`-on-destructive` (and the `*-content` aliases that point at them) via `contrast-color(var(--cascivo-color-accent))` etc., each preceded by today's literal as the static fallback; verify AA holds across all 12 themes (CI contrast check already exists, `scripts/checks/color/contrast.ts`). (M-3) |
| T4      | **Bring `create_theme` onto the derivation model (post 1 F2 + post 2)** — rewrite `packages/mcp/src/theme.ts` to emit OKLCH relative-color ramps (`oklch(from <primary> calc(l - .08) c h)` for hover, chroma/lightness steps for subtle/muted) and `contrast-color()` for text-on-*, **each with a static fallback**; replace the hardcoded hex status colors with in-system OKLCH derived from the inputs; output stays a valid `@layer cascivo.theme [data-theme='…']` block. Update `theme.test.ts`. (M-4) |
| T5      | **Canonical tokens for agents — "exactly one correct token" on the AI surfaces (post 1 F3)** — MCP `get_tokens` marks `aliasOf`/`canonical` and returns **canonical-only by default** with an opt-in `includeAliases`; `get_variant_matrix` gains the T1 `typography` family; `validate_component` warns when a manifest/CSS uses an alias where a canonical token exists; document the rule. (M-5) |
| T6      | **Correct the record & document the seams** — `docs/cookbooks/derivable-theming.md` (relative color + `contrast-color` + `@property` patterns, always with the fallback contract); a `THEMING.md` section explaining **why `[data-theme]` stays** instead of `light-dark()` (C-1) and that `@container style()` palette branching is a **deferred** future candidate (C-2); note OKLCH is already the floor (C-3); flip this roadmap's status when implemented. (C-1/C-2/C-3) |

Ordering rationale: **T1** is independent (typography) and can land first. **T2 → T3 → T4** form the color-derivation
spine: T2 establishes the relative-color + fallback pattern in the shipped themes, T3 adds `contrast-color()` on top
of it, and T4 mirrors the same model in the generator (so generated themes match hand-authored ones). **T5** depends
on T1 (it surfaces the new `typography` family) and is otherwise independent. **T6** carries the wrap-up and lands
last. Critical path: T2→T3→T4; T1 and T5(after T1) parallelize; T6 last.

---

## Out of scope

- **Replacing `[data-theme]` with `light-dark()`/`color-scheme`.** Collapses 12 themes to 2 and breaks
  container-scoped theming (C-1). v58 keeps the attribute system and only *derives within* it.
- **`@container style()` micro-theming / per-surface palette branching.** Deferred to a future roadmap (C-2); v58
  ships none of it.
- **"Adopting OKLCH."** Already shipped (C-3) — v58 builds the derivation layer above it.
- **A new component, hook, layout primitive, or utility-CSS layer.** v58 ships tokens, derived theme values,
  generator changes, MCP-surface changes, and docs — no new UI and no utilities (CLAUDE.md Core Principle 3).
- **Removing alias tokens.** T5 *steers agents* to canonical names and marks aliases deprecated on the AI surfaces;
  the aliases stay in the CSS for backward compatibility (the `ALIASES` map already exists for that reason).
- **A non-fallback'd use of any progressive CSS feature.** Every `oklch(from …)`, `contrast-color()`, and
  `@property`-dependent value ships behind the static-fallback contract enforced by `pnpm fallback:check`.
- **Auto-deriving typography *roles* from usage.** T1 hand-authors the role→primitive map (like the color semantic
  layer); no AST/usage mining.

---

## Definition of done (verified after T6)

- A semantic typography layer ships (`--cascivo-text-{display,heading-lg,heading-md,heading-sm,body,body-sm,ui,label,
  caption,code}`), each mapping to exactly one primitive; the variant matrix (`tokens.variants.json`) carries a
  `typography` family (role→token); `TOKENS.md`/`tokens.d.ts`/`TokensPage` regenerate clean (drift check passes);
  Button's label uses `--cascivo-text-ui` as the documented exemplar.
- The 12 shipped themes derive `*-hover/-active/-subtle/-muted` via `oklch(from var(--base) …)` with a static
  fallback preceding each; the themeable color custom properties are `@property`-registered; `parity.test.ts` is
  green (no token dropped); `pnpm fallback:check` passes (extended to cover relative-color/`contrast-color`).
- `--cascivo-color-text-on-accent`/`-on-destructive` resolve via `contrast-color()` with literal fallbacks; the CI
  contrast check passes AA on all 12 themes.
- `packages/mcp/src/theme.ts` emits OKLCH relative-color ramps + `contrast-color()` (each with a fallback) and **no
  hex literals**; `theme.test.ts` asserts the new shape and the fallback presence.
- MCP `get_tokens` returns canonical-only by default (opt-in `includeAliases`) and flags `aliasOf`;
  `get_variant_matrix` returns the `typography` family; `validate_component` warns on alias-where-canonical-exists.
- `docs/cookbooks/derivable-theming.md` and the `THEMING.md` "why `[data-theme]`, not `light-dark()`" +
  "`@container style()` deferred" sections exist; the OKLCH-already-shipped note is recorded.
- `pnpm ready` green; `pnpm ready:ci` if the token/theme build pipeline changed; `pnpm breakpoint:check` +
  `pnpm fallback:check` + the drift check clean; **no new runtime dependency, no new component, no utility-CSS
  layer, no move off `[data-theme]` or OKLCH.**

---

## Notes

- This roadmap was **planned from two external articles** and deliberately *corrects* them where cascivo already
  disagrees or differs: OKLCH is already the floor (C-3); `light-dark()` does not fit a 12-theme `[data-theme]`
  system (C-1); `@container style()` branching is deferred (C-2). Surfacing the disagreement is the point — per
  CLAUDE.md "Think Before Coding."
- The verification figures (8 raw type sizes + no type family in the variant matrix; empty grep for `oklch(from`/
  `@property`/`light-dark`/`contrast-color`; the per-theme hand-authored variants and contrast literals at
  `light.css:39–40`/`dark.css:38–39`; the `color-mix`+hex generator at `theme.ts:62–68`; the `ALIASES` map) are
  point-in-time reads of `main` at 2026-06-29 and should be re-confirmed at implementation start.
- Nearest prior art in-repo: the color **variant matrix** (`scripts/variants/generate.ts`) is the exact template T1
  follows for typography; the **canonical/alias** tracking in `generate-manifest.mjs` is the data T5 surfaces; the
  `@function`/`if()` **static-fallback contract** (`functions.css` + `fallback:check`) is the discipline T2–T4
  extend to relative color and `contrast-color()`.
</content>
</invoke>
