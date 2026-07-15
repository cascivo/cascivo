# Improvements plan: the "AI dashboard build" experience report (layout, render state, audit loop, vendor CSS)

**Status: implemented.** All five phases shipped on branch
`claude/cascivo-layout-state-spec-gv6c4t`; full `pnpm ready` gate is green. Open questions
were resolved to their recommended answers: layouts `Stack` renamed to `Flex` (non-breaking,
open q1); the seven-primitive export set `Grid/GridItem/Flex/Columns/Center/Spacer/AutoGrid`
(q2); the dead `view.layout` field removed (q3); the vite plugin built (q4); and the
`cascivo-audit: allow <rule>` directive spelling adopted (q5).

**Source:** an experience report from an AI developer agent that built a Vercel-style dashboard
(shell layout with sidebar and sticky header, multi-column card grids, live search filter, tabs,
env-var toggles, third-party analytics charts) on cascivo. It reported four frictions:

1. No higher-level layout containers → verbose custom CSS / inline styles with responsive bugs.
2. Wiring dynamic state into `@cascivo/render` schemas needs boilerplate the agent can't
   reliably generate.
3. `cascivo audit --ai` hard-fails on inline overrides / "invented props" with no escape hatch →
   infinite repair loops.
4. Unlayered third-party CSS stomps cascivo's layers; wants an automated import-layering wrapper.

## TL;DR — claim-by-claim verification against the codebase

Each claim was audited before planning. Two are real gaps, two are half-right — and the
half-wrong halves change what the right fix is.

| Report claim | Verdict | Evidence |
| --- | --- | --- |
| "Cascivo lacks flex/grid layout containers" | **Half-wrong.** 27 layout-category registry entries exist: `layout/grid`, `layout/stack` (flex), `layout/columns`, `layout/auto-grid`, `layout/center`, `layout/split-view`, `layout/spacer`, `layout/masonry`, plus AppShell/DashboardLayout/blocks. But three real gaps made them invisible/insufficient (see below). | `packages/layouts/src/`, `registry.json` (192 entries, 27 layout) |
| "…so the AI wrote verbose CSS with responsive bugs" | **Real gap #1: no responsive props.** `Grid` takes a scalar `cols` and hardcodes a full collapse below `40rem`; there is no per-breakpoint `cols`/`span`. | `packages/layouts/src/grid/grid.tsx:8-11`, `grid.module.css:8-10` |
| (implicit) "the primitives weren't reachable" | **Real gap #2: not in the npm dist + naming trap.** None of the layout primitives are exported from `@cascivo/react` — they're copy-paste only. Worse, `@cascivo/react` *does* export a `Stack`, but it's a different component (a z-offset card-pile, `packages/components/src/stack/stack.tsx`), not the flex Stack. **Real gap #3: discovery steers away.** `docs/RECIPE-DASHBOARD.md` ("Project-card grid" row) literally tells agents to "lay the grid out with CSS grid/flex directly — no special 'card grid' component is needed". And `@cascivo/render`'s 48-component map contains zero layout primitives, so schema-driven pages can't express a grid at all. | `packages/react/src/index.ts:139-144`, `packages/layouts/package.json` ("copy-paste only, no build"), `docs/RECIPE-DASHBOARD.md`, `packages/render/src/component-map.ts` |
| "Dynamic state in `@cascivo/render` hits a wall" | **Right.** The engine has exactly two reference channels — `$data.<path>` and `$actions.<name>` — both resolved from host-supplied React props. There is no declarative state, no event→state wiring, no two-way binding. No production consumer even passes `data`/`actions` today; the channels are exercised only in tests. | `packages/render/src/types.ts:20-29`, `cascade-view.tsx:54-105`, `validate.ts` |
| "`audit --ai` flags overrides as invented props with no way out" | **Right — root cause confirmed.** (a) The known-prop set is the hand-enumerated `*.meta.ts` props embedded in `registry.json`; components actually accept all DOM attributes via `{...props}` spread (e.g. `Button` extends `ButtonHTMLAttributes`), so legitimate `type`, `name`, `title`, `tabIndex`… are non-suppressible `unknown-prop` **errors**. (b) An inline `style` value that happens to equal a token is a hard `hardcoded-value` **error**. (c) There is no inline directive, config allowlist, or per-rule severity knob — the only bypass is a `{...spread}`, which disables prop checks entirely. | `packages/cli/src/audit-ai/jsx-props.ts:13-22,159,182`, `css-literals.ts:62-75`, `commands/audit.ts:206-208`, `utils/contract-pure.ts:92-104` |
| "Introduce an `sx` prop as the escape hatch" | **Wrong fix.** `style` and `className` already pass through on every component and are already in the auditor's `PASSTHROUGH` set. The deadlock is audit severity + contract completeness, not a missing prop. An `sx` styling system would contradict "Modern CSS only" and owned-code. Rejected — see Phase 1. | `packages/components/src/button/button.tsx:19-50`, `jsx-props.ts:13-22` |
| "Unlayered vendor CSS overrides cascivo; ship a build-time wrapper" | **Half-solved already.** The native recipe (`@import url(…) layer(vendor)` + a `vendor`-first layer statement) is documented, scaffolded by `cascivo create`, taught on every AI surface, and linted (`vendor-css-import` audit rule). The **real remaining gap is JS-imported CSS** (`import 'lib/styles.css'`), which native CSS cannot layer — exactly how charting libs are consumed. The repo's "no build plugin" stance (`docs/plans/ai-first-layer-discipline-plan.md` Phase 3) was chosen before this failure mode was observed in practice. | `docs/THIRD-PARTY-CSS.md`, `packages/cli/src/audit-ai/vendor-css.ts`, `packages/cli/src/commands/create.ts:164-166` |

