# Improvements plan — "AI-first Vercel dashboard" experience report (layer discipline)

**Status: proposed — ready for implementation.**
**Source:** a hands-on experience report from a team that built a Vercel-style dashboard
(dense project-card grid, team switcher, command palette, multi-pane layout) on cascivo,
explicitly operating **AI-first**: agents authored the layout/CSS, humans reviewed and
prompted. The report praised layer isolation ("no specificity wars"), zero-dep velocity,
and predictable AI code-gen, and raised four friction points/red flags:

1. The **"unlayered wins" trap** — one raw unlayered hotfix silently beats every layer.
2. **Multi-nested layer verbosity** — deep sub-component layers (`cascivo.layout.card.status`).
3. **Legacy third-party CSS clashes** — unlayered vendor CSS steamrolls the system.
4. The **utility-first mindset shift** — Tailwind-institutionalized reviewers, and no
   copy-pasteable AI instruction templates.

The report's own proposals (Stylelint plugin, "escalation layer", layer budget in a
`system-prompt.md`, PostCSS wrapper plugin, Shadow-DOM sandbox, VS Code extension) were
each checked against this codebase before planning. Several map onto things that
**already ship**, several map onto **real bugs found during the audit**, and several are
rejected/deferred with rationale (§ Out of scope).

**Scope:** `@cascivo/tokens`, `@cascivo/components` (blocks), `cascivo` CLI (audit,
doctor, create), `skills/`, `scripts/llms`, `scripts/checks`, docs, CLAUDE.md.

---

## 0. Claim-by-claim audit — what the code actually shows

Every fix below is grounded in these verified findings. Line references were checked on
the current default branch.

| Report claim / proposal | Verdict | Evidence |
| --- | --- | --- |
| **"Unlayered wins" trap needs a zero-unlayered linter** | **Real gap.** The trap is *documented* three times (`docs/CSS-LAYERS-PITFALL.md:29-31`, `docs/TROUBLESHOOTING.md:55-67`, `docs/USING-WITH-TAILWIND.md:51-55`) but *enforced* nowhere. `layers:check` (`scripts/checks/layer-order.test.ts`) validates only `@layer a, b, c;` **order statements**, never that declarations actually live inside a layer. `cascivo audit` (`packages/cli/src/audit-ai/`) has four rules (css-literals, jsx-props, required-props, raw-strings) — none touch layering. Ironically its own "clean" fixture (`packages/cli/src/audit-ai/__fixtures__/clean/GoodComponent.css`) is unlayered. | see paths |
| **"Escalation layer" (`@layer emergency`) needed** | **Already shipped — but invisible to the AI.** `cascivo.override` is the canonical top layer (`packages/tokens/src/layers.css:29`) and is documented for humans (`docs/CSS-LAYERS-PITFALL.md:33-48`). But no AI surface mentions it: `scripts/llms/generate.ts` emits `llms.txt` with zero layer-discipline guidance (grep: "layer" appears only in the tagline, a catalog link, and browser support); the MCP server prompt/context modules never mention layers; no skill mentions it. | see paths |
| **Skills actively teach the wrong layers** (found during audit) | **Real bug.** `skills/cascivo-create-theme/SKILL.md:3,40` instructs `@layer cascade.theme { … }` and `skills/cascivo-extend/SKILL.md:63` instructs `@layer cascade.component { … }` — the **pre-v37 namespace** (renamed per `docs/CSS-LAYERS-PITFALL.md:3-8`). An undeclared layer name is *appended after* every layer in the canonical statement, i.e. **after `cascivo.override`** — so an AI following these skills produces CSS that silently beats the documented escape hatch and every theme. This is precisely the failure mode the report warns about, shipped in our own AI tooling. | see paths |
| **Multi-nested layer verbosity** (`cascivo.layout.card.status`) | **Not a problem for components — a real ordering bug for blocks.** All 171 component/layout/chart/flow/ai CSS modules use one flat `@layer cascivo.component { … }` block with CSS-module scoping — no deep sublayers exist. **But** the 8 shipped blocks each declare `@layer cascivo.blocks.<name> { … }` (`packages/components/src/blocks/*/​*.module.css:1`), and `cascivo.blocks` is **not in the canonical order statement** — not in `layers.css:29`, not in the CLI scaffold (`packages/cli/src/commands/create.ts:164`), not in any `apps/examples/*/index.html`. Undeclared → appended after `cascivo.override` → **block styles beat the consumer escape hatch**, contradicting both the layers.css header comment (which falsely claims blocks "are not shipped by any package", `layers.css:23-24`) and the documented contract. `cascivo add <block>` (`packages/cli/src/commands/add.ts`) copies the CSS with zero layer-statement handling or post-add hint. Same class of bug: `packages/tokens/src/functions.css:18` uses `@layer cascivo.functions`, also undeclared. | see paths |
| **Third-party unlayered CSS needs a PostCSS wrapper + Shadow-DOM sandbox** | **Problem real; proposed tooling wrong for this repo; zero mitigation today.** No doc anywhere shows the native `@import url(…) layer(…)` taming recipe (repo-wide grep for `layer(` in docs/CLI/llms: no hits). `docs/CHART-LIBRARIES.md` compares Chart.js/ECharts without an integration recipe. `cascivo doctor` (`packages/cli/src/commands/doctor.ts`) checks banned hooks only. A PostCSS plugin contradicts the toolchain (vp/Rolldown, zero-dep thesis, "no config hell") — and is unnecessary: `@import … layer()` is native CSS and needs no build step. Shadow-DOM sandbox: deferred (§ Out of scope). | see paths |
| **Mindset shift needs instruction templates + VS Code hover extension** | **Partially covered; template gap real.** `docs/USING-WITH-TAILWIND.md` exists for humans. But there is no copy-pasteable agent-rules template (cursor rules / CLAUDE.md snippet for *consumer* projects), and `cascivo create` scaffolds no agent-rules file (grep create.ts for agents/claude/cursor/rules: no hits). VS Code extension: deferred (§ Out of scope). | see paths |

