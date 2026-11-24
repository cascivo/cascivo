# Phase 1 (Contract): implementation plan

Status: done (2026-11-23). Parent: [rust-html-stack-plan.md](rust-html-stack-plan.md) (Phase 0 done).
Effort: 2–2.5 weeks, 6 workstreams in parallel after a 1.5-day foundation.

**Owner's goal.** New dynamic apps built with plain HTML/CSS + htmx + Solid (Rust/axum servers),
not React, that keep the cascivo look. Phase 1 delivers the one thing all of them share: a stable,
unhashed markup contract (`cv-*` classes + `data-*` attributes).

## 0. What already exists (do not rebuild it)

- **The class naming exists.** `scripts/html-kit/build-css.ts` runs lightningcss with
  `cssModules.pattern = 'cv-${unit}-[local]'` over each `*.module.css`. It writes
  `crates/cascivo-html/assets/css/<unit>.css` (46 units), which `css_gen.rs` embeds.
  `cv-button-button`, `cv-button-label`, `cv-combobox-popup` are emitted by Rust today.
  `@cascivo/elements` already depends on one of these classes (`combobox.ts:158`).
- **Variants are already data attributes.** Example: `button.tsx` sets `data-variant`, `data-size`
  and `data-state`, and `button.module.css` styles them with `&[data-variant='primary']`.
  So the contract is mostly classes for *parts* and data-* attributes for *state/variant*.
- **React hashes** (`_button_1r5fv_83`); only the `html-conformance` Vitest project is `non-scoped`.
- **Rust emitters are hand-written** (`crates/cascivo-html/src/emit/*.rs`, 2.4k lines, 52 names,
  class string literals). `gen-rust.ts` generates only catalog/guide/CSS tables from `CV_SPEC`.
- **Parity exists**: exact-match + facts-diff tests, 24 components, 217 cases, against Rust
  snapshots that `cargo test` keeps honest.
- **Adopter tooling exists.** `cascivo add` records sha256 values in the lock; `cascivo update`
  does a 3-way merge; `cascivo doctor --drift` detects local edits.

**Decision 1: the contract is the existing `cv-<unit>-<local>` pattern.** It needs no Rust
migration, `@cascivo/elements` already uses it, and it cannot collide with adopter classes. A
prettier root alias (`cv-button` for `cv-button-button`) is open question Q1.

## 1. Inventory (149 component dirs; `clientJs` from meta + hook grep)

| Class | Count | Phase 1 scope |
|---|---|---|
| **P**: presentational, static markup is complete (badge, card, heading, kbd, stat, timeline, …) | 46 | anatomy + contract + Rust emitter + parity |
| **P′**: `clientJs: enhancement`, JS is incidental (accordion, alert, avatar, breadcrumb, collapsible, image, notification, spinner, steps, structured-list, tag) | 11 | same as P (all 11 already have emitters) |
| **C**: CSS-only interaction possible (`<details>`, native controls, radio cards): ai-badge, ai-status, chain-of-thought, checkbox-card, contained-list, prompt-suggestions, radio-card, rating-group, reasoning, sources, tool-call (+ radio, slider, native-select) | 14 | same as P; behaviour stays native |
| **J**: needs JS (menus, overlays, pickers, tables, virtual lists, …) | 78 | anatomy + contract only. Emitters and elements come in Phase 4. |
| not components: blocks, brand, test-utils | 3 | excluded |

- Already covered (case + emitter): 19 dirs plus layout-only names (grid, flex, kpi, meter, …).
  **Gap for Phase 1: about 52 components** (P + P′ + C − covered) need an emitter and cases.
- The grep classification is a starting point; task A2 makes it authoritative (`contractTier`, §2).

## 2. Meta additions

In `packages/core/src/types.ts` (`ComponentMeta`, line 118):

```ts
anatomy?: Anatomy            // required for every component with a CSS module (gate G2)
contractTier?: 'static' | 'native' | 'behaviour'   // P/P′ | C | J; drives which gates apply
type Anatomy = {
  root: Part                  // the root part; class = `cv-<unit>-<local>`
  parts?: Record<string, Part> // key = CSS-module local name (label, icon, …)
}
type Part = {
  element: string | string[]  // 'button' | ['a','button'] (polymorphic)
  local?: string               // CSS-module local name; defaults to the key ('root' → unit)
  data?: Record<string, string[] | 'string' | 'number' | 'boolean'>  // data-variant: [...]
  aria?: string[]              // aria-* the part may carry (documented, diffed by parity)
  role?: string
  children?: string[]          // ordered part keys; '$slot' / '$text' for content
  when?: string                // prop expression the part depends on: 'icon', 'loading'
  emit?: 'auto' | 'manual'     // P only: 'auto' lets gen-rust write the emitter (§4)
}
```