**Plan shape:** five phases, each independently commit-able with its own gate. Phase 1 (audit
escape hatch) is first because it's the only *deadlock* — it blocks agents from completing any
build. Phases 2–3 fix the layout gaps, Phase 4 adds render state, Phase 5 adds the vendor-CSS
build plugin. Phase 4 depends on Phase 3 only for its layout-in-JSON payoff; the `$state` core
is independent.

---

## Phase 1 — Break the audit loop: passthrough contract, severity fix, suppression directive

**Severity: agent-blocking bug.** Non-suppressible false-positive errors + exit code 1 = infinite
repair loop for any autonomous agent.

Three changes in `packages/cli`, plus documentation. No new `sx`/`css` prop anywhere.

### 1a. Recognize DOM passthrough attributes in `unknown-prop`

`isPassthrough` (`packages/cli/src/audit-ai/jsx-props.ts:13-22`) currently allows only
`className/style/id/ref/key/children`, `data-*`, `aria-*`, `on[A-Z]*`. Every audited component
spreads `{...props}` onto its DOM element, so extend the set with a module-level
`HTML_PASSTHROUGH` allowlist of standard HTML/React DOM attributes — at minimum:

```
type name value defaultValue checked defaultChecked placeholder title role tabIndex
form href target rel download src alt width height loading autoComplete autoFocus
required readOnly min max step rows cols wrap maxLength minLength pattern multiple
accept size dir lang hidden draggable spellCheck contentEditable inputMode enterKeyHint
htmlFor slot disabled open
```

Keep it a flat `Set` next to `PASSTHROUGH` with a comment explaining it mirrors the components'
`{...props}` spread (all components extend an `HTMLAttributes` interface — verified in
`button.tsx`, `card.tsx`). Where a name is already in a component's meta props (e.g. `disabled`
on Button), the meta check still runs first — passthrough only applies to props *not* in the
contract, so enum/type validation is unaffected. Do **not** try to derive the list from
TypeScript types or add a `domPassthrough` contract flag — over-engineering for now.

Truly invented props (`sx`, `padding`, `elevation`, …) remain `error` with the existing
did-you-mean suggestion.

### 1b. Downgrade token-matching **inline** styles from `error` to `warn`

In `packages/cli/src/audit-ai/css-literals.ts`, findings that originate from a TSX
`style={{…}}` object (the `INLINE_PROP_MAP` path, `css-literals.ts:114-132`) and match exactly
one token change from `level: 'error'` to `level: 'warn'`, keeping the "use `var(--cascivo-…)`
instead" suggestion text. Findings from `.css` files keep `error` (there the fix is mechanical
and `--fix` rewrites them). This is precisely the report's requested "gentle warning instead of
a hard, loop-blocking failure" — without inventing a new prop. Default exit-code semantics
(`audit.ts:206-208`) are untouched: `warn` never fails the default run.

### 1c. Inline suppression directive — the guaranteed loop-breaker

Add a per-line directive honored by **all** audit rules:

```tsx
{/* cascivo-audit: allow unknown-prop */}
<Button experimentalProp="x" />
```