**Net finding:** the report's core insight — *"in an AI-first workflow the solutions must
live in the system's architecture, tooling, and AI surfaces, not in documentation"* — is
validated by this audit: everything the report asks for that already exists, exists only
in human-facing docs, while the AI surfaces (skills, llms.txt, MCP, scaffold) either say
nothing or say the **wrong** thing.

---

## Phase 1 — Fix the shipped layer-correctness bugs (ship first)

These are bugs regardless of the report. Small, high-confidence, independent of the rest.

### 1.1 Fix the stale `cascade.*` layer names in skills

- `skills/cascivo-create-theme/SKILL.md` — line 3 (frontmatter description) and line 40
  (code block): `cascade.theme` → `cascivo.theme`.
- `skills/cascivo-extend/SKILL.md:63`: `cascade.component` → `cascivo.component`.
- Sweep: `grep -rn '@layer cascade\.' skills/ docs/ packages/ apps/` and fix any other
  survivors (exclude CHANGELOGs and the v37 rename notes, which legitimately mention the
  old name historically).

### 1.2 Give `cascivo.blocks.*` a declared slot in the canonical order

Change the canonical statement in `packages/tokens/src/layers.css` to:

```css
@layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.blocks, cascivo.override;
```

`@layer cascivo.blocks.<name> { … }` blocks then create sublayers **inside** the declared
`cascivo.blocks` position (between theme and override — the slot the layers.css comment
already recommends for block-like sublayers), instead of appending above `cascivo.override`.

Work items:

1. `packages/tokens/src/layers.css` — add `cascivo.blocks`; rewrite the header comment:
   blocks **are** shipped (registry copy-paste source under
   `packages/components/src/blocks/`), and per-block sublayers of `cascivo.blocks` are the
   sanctioned pattern; `cascivo.example` remains the app-local example slot (apps keep
   interleaving it as today).
2. `scripts/checks/layer-order.test.ts:113-122` — update the canonical-order assertion to
   the 7-name sequence.
3. `packages/cli/src/commands/create.ts:164` — scaffold emits the new statement.
4. Every `apps/examples/*/index.html` (7 apps incl. react-vite/react-next) and the
   `apps/site` bootstrap — add `cascivo.blocks` in-slot (keep each app's `cascivo.example`
   where it is; the layer-order check verifies relative order).
5. Docs: `docs/CSS-LAYERS-PITFALL.md` (canonical-order section + fix snippet),
   `docs/THEMING.md` if it restates the order, `docs/v37-CONSUMER-CHANGES.md` untouched
   (historical).