- `data.*` values default from `variants`/`sizes`/`states`; the generator fails if they disagree.
- Docs: a "Markup contract" section in `docs/AI-RULES.md` + `scripts/llms/generate.ts` (anatomy
  becomes the plain-HTML recipe in `llms/<name>.md`), then `pnpm regen`.

## 3. Generation pipeline and file layout

```
<name>.meta.ts (anatomy) ─┐
<name>.module.css ────────┼─ scripts/contract/generate.ts  (new, runs in `pnpm regen`)
                          │    ├─ packages/css/dist/<unit>.css      lightningcss, pattern cv-${unit}-[local]
                          │    ├─ packages/css/dist/cascivo.css     all units, @layer order kept
                          │    ├─ packages/css/src/classes.gen.ts   typed map: classes.button.label
                          │    ├─ packages/css/contract.json        committed: parts, classes, data/aria
                          │    └─ docs/CONTRACT.md (generated table) + llms recipe per component
                          └─ scripts/html-kit/gen-rust.ts (extended)
                               ├─ crates/cascivo-html/src/contract_gen.rs  class/data consts per part
                               └─ crates/cascivo-html/src/emit/auto_gen.rs emitters for emit:'auto'
```

- `build-css.ts` moves into the contract generator. The Rust `assets/css/*.css` becomes a copy
  of `packages/css/dist/<unit>.css`, so one CSS build serves both.
- `@cascivo/css` (new `packages/css`, published, `sideEffects: ["*.css"]`). Exports:
  `./cascivo.css`, `./<unit>.css`, `.` (the `classes` map + `Contract` types, zero runtime
  dependencies), `./contract.json`, `./vite` (the `cascivoScopedName` helper, §5). Tokens and
  themes stay in `@cascivo/tokens` / `@cascivo/themes`, and `cascivo.css` documents that you import
  them first.
- `cv-spec.ts` keeps only `.cv`-language data (aliases, args, extraProps). Everything about markup
  moves to anatomy.

## 4. Rust emitters from anatomy

Full codegen of conditional markup would be a template language, so it is split in two:
- **Always generated:** `contract_gen.rs`, one module per unit with `pub const ROOT: &str =
  "cv-button-button"`, `LABEL`, and allowed data values as enums
  (`ButtonVariant::Primary.as_str()`). Hand-written emitters replace every class literal with these
  consts. A `contract-literals` check fails on any `"cv-` literal in `src/emit/**`.
- **Generated for `emit: 'auto'`:** static part tree, `$text`/`$slot`, `when` toggles, data attrs
  straight from props: about 30 of the 52 missing components (kbd, label, status, indicator, …).
- **Manual for the rest** (progress math, list mapping, formatting), still using the consts.

## 5. How CSS modules keep working

- **Our source and `@cascivo/react`:** TSX keeps `styles['label']`. The react build, site,
  storybook and bench apps set `css.modules.generateScopedName = cascivoScopedName`
  (`cv-${unit}-${local}`, same as lightningcss), so React DOM carries contract classes. Same tree,
  rules and specificity: **visually identical** (G6). Minor release: hashed names were never API.
- **Adopter-owned copies (`cascivo add`):** unchanged by default (their bundler hashes their copy).
  Two opt-ins, documented in `docs/CONTRACT.md`:
  1. `import { cascivoScopedName } from '@cascivo/css/vite'` in their Vite config, so their
     copies emit contract classes too (needed only if they mix React with htmx/elements markup).
  2. `cascivo add --contract`: does not copy `.module.css`. It adds `@cascivo/css` as a
     dependency, and the TSX imports a generated `<name>.classes.ts`
     (`export default classes.button`) in place of the module. The import specifier is the only
     line that differs, so `cascivo update`'s 3-way merge and the drift hashes work unchanged.
- With opt-in 1, an adopter who renames a local class leaves the contract; `doctor --drift`
  warns when a copied module's class set differs from `contract.json`.

## 6. Tabs contract (Phase 0 open item)