```css
/* cascivo-audit: allow hardcoded-value */
.hero { padding: 16px; }
```

Semantics: a comment `cascivo-audit: allow <rule-id>[, <rule-id>…]` on the same line or the
immediately preceding line downgrades matching findings on that line to `info` and marks them
`suppressed: true`. The summary prints a suppressed count so they stay visible. Implement as a
post-filter in `findingsFor()` (`commands/audit.ts:47-61`): scan the file's lines once for
directives, then remap findings whose `line` matches — no analyzer needs to change. Rule ids are
the existing ones (`unknown-prop`, `hardcoded-value`, `missing-prop`, `raw-string`,
`unlayered-css`, `vendor-css-import`); an unknown rule id in a directive is itself a `warn`
(catches typos instead of silently not suppressing).

### 1d. Document the escape-hatch ladder (and the `sx` rejection)

Add a short "Overriding styles the sanctioned way" section to `docs/AI-RULES.md` (and let
`pnpm llms:generate` propagate it): 1) component props/tokens → 2) `className` + a rule in
`cascivo.override` → 3) inline `style` with `var(--cascivo-*)` values (audit-clean) → 4)
`cascivo-audit: allow` for the rare rest. State explicitly that `style`/`className` pass through
on every component — this is the fact the report's agent never learned. Reference this ladder
from the `unknown-prop` and inline `hardcoded-value` finding messages so the loop-breaking
information arrives *inside the loop*.

**Tests** (conventions: colocated Vitest, pure `buildContract` fixtures — see
`jsx-props.test.ts:6-23`):

- `jsx-props.test.ts`: `type`/`name`/`tabIndex`/`title` on Button produce no finding; `sx` and
  a misspelled real prop still produce `unknown-prop` errors.
- `css-literals.test.ts`: token-matching inline style → `warn`; same value in a `.css` file →
  still `error`.
- New `suppress.test.ts` (or extend `commands/audit.test.ts`): directive downgrades exactly the
  named rule on the adjacent line; unknown rule id warns; summary counts suppressed findings.
- Update `audit-ai/__fixtures__` + `audit-ai.integration.test.ts`: `dirty/Hero.tsx` must still
  exit 1; add a suppressed line + a DOM-attr usage to `clean/GoodComponent.tsx` (must stay at
  zero non-info findings).

**Verify.**

```sh
pnpm exec vp run cascivo#test
pnpm ready
```

---

## Phase 2 — Responsive token-driven props for the layout primitives

**Severity: real gap.** The dashboard-shell use case (12-col mobile → 3-col desktop card grid,
spanning items) cannot be expressed with today's scalar props, so agents fall back to hand-CSS —
the report's friction #1.

### API — object form, not string micro-syntax

The report proposes `columns="1 lg:3"`. Use a **typed object** instead — no parser, no invalid
strings, IDE/registry-schema checkable, and JSON-serializable (which Phase 4 needs):

```tsx
type Responsive<T> = T | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', T>>

<Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
  <GridItem span={{ base: 1, lg: 2 }}>…</GridItem>
</Grid>
```

Breakpoint names/values are the canonical scale (`sm 30rem / md 40rem / lg 64rem / xl 80rem`,
`packages/tokens/src/index.css:308-311`) — the only literals `breakpoint:check` allows.

### Implementation (`packages/layouts/src/grid/`)

Custom properties carry the values; the CSS module owns the canonical breakpoint literals
(remember: `@container` cannot read custom properties, so the query widths are hardcoded to the
canonical rems and only the *values* flow through vars):

```tsx
// grid.tsx — scalar cols keeps today's exact behavior; object opts into responsive mode
style={{
  '--_grid-cols': String(resolve(cols, 'base') ?? 12),
  '--_grid-cols-sm': str(cols, 'sm'), // undefined omits the property
  '--_grid-cols-md': str(cols, 'md'),
  '--_grid-cols-lg': str(cols, 'lg'),
  '--_grid-cols-xl': str(cols, 'xl'),
}}
data-responsive={typeof cols === 'object' ? '' : undefined}
```