6. Changesets: **minor** for `@cascivo/tokens` (and anything re-exporting layers.css) with
   a CHANGELOG note + one-line `docs/UPGRADING.md` entry: *"blocks now order below
   `cascivo.override`; if you relied on a block beating your override layer, that was the
   bug this fixes."*

**Decision (made, don't re-litigate):** keep per-block sublayers rather than flattening
blocks into `cascivo.component`. Rationale: blocks intentionally sit above
`cascivo.component`/`cascivo.theme` so they can re-tune component tokens inside their
subtree; flattening would need a per-block behavioral audit for zero payoff. Adding one
canonical name is the minimal, honest fix. If implementation discovers a block that
*must* beat `cascivo.override`, stop — that's a design smell to surface, not to encode.

### 1.3 Fold `cascivo.functions` into `cascivo.tokens`

`packages/tokens/src/functions.css:18` — change the block to `@layer cascivo.tokens { … }`
and delete the `cascivo.functions` name. Rationale: `@function` definitions resolve by
layer priority when redefined; as an undeclared layer they currently sit above
`cascivo.override`, so a consumer redefining `--cascivo-step()` in their override layer
would lose. Functions are token-adjacent; `cascivo.tokens` gives them a declared, low
slot without growing the canonical statement. Verify: repo-wide grep for
`cascivo.functions` (audit found no other references), `pnpm fallback:check`,
`@cascivo/tokens` tests.

### 1.4 Durable guard — undeclared cascivo layer names become CI failures

Extend `scripts/checks/layer-order.test.ts` (same file, new `it()` blocks — it already
walks packages/apps/docs):

- Collect every `@layer <dotted-name> {` **block prelude** (not just order statements)
  from `packages/*/src/**/*.css`.
- Assert each name is either (a) exactly one of the canonical names, or (b)
  `cascivo.blocks.<block-name>` — i.e. its two-segment prefix `cascivo.blocks` is
  canonical and depth is exactly 3. Any other `cascivo.*` name (e.g. a resurrected
  `cascivo.functions`, a hallucinated `cascivo.layout.card.status`) fails with the file,
  line, and the canonical list.
- Non-`cascivo.*` block names in `packages/*/src` also fail (shipped CSS must not invent
  foreign layer roots). Seed no allowlist — the tree is clean after 1.2/1.3.

This is the mechanical enforcement of the report's "layer budget": depth ≤ 3, and only
via the one sanctioned `cascivo.blocks.*` family.

### Acceptance criteria (Phase 1)

- `grep -rn '@layer cascade\.' skills/` → no hits.
- New unit assertion (jsdom or the existing layer-order harness): with the canonical
  statement loaded plus a `@layer cascivo.blocks.app-shell { .x { color: red } }` block
  plus `@layer cascivo.override { .x { color: green } }`, computed color is **green**.
- Intentionally adding `@layer cascivo.bogus { }` to any package CSS makes
  `pnpm layers:check` fail; reverting makes it pass.
- `pnpm ready` fully green (regen may rewrite generated artifacts — commit them).

---

## Phase 2 — Zero-unlayered enforcement (the report's linter, house-style)

Two enforcement points: the **repo** (our shipped/copied CSS can never regress) and the
**consumer project** (the report's actual scenario: a teammate's raw hotfix). No ESLint/
Stylelint plugin — the house pattern is zero-dep hand-rolled scanners
(`scripts/checks/css-fallback.ts`, `audit-ai/css-literals.ts` are the models).

### 2.1 Repo check: `scripts/checks/unlayered.test.ts` (`pnpm unlayered:check`)

- Walk `packages/*/src/**/*.css` (skip `node_modules`, `dist`, `__fixtures__`).
- Tokenize with a comment/string-aware brace-depth tracker (reuse/adapt the stripping
  approach in `packages/cli/src/commands/doctor.ts:24-58`). Flag any **style rule**
  (selector block containing declarations) that has no `@layer` ancestor block.
- Top-level at-rules that are legitimately unlayered and pass: `@charset`, `@import`
  (including `layer()` variants), `@layer` statements/blocks, `@property` (precedent:
  `packages/tokens/src/properties.css` keeps them top-level deliberately),
  `@custom-variant`/`@theme` (Tailwind-bridge syntax). `@media`/`@container`/`@supports`
  at top level are fine **only if** every rule inside them is itself inside `@layer`.
  `@keyframes` must be inside `@layer` (verify current components already do this; if a
  legitimate top-level case exists, use a file-level allowlist, not a blanket exemption).
- File-level allowlist (explicit, in the test): `packages/themes/src/tailwind.css` (the
  Tailwind v4 bridge is unlayered by design).
- Wire into root `package.json`: add `unlayered:check` script and append it to the
  `ready` / `ready:ci` chains next to `layers:check`, and to whatever CI job runs
  `layers:check` today.

### 2.2 Consumer rule: `unlayered-css` in `cascivo audit`

- New `packages/cli/src/audit-ai/unlayered.ts` + `unlayered.test.ts`, exporting
  `findUnlayeredViolations(source, file): UnlayeredFinding[]` with the same finding shape
  conventions as `css-literals.ts` (level/file/line/rule). Reuse the same scanning core
  as 2.1 — put the shared tokenizer in the CLI (`packages/cli/src/utils/`) and have the
  repo check import it, or keep two small copies if the import direction is awkward;
  prefer one shared implementation inside the CLI package since the repo check already
  imports CLI modules elsewhere (`scripts/context/generate.ts:15` imports from
  `packages/mcp/src`— same pattern).
- Level: **`warn`**, not error. `docs/USING-WITH-TAILWIND.md:51-55` explicitly blesses
  deliberate unlayered CSS as an interop technique, so a hard failure would fight our own
  docs. The finding message must teach the fix, not just complain:
  *"Unlayered CSS beats every cascivo layer. For a one-off hotfix use
  `@layer cascivo.override { … }`; for app styles declare an app layer (e.g.
  `cascivo.example`) in your order statement. See docs/CSS-LAYERS-PITFALL.md."*
- Wire into `packages/cli/src/commands/audit.ts` `findingsFor()` for `.css` files.
- Fixtures: `__fixtures__/dirty/Hero.css` is already unlayered — assert the new finding
  in `audit-ai.integration.test.ts`. **Wrap `__fixtures__/clean/GoodComponent.css` in
  `@layer cascivo.override { … }`** so the clean fixture stays clean, and adjust any
  line-number expectations in existing tests.

### 2.3 `cascivo doctor`: unlayerable vendor-CSS imports

- New doctor rule in `packages/cli/src/commands/doctor.ts`: flag JS/TS-side
  `import 'bare-specifier….css'` (a bare specifier resolving into `node_modules`) — CSS
  imported through the JS graph **cannot** be layered, so it lands unlayered above every
  cascivo layer. Suggested fix in the violation detail: route it through a CSS file with
  `@import url('<pkg>/….css') layer(vendor);` (Phase 3 recipe), linking
  `docs/THIRD-PARTY-CSS.md`.
- Relative-path `.css` imports (the consumer's own modules) are **not** flagged — CSS
  modules are scoped and the 2.2 audit rule covers raw project CSS.
- Tests: extend `doctor.test.ts` with positive (bare `chart.js/dist/chart.css` import)
  and negative (`./styles.module.css`) cases.

### Acceptance criteria (Phase 2)

- Seeding an unlayered `.foo { color: red }` into any `packages/components/src/**.css`
  fails `pnpm unlayered:check`; reverting passes.
- `cascivo audit` on the dirty fixture reports `unlayered-css` at level `warn`; on the
  clean fixture reports none.
- `cascivo doctor` flags a bare vendor `.css` import and does not flag relative ones.
- `pnpm ready` green.

---

## Phase 3 — Third-party CSS: the native `layer(vendor)` recipe (no PostCSS)

### 3.1 New doc: `docs/THIRD-PARTY-CSS.md`

Contents (concise, recipe-first, mirroring the tone of `docs/USING-WITH-TAILWIND.md`):

1. **The problem** — vendor global CSS is unlayered author CSS and beats every cascivo
   layer regardless of specificity.
2. **The recipe** — declare a low-priority vendor layer *before* the cascivo statement and
   import vendor CSS into it; native CSS, zero build tooling:

   ```css
   /* app.css — imported before anything else */
   @layer vendor; /* declared first = lowest priority */
   @import url('some-chart-lib/dist/styles.css') layer(vendor);
   ```

3. **The JS-import caveat** — `import 'lib/dist/styles.css'` in JS cannot be layered;
   move such imports into a CSS file using the recipe above. Note the residual case the
   recipe cannot fix: CSS a library injects at runtime via JS (`<style>` insertion) or
   inline `style=""` attributes stays unlayered/above-layers; for inline styles the only
   counter is the library's own escape hatches — name this honestly rather than promising
   a sandbox (see § Out of scope for the Shadow-DOM decision).
4. Cross-links: from `docs/TROUBLESHOOTING.md` (the "unlayered wins" entries around
   lines 55-67), `docs/CHART-LIBRARIES.md` (Chart.js/ECharts sections — "if you adopt one
   anyway, tame its CSS like this"), `docs/USING-WITH-TAILWIND.md`, and the
   `docs/README.md` index.

### 3.2 Scaffold the vendor slot

`packages/cli/src/commands/create.ts` — the scaffolded `index.html` statement becomes:

```css
@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.blocks, cascivo.override;
/* third-party CSS: @import url('<pkg>/styles.css') layer(vendor); */
```

`vendor` is a non-`cascivo.*` name so the layer-order check ignores it by design
(`layer-order.test.ts:46-49`); confirm the scaffold statement still passes the check.
Do **not** retrofit `vendor` into the example apps — they have no vendor CSS; the
scaffold + doc are the consumer-facing surface.

### Acceptance criteria (Phase 3)

- `docs/THIRD-PARTY-CSS.md` exists, is linked from the three named docs + index.
- A scaffolded app (`create.test.ts` snapshot/assertions updated) contains the vendor
  slot + comment, and `pnpm layers:check` passes.

---

## Phase 4 — Layer discipline on every AI surface (the report's core ask)

The report's "update `system-prompt.md`" proposal, mapped to the surfaces that actually
exist here: llms.txt, skills, the MCP server, the scaffold, and this repo's CLAUDE.md.
One shared contract, stated identically everywhere (write it once, paste it four times —
do not let the wordings drift):

> **The cascivo layer contract**
> 1. Every declaration lives inside an `@layer` block. Unlayered CSS beats all layers —
>    never emit it.
> 2. Never invent layer names. The only writable layers are: your app's own slot (e.g.
>    `cascivo.example`, declared in your order statement) for page/app styles, and
>    `@layer cascivo.override { … }` for hotfixes/one-off overrides — it beats everything
>    cascivo ships.
> 3. Never nest layers deeper than the shipped `cascivo.blocks.<name>` pattern. For
>    sub-elements (a badge in a card, a dot in a badge) use **native CSS nesting inside
>    one layer block**, not new sublayers.
> 4. Third-party CSS: `@import url(…) layer(vendor);` with `vendor` declared before the
>    cascivo layers. Never import vendor CSS from JS.
> 5. Style with `--cascivo-*` tokens, not raw values (the `cascivo audit` rules enforce
>    this).

Work items:

1. **`scripts/llms/generate.ts`** — add a "CSS layer contract" section to the generated
   `llms.txt` (near the existing browser-support/token-catalog lines, ~line 460-490):
   the canonical order statement + the five rules above. Run `pnpm regen` and commit the
   regenerated `apps/site/public/llms.txt`. `llms:check` asserts channels/stylesheets
   only, so no check change is needed — but confirm it stays green.
2. **Skills** — `skills/cascivo-design-page/SKILL.md` gains a short "Styling discipline"
   step containing the contract (it currently says nothing about layers); the two skills
   fixed in Phase 1.1 get one added line each pointing hotfix-style overrides at
   `cascivo.override`.
3. **MCP server** — add the contract to the server's instructions string (locate where
   `packages/mcp/src/server.ts` composes its instructions/description) so every
   MCP-driven agent receives it before generating styles. Keep it to the five rules —
   the MCP context is token-budgeted.
4. **Scaffold `AGENTS.md`** — `cascivo create` writes an `AGENTS.md` at the project root
   containing: the contract, the project's declared layer-order statement, a pointer to
   `https://cascivo.com/llms.txt`, and one worked example (nested card/badge/dot styled
   via native nesting inside a single layer block — the report's own example, verbatim
   pattern). This is the report's "copy-pasteable system instruction template", delivered
   where agents actually read it. Add a `create.test.ts` assertion.
5. **`docs/AI-RULES.md`** — the same template as a copy-paste block for *existing*
   projects (cursor rules / CLAUDE.md / agent system prompts), plus a short
   "coming from utility-first" mapping table (`p-4` → `padding: var(--cascivo-space-4)`;
   `flex items-center gap-2` → the flex/gap declarations with `--cascivo-space-2`;
   `text-sm text-muted` → `font-size: var(--cascivo-text-sm); color:
   var(--cascivo-color-text-subtle)` — pull real token names from `docs/TOKENS.md`).
   Link it from `docs/README.md`, `docs/GETTING-STARTED.md`, and `docs/USING-WITH-TAILWIND.md`.
6. **CLAUDE.md (this repo)** — add one "Layer discipline" bullet to Part 3's Component
   Authoring Rules (component CSS in `cascivo.component`; block CSS in
   `cascivo.blocks.<name>`; sub-elements via native nesting, never new layer names —
   enforced by `pnpm layers:check` + `pnpm unlayered:check`) and a matching item in the
   "Checklist before committing a component". Keep the edit surgical.

### Acceptance criteria (Phase 4)

- The five-rule contract appears, textually consistent, in: generated `llms.txt`, the
  three skills, the MCP server instructions, the scaffolded `AGENTS.md`, and
  `docs/AI-RULES.md`.
- `pnpm regen` produces no further diff after committing (drift check green).
- A scaffolded project contains `AGENTS.md`; `create` tests assert it.

---

## Sequencing & sizing

| Phase | Scope | Risk | Depends on |
| --- | --- | --- | --- |
| 1 — layer-correctness bugs + name guard | tokens, blocks slot, skills, scaffold, examples, 1 check ext. | Low (one documented, intended behavior change: blocks drop below `cascivo.override`) | — |
| 2 — zero-unlayered enforcement | 1 repo check, 1 audit rule, 1 doctor rule, fixtures | Low (additive; audit rule is `warn`) | 1 (clean tree first) |
| 3 — vendor recipe | 1 doc, scaffold tweak | Very low | 1 (scaffold statement) |
| 4 — AI surfaces | llms gen, skills, MCP, scaffold AGENTS.md, docs, CLAUDE.md | Very low (docs/prompt only) | 1–3 (contract references their outputs) |

Land phases as separate commits on one branch, in order. Gate every phase behind the full
`pnpm ready` (regen → check --fix → all `*:check` → build → typecheck → tests); commit
whatever `regen`/`--fix` rewrites alongside. Changeset needed for Phase 1 (`@cascivo/tokens`
minor + CLI minor for create/audit/doctor changes in Phases 2–3).

## Out of scope (decided — do not implement)

- **ESLint/Stylelint plugin** — the toolchain is Oxlint via `vp` with a zero-dep policy;
  the house pattern for bespoke rules is hand-rolled scanners in `scripts/checks/` and
  `audit-ai/`. Phase 2 delivers the same guarantee inside that pattern.
- **PostCSS `postcss-cascivo-sandbox` plugin** — there is no PostCSS stage in the
  vp/Rolldown pipeline and the native `@import … layer()` recipe achieves the wrapping
  with zero tooling. Phase 3 documents it; the doctor rule catches the JS-import case a
  build plugin would have papered over.
- **`<CascivoSandbox>` Shadow-DOM wrapper component** — deferred, not rejected. Custom
  properties inherit *into* shadow trees, so tokens still flow in (good) but the
  isolation story is subtler than the report assumes; there is no driving use case in the
  repo today, and speculative components violate the simplicity rule. Revisit when a
  concrete third-party-widget integration demands it; the layer(vendor) recipe covers the
  reported cases (chart/kanban global CSS).
- **VS Code "Tailwind-equivalent tooltip" extension** — a separate product with its own
  repo/release lifecycle; the `docs/AI-RULES.md` mapping table (Phase 4.5) delivers the
  cognitive bridge at ~1% of the cost. Revisit on demand signal.
- **Flattening `cascivo.blocks.*` into `cascivo.component`** — see the Phase 1.2 decision
  note.
- **Extending `unlayered:check` to `apps/`** — the site/landing apps have app-local CSS
  with their own conventions; enforce shipped/copied CSS first. Optional follow-up once
  Phase 2 has soaked.