**Recommendation: the ARIA tablist is the contract, and the radio-hack variant is dropped.**
- Markup = React's: `div.cv-tabs-root > div[role=tablist].cv-tabs-list > button[role=tab]
  [aria-selected][aria-controls][data-state=active|inactive]` and `div[role=tabpanel]
  [aria-labelledby][data-state]`. Inactive panels get `hidden`.
- Behaviour: new `cv-tabs` light-DOM element in `@cascivo/elements` (roving focus, automatic or
  manual activation, `cv-value-change`). Budget ≤ 0.8 KB gz. It survives an htmx swap like
  `cv-menu`.
- Without JS: `cv-tabs:not(:defined)` shows every panel stacked and hides the tablist, so the
  content stays readable (rule in `tabs.css`, inside `@layer cascivo.component`). Rust emits the
  same markup inside `<cv-tabs>` and adds the 0.8 KB script through `client_js` (already in
  the catalog).
- `assets/extra/tabs.css` and the allowlist entry go; tabs joins the zero-drift set. Rejected:
  radios everywhere (not APG tabs: no arrow-key model, wrong roles).

## 7. Versioning and stability

- `@cascivo/css` follows semver on its **contract**, not on the CSS bytes. `contract.json` is the
  API surface (unit → part → class, element, data-* values, aria-*, role).
  - **Major:** remove/rename a class, part, data attribute or value; change a part's element or
    role; change nesting that a selector depends on.
  - **Minor:** add a part, class, data value or component; deprecate with an alias.
  - **Patch:** visual or token changes with the same contract.
- Deprecation: a renamed class keeps its old name as an alias selector
  (`.cv-x-old, .cv-x-new`) for one major. `anatomy.parts[k].deprecated` records it, and it is
  listed in `contract.json` and the docs.
- Local class names in `*.module.css` become public; G1 makes renaming one a deliberate act.
- The npm and crate versions move together: `cascivo-html` declares the `@cascivo/css` contract
  version it emits (`CONTRACT_VERSION` const, checked by G5).

## 8. Gates

| # | Gate | Where |
|---|---|---|
| G1 | `contract:check`: diff `contract.json` against the last published version; a breaking diff needs a major changeset for `@cascivo/css` | `scripts/checks/contract-semver.test.ts`, `ready` + CI |
| G2 | Anatomy coverage: every CSS-module class is an anatomy part, and every part is a class; every `styles['x']` in TSX exists; `data-*` set in TSX ⊆ anatomy | `contract-anatomy.test.ts` (extends `css-contract`) |
| G3 | Parity coverage: every `static`/`native` component has ≥ 1 case, an emitter and zero unallowlisted drift; the allowlist may only shrink | `html-conformance.parity.test.tsx` + `parity-coverage.test.ts` |
| G4 | No class literals in Rust emitters (`"cv-` outside `*_gen.rs`) | `cargo test` in `rust.yml` |
| G5 | Generated files fresh (`contract_gen.rs`, `auto_gen.rs`, `packages/css`) | existing `regen:check` determinism |
| G6 | React visual identity after the scoped-name switch | `visual.yml` (zero diffs, one-off) + `screenshots.yml` |
| G7 | `@cascivo/css` packs and installs alone (no tsconfig/paths leakage) | `pnpm isolated:check`, `pnpm pack:check` |
| G8 | `cv-tabs` size ≤ 0.8 KB gz, axe, APG keyboard, morph survival | `packages/elements` tests + size script |
| G9 | Solid example builds and its Playwright smoke passes | `@cascivo/example-solid-htmx#test` |

## 9. A Solid app on the contract

`apps/examples/solid-htmx` (package name `@cascivo/example-solid-htmx`). It uses an axum server
that sends htmx fragments rendered with `cascivo-html`, plus one Solid island for client state.

```tsx
import '@cascivo/themes/default.css'
import '@cascivo/css/cascivo.css'
import { classes as c } from '@cascivo/css'
// behaviour only, the markup is ours: load the cv-tabs script (`@cascivo/elements/tabs`, not yet published)

export function SaveBar(props: { saving: boolean; onSave: () => void }) {
  return (
    <div class={c.card.root}>
      <span class={c.badge.root} data-variant="secondary">Draft</span>
      <button class={c.button.root} data-variant="primary"
        data-state={props.saving ? 'loading' : 'idle'} onClick={props.onSave}>
        <span class={c.button.label}>Save</span>
      </button>
    </div>
  )
}
```

`classes` is typed from `contract.json` (`c.button.lable` is a type error). Typed `data-*` props
(`@cascivo/solid`) are out of scope.

## 10. Tasks and workstreams

Sizes: S ≤ 0.5 d, M ≈ 1–2 d, L ≈ 3–4 d. Each workstream fits one child session, and each ends
with `pnpm ready` green on its own branch.