```css
@layer cascivo.component {
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--_grid-cols, 12), minmax(0, 1fr));
    gap: var(--_grid-gap, var(--cascivo-space-4));
    container-type: inline-size;

    /* scalar mode — unchanged back-compat collapse */
    &:not([data-responsive]) {
      @container (max-width: 40rem) {
        grid-template-columns: 1fr;
      }
    }

    /* responsive mode — each tier falls back to the previous one */
    &[data-responsive] {
      @container (min-width: 30rem) {
        grid-template-columns: repeat(var(--_grid-cols-sm, var(--_grid-cols, 12)), minmax(0, 1fr));
      }
      @container (min-width: 40rem) {
        grid-template-columns: repeat(
          var(--_grid-cols-md, var(--_grid-cols-sm, var(--_grid-cols, 12))),
          minmax(0, 1fr)
        );
      }
      /* …lg 64rem, xl 80rem, same fallback chain… */
    }
  }
}
```

Notes for the implementer:

- **Back-compat is load-bearing:** scalar `cols` must keep the existing hardcoded `40rem`
  collapse (blocks and example apps rely on it). Only the object form enters responsive mode.
- The nested `@container` queries resolve against the **nearest ancestor** container (same as
  the existing 40rem rule today — an element can't query itself). Don't "fix" that; it's the
  established behavior and correct for grids nested in shells/cards.
- `GridItem.span` gets the identical treatment (`--_span-sm` … chain on `grid-column`).
- `gap` stays a scalar `SpaceStep` — no report evidence it needs to be responsive; add later if
  asked (Simplicity First).
- **Do not add a `<Box>`** styling component. Prop-driven styling systems are what
  "Modern CSS only" exists to avoid; `style`/`className` passthrough plus tokens covers
  one-offs, and Phase 1 makes that path audit-clean.
- Stack (flex) direction and `Columns.count` responsiveness: same pattern applies, but treat as
  a follow-up unless trivial after Grid lands — Grid + GridItem cover the reported dashboard
  cases (Stack already wraps, and AppShell/DashboardLayout own the shell breakpoints).

**Meta/registry:** update `grid.meta.ts` prop types/descriptions and an example using the
responsive object; `pnpm regen` re-embeds it in `registry.json`. The schema generator's
`classifyPropType` will classify the union as complex/unconstrained — acceptable (bound only by
docs/examples), no generator change needed.

**Tests** (`grid.test.tsx`): scalar renders exactly today's custom properties and no
`data-responsive`; object form sets the tier properties it declares and omits the rest;
`GridItem` span object sets the span chain. CSS assertions stay out of jsdom — the module is
static.

**Verify.**

```sh
pnpm exec vp run @cascivo/layouts#test
pnpm breakpoint:check     # 30/40/64/80rem literals only
pnpm layers:check && pnpm unlayered:check
pnpm regen && pnpm exec vp check --fix && git diff --exit-code
pnpm ready
```

---

## Phase 3 — Make the layout primitives reachable: npm export, the Stack collision, discovery

**Severity: the reason gap #1 was experienced at all.** The primitives exist but a user of
`@cascivo/react` (the report's agent, evidently) cannot import them, and the one name they'd
try — `Stack` — is a different component.

### 3a. Resolve the `Stack` naming collision → `Flex`

Rename the **layouts** flex Stack to **`Flex`** (`packages/layouts/src/stack/` →
`packages/layouts/src/flex/`, component `Flex`, registry id `layout/flex`). Rationale: the
npm-published card-pile `Stack` (`packages/components/src/stack/`) is the older shipped API and
renaming it is a breaking change for npm consumers; the layouts Stack is copy-paste-only so its
rename is cheap. `Flex` is also exactly the name the report (and every agent's prior) expects
for a flex container. Keep `direction`/`gap`/`align`/`justify`/`wrap` props as-is. Update all
internal consumers (`packages/layouts/src/sections/*`, blocks) and the registry alias so
`cascivo add layout/stack` prints a pointer to `layout/flex` (follow whatever rename precedent
`packages/cli/src/commands/add.ts` has; if none, a simple "renamed to" error message is enough).

### 3b. Export the primitives from `@cascivo/react`

Add to `packages/react/src/index.ts` (same relative-source pattern as the existing
`../../components/src/*` lines):

```ts
// layout primitives (see docs/plans/layout-state-audit-vendor-plan.md)
export * from '../../layouts/src/grid/grid'       // Grid, GridItem
export * from '../../layouts/src/flex/flex'       // Flex (the flex Stack, renamed)
export * from '../../layouts/src/columns/columns'
export * from '../../layouts/src/center/center'
export * from '../../layouts/src/spacer/spacer'
export * from '../../layouts/src/auto-grid/auto-grid'
```

Leave `SplitView`/`Masonry`/sections copy-paste-only (they carry heavier behavior/CSS; add on
demand). Points of care:

- `packages/react` must gain a workspace devDependency on `@cascivo/layouts` if imports resolve
  through the package name; with relative paths (the existing pattern) just verify
  `vp run @cascivo/react#build` bundles the layouts `.module.css` files through the
  `cascivo:css-import-edges` plugin (`packages/react/vite.config.ts:39-109`) like the
  components' ones.
- Follow CLAUDE.md's "Workspace package aliases" checklist if any app that builds without a
  prior full build imports the new exports.
- Registry entries for these primitives should note npm availability the same way
  `AppShell (@cascivo/react)` does today.

### 3c. Fix the discovery surfaces that steer agents away

- `docs/RECIPE-DASHBOARD.md`, "Project-card grid" row: replace "Lay the grid out with CSS
  grid/flex directly…" with a pointer to `layout/grid` / `layout/auto-grid` (responsive object
  syntax example), and add a `Grid`/`AutoGrid`/`Flex` row to the component map table.
- `docs/AI-RULES.md` + `skills/cascivo-design-page/SKILL.md`: one short "layout primitives"
  paragraph — use `Grid`/`Flex`/`AutoGrid` for page structure before writing custom layout CSS.
- `pnpm llms:generate` / `readme:generate` propagate the rest.

**Verify.**

```sh
pnpm exec vp run @cascivo/react#build @cascivo/layouts#test
pnpm regen && pnpm exec vp check --fix && git diff --exit-code
pnpm ready
```

---

## Phase 4 — Declarative state in `@cascivo/render`: the `$state` channel

**Severity: real gap, greenfield.** Today interactivity requires the host to hand-write `data`/
`actions` React props — the exact boilerplate the report says agents can't reliably produce.
This phase adds view-local state that lives **in the JSON**, keeping the package's load-bearing
constraint: *the config stays fully serializable; no functions in JSON*.

### Syntax — extend the existing `$`-ref family, not the report's `$.state.*`

The engine already has `$data.<path>`, `$actions.<name>`, `{ $t }`. Add the sibling `$state`,
not a new `$.`-prefixed grammar (one convention, existing validators/codegen extend naturally):

```json
{
  "state": { "searchQuery": "", "activeTab": "overview", "envVarsVisible": false },
  "view": {
    "regions": {
      "toolbar": [
        {
          "component": "Input",
          "props": { "placeholder": "Search projects..." },
          "bind": { "value": "$state.searchQuery" },
          "events": { "onChange": "$state.set.searchQuery" }
        },
        {
          "component": "Toggle",
          "bind": { "pressed": "$state.envVarsVisible" },
          "events": { "onPressedChange": "$state.toggle.envVarsVisible" }
        }
      ]
    }
  }
}
```

### Semantics

- **`ViewConfig.state`** (`packages/render/src/types.ts`): optional
  `Record<string, string | number | boolean | null>` of initial values. Primitives only — keeps
  validation and codegen trivial; complex data still belongs to the host `data` prop.
- **Reads:** `bind` values may be `$state.<key>` in addition to `$data.<path>`
  (`type StateRef = `$state.${string}``). Resolved to the signal's current value in
  `renderNode` next to the existing `$data` branch (`cascade-view.tsx:74-79`).
- **Writes:** `events` values may be, in addition to `$actions.<name>`:
  - `$state.set.<key>` — handler `(arg) => sig.value = coerce(arg)`, where `coerce` unwraps a
    DOM event (`arg?.target` present → `target.checked` for checkbox/radio inputs, else
    `target.value`) and passes plain values through. Check the actual callback conventions of
    `Input`/`Select`/`Toggle`/`Tabs` in `@cascivo/react` while implementing and note them in
    the README — some components emit the value directly, which `coerce` passes through
    untouched.
  - `$state.toggle.<key>` — boolean flip.
- **Reactivity:** build one `Map<string, Signal>` from `config.state` (`signal()` from
  `@cascivo/core`, which `cascade-view.tsx` already imports for `isSignal`). `CascadeView`
  already calls `useSignals()`, so reads during render subscribe automatically. Create the map
  keyed on the resolved config object's identity (lazy `useRef` cache); document that swapping
  the config (including via the `Signal<ViewConfig>` channel) resets state.
- **Precedence** stays: static props < `bind` < `events` (existing merge order in `renderNode`).

### Validation, schema, MCP, codegen — all four surfaces move in lockstep

1. **`packages/render/src/validate.ts`:** `$state.<key>` in `bind` and `$state.set.<key>` /
   `$state.toggle.<key>` in `events` must reference a key declared in `config.state`
   (error with did-you-mean via the existing `closestName`); `toggle` additionally requires the
   initial value to be boolean; `state` values must be primitives. Bound-prop conformance
   skipping stays as-is.
2. **JSON Schema (`scripts/schema/generate.ts` → `packages/render/schema/view.v1.json`):** add
   the `state` property; widen `bind` pattern to `^\$(data|state)\.` and `events` to
   `^\$(actions\.|state\.(set|toggle)\.)`. Regenerate via `pnpm regen`.
3. **MCP (`packages/mcp/src/validate.ts`, `prompt.ts`):** mirror the ref checks in the inlined
   validator and document `$state` in the `get_view_grammar` grammar/rules so agents are taught
   the syntax at generation time.
4. **CLI graduation (`packages/cli/src/commands/generate.ts`):** `state` keys →
   `const <key> = useSignal(<initial>)` declarations (import from `@cascivo/core`);
   `$state.<key>` binds → `{<key>.value}`; `$state.set.<key>` → an inline arrow with the same
   `coerce` unwrapping; `$state.toggle.<key>` → `() => (<key>.value = !<key>.value)`. The
   generated TSX must satisfy the component-authoring rules (signals, no `useState`).

### Housekeeping in the same phase (small, adjacent)

- **Add the Phase 3 layout primitives to `component-map.ts`** (`Grid`, `GridItem`, `Flex`,
  `Columns`, `Center`, `Spacer`, `AutoGrid`) so schema-driven dashboards can finally express
  structure. While there: the file's header comment claims it is generated by
  `scripts/schema/generate.ts`, but no script emits it — it is hand-maintained. Fix the header
  to say so (don't build a generator for it in this phase).
- **`ViewConfig.view.layout`** (`types.ts:35`) is declared but never read by the renderer —
  regions render as flat `div`s. Remove the dead field from the type, schema, and docs (it is
  optional, unvalidated, and ignored, so removal breaks nothing that works today). If the
  maintainer prefers to keep it for a future region-slotting feature, leave the type but add a
  `// not yet implemented` doc comment and a validator warning — decide via open question 3.

**Tests** (conventions of `cascade-view.test.tsx` / `validate.test.ts`): initial state renders
into a bound prop; firing the bound `onChange` (via `@testing-library` `fireEvent`/`userEvent`)
updates the signal and re-renders the bound Input value (two-way loop closed); `toggle` flips;
unknown state key → validation error with suggestion; `toggle` on a string key → error;
`validate.conformance.test.ts` untouched; `schema.test.ts` asserts the new `state` def; a CLI
`generate.test.ts` case asserting the emitted `useSignal` TSX compiles shape-wise.

**Verify.**

```sh
pnpm exec vp run @cascivo/render#test @cascivo/mcp#test cascivo#test
pnpm regen && pnpm exec vp check --fix && git diff --exit-code   # schema + prop-schemas drift
pnpm ready
```

---

## Phase 5 — `@cascivo/vite-plugin`: layering JS-imported vendor CSS

**Severity: real gap, deliberately narrow.** The native `layer(vendor)` recipe stays the
primary, documented path — it needs no tooling and `cascivo create` already scaffolds the layer
statement. What native CSS *cannot* do is layer a stylesheet imported from JavaScript
(`import 'chart-lib/styles.css'`), which is how most JS libraries ship — the exact case the
report hit. This phase reverses the repo's "no build plugin" stance (see
`docs/plans/ai-first-layer-discipline-plan.md` Phase 3) **only** for that case; get maintainer
sign-off first (open question 4).

### Package

New `packages/vite-plugin` → npm `@cascivo/vite-plugin`. Model `package.json` on
`packages/mcp` (node-targeted: `"type": "module"`, `vp pack` build emitting
`dist/index.mjs`/`.d.mts`, single `.` export, `files: ["dist"]`, `publishConfig` with
provenance, catalog deps). No runtime dependencies; `vite`/`vite-plus` as a peer/dev dep for
the `Plugin` type only.

### API and behavior

```ts
// vite.config.ts
import { cascivoLayers } from '@cascivo/vite-plugin'

export default defineConfig({
  plugins: [
    cascivoLayers({
      imports: {
        'chart-widget/dist/styles.css': 'vendor', // suffix-matched against the resolved id
        'other-lib/theme.css': 'vendor',
      },
    }),
  ],
})
```

A `transform` hook with `enforce: 'pre'`, applying only to ids that end in `.css`, live under
`node_modules`, and suffix-match a configured key:

1. Hoist any top-level `@charset` and `@import`/`@use` statements (an `@layer` block may not
   contain `@import` per spec) and rewrite each `@import …;` to `@import … layer(<name>);`.
2. Wrap the remaining source in `@layer <name> { … }`.

The plugin does **not** inject a layer-order statement — the app's CSS must declare `vendor`
first (the scaffold from `cascivo create` already does; the README shows the two-line statement
from `docs/THIRD-PARTY-CSS.md:30-35` for existing apps). The existing `cascivo:css-import-edges`
plugin in `packages/react/vite.config.ts:39-109` is the in-repo precedent for build-time layer
manipulation; `packages/cli/src/utils/css-layers.ts` already parses `@import … layer(…)` and is
reusable for tests.

### Scope fences (state these in the README)

- Vite only. A Next.js/webpack loader is a follow-up, not this phase (the repo and all its apps
  are Vite; don't build unexercised code).
- Cannot fix runtime-injected `<style>` tags or inline `style=""` attributes — same residual
  cases `docs/THIRD-PARTY-CSS.md:64-72` already documents.

### Documentation + audit wiring

- `docs/THIRD-PARTY-CSS.md`: keep the native recipe as the lead; replace the "move the import
  into a CSS file" workaround in the JS-import caveat section with both options (manual
  `vendor.css` **or** `@cascivo/vite-plugin`), and fix the existing drift at line 42 — the
  scaffold's `vendor` slot is active, not "commented".
- `packages/cli/src/audit-ai/vendor-css.ts:21-24`: extend the `vendor-css-import` finding
  message to mention the plugin as the fix for JS imports.
- `cascivo create` scaffold's AGENTS.md text (`create.ts:356-378`) + `docs/AI-RULES.md` +
  regenerated llms surfaces mention the plugin in one line.

**Tests:** colocated Vitest unit tests on the transform function (pure string-in/string-out):
wraps plain rules; hoists and rewrites `@import`; leaves non-matching ids untouched; respects a
custom layer name. Follow `packages/cli` test conventions.

**Verify.**

```sh
pnpm exec vp run @cascivo/vite-plugin#build @cascivo/vite-plugin#test
pnpm ready:ci    # new workspace package — catch build-ordering/alias issues cold
```

---

## Open questions for the maintainer

1. **`Flex` rename (Phase 3a):** rename the copy-paste layouts `Stack` → `Flex` (recommended,
   non-breaking for npm) vs. renaming the npm card-pile `Stack` out of the way (breaking). If
   neither: export the flex Stack under the alias `Flex` only in `@cascivo/react` and accept
   the registry/npm name divergence.
2. **npm export set (Phase 3b):** confirm `Grid/GridItem/Flex/Columns/Center/Spacer/AutoGrid`
   as the published set; `SplitView`/`Masonry` stay copy-paste-only.
3. **`view.layout` (Phase 4):** remove the dead field (recommended) or keep it reserved with a
   "not implemented" warning.
4. **Build-plugin stance (Phase 5):** `docs/plans/ai-first-layer-discipline-plan.md` chose
   "native CSS, no build plugin". This plan narrows that to "…except JS-imported CSS, which
   native CSS cannot layer". Confirm before creating the package.
5. **Suppression directive spelling (Phase 1c):** `cascivo-audit: allow <rule>` proposed;
   confirm or bikeshed once — it becomes a public contract for agents.

## Suggested sequencing

1. **Phase 1** (audit loop) — independent, smallest, unblocks every agent run. First.
2. **Phase 2** (responsive Grid) — independent of Phase 1.
3. **Phase 3** (npm export + Flex + discovery) — builds on Phase 2's final Grid API; answer
   open questions 1–2 first.
4. **Phase 4** (`$state`) — core is independent; the component-map addition depends on
   Phase 3. Answer open question 3 first.
5. **Phase 5** (vite plugin) — independent; gated on open question 4.

Every phase ends on a green `pnpm ready` (Phase 5 on `pnpm ready:ci` once, for the new
workspace package). Commit whatever `pnpm regen` / `vp check --fix` modify alongside each
phase.