**WS-0 Foundation (sequential, everything else waits for it, ~1.5 d)**
- A1 `Anatomy` + `contractTier` types, plus a validator in the meta schema (M)
- A2 Set `contractTier` on all 146 metas from the §1 inventory, reviewed by hand (S)
- A3 `scripts/contract/generate.ts`: `contract.json`, `classes.gen.ts`, absorbs `build-css.ts`
  (M)
- A4 Anatomy for the 10 Phase-0 parity components, as the pattern for later batches (S)

**WS-1 Package and React switch (after WS-0, ~3 d)**
- B1 `packages/css` package: exports, `./vite` helper, README, changeset (M)
- B2 `generateScopedName` in the react build, site, storybook, bench and examples, plus the
  Vite alias rules from CLAUDE.md (M)
- B3 G6 visual run, G7 pack/isolated checks, `STYLING-INTERNALS.md` update (S)

**WS-2 Anatomy authoring, batches (after A4; 3 parallel sessions, ~2 d each)**
- C1 P layout + display (≈ 25), C2 P′ + C (≈ 25), C3 J (78; parts only, no `emit`) (M/M/L)

**WS-3 Rust codegen (after A3, parallel with WS-2, ~4 d)**
- D1 `contract_gen.rs` + migrate the 52 existing emitters to the consts, G4 (L)
- D2 `auto_gen.rs` from `emit: 'auto'` anatomy; regenerate the Phase-0 components and keep their
  snapshots byte-identical (L)

**WS-4 Parity expansion (after D2 + the matching C batch; 2 parallel sessions, ~3 d each)**
- E1 New emitters + cases for C1's components; E2 the same for C2 (L/L)
- E3 G3 coverage gate, switched on when E1 and E2 land (S)

**WS-5 Tabs (independent, can start on day 1, ~2 d)**
- F1 `cv-tabs` element + tests (G8) (M); F2 Rust markup switch, delete radio CSS, drop the
  allowlist entry (S); F3 React tabs: add the `:not(:defined)` fallback rule (S)

**WS-6 Adopters and example (after B1, ~3 d)**
- H1 `cascivo add --contract`, `<name>.classes.ts` generation, drift warning (M)
- H2 `apps/examples/solid-htmx` + axum server + smoke test (M)
- H3 `docs/CONTRACT.md`, `AI-RULES.md` contract section, llms recipe, `pnpm regen` (S)
- H4 the G1 semver gate against the first published `contract.json` (S)

Critical path: WS-0 → WS-3 (D2) → WS-4 → E3 is about 9–10 working days. With 4 sessions in
parallel, the phase fits in 2–2.5 weeks.

## 11. Risks

- **Scoped-name switch** breaks overrides of hashed names (never API; changelog it). G6 covers ours.
- **Global names** vs adopter CSS: `cv-` prefix + `@layer cascivo.component` keep adopters winning.
- **Anatomy drifts from TSX.** G2 runs both ways. The polymorphic roots (`as`, `href`) need
  `element: [...]`, and parity checks the fact, not just the tag.
- **`emit: 'auto'` creeps into a template language.** Cap: no loops, no computed values.
- **J tier has markup without behaviour**; docs mark it "behaviour in Phase 4".

## 12. Open questions for the owner

- **Q1** Root class name: keep `cv-button-button` (no migration) or add the alias `cv-button` on
  every root (nicer HTML, +1 selector per unit)? Recommendation: add the alias in Phase 1.
- **Q2** Tabs: accept §6 (ARIA tablist + `cv-tabs`, stacked panels without JS)? This is a
  behaviour change for `.cv` authors, whose tabs need the 0.8 KB script.
- **Q3** Should `@cascivo/css` publish the scoped-name switch in `@cascivo/react` as a minor
  release (recommended), or wait for 2.0?
- **Q4** `cascivo add --contract`: is it worth it in Phase 1, or should the Vite helper be the only
  path until there is an adopter (criterion 6)?
- **Q5** Solid example: is axum + htmx + Solid the reference stack, or should the example stay
  Node/Vite-only to keep CI free of Rust in the JS job?

### Owner decisions (2026-11-23)

Q1 add the `cv-<unit>` root alias. Q2 accept §6. Q3 minor release. Q4 no `cascivo add --contract`
in Phase 1 (Vite helper only; H1 dropped until there is an adopter). Q5 the example runs on axum;
its smoke test lives in the Rust CI job, so the JS job stays Rust-free.
