# Fix plan: the 2026-08-21 "Vercel-like dashboard on Vite + React Router" experience report

**Status: IMPLEMENTED, 2026-08-21.** All five phases shipped; `pnpm ready` is green, and
`pnpm ready:ci` (cold cache, sequential builds) was run for the packaging phase. The spec
below is kept **as written** because it is the root-cause record — a spec quietly rewritten
to match what happened stops being evidence of anything. Where implementation diverged, the
divergences are listed immediately below rather than edited into the workstreams.

All four open decisions in §4 were approved: the gradient default, the `Switch` alias export,
the ESLint plugin, and the sparkline budget (kept at 6 kB gzip; the subpath measures ~3.5 kB).

### Where implementation diverged from this spec

- **WS-1's "Group D"** — adding `ariaLabel` to the ~25 components with a *visible* `label` —
  **was not done, deliberately.** Those components extend `HTMLAttributes` and spread onto a
  real `<input>`/`<select>`, so they already accept the standard DOM `aria-label`: typed,
  familiar, and not something a camelCase second spelling makes more possible. Adding 25
  redundant props would have been surface without capability. The rule shipped is scoped to
  what a component *declares*, which is the line the source itself draws, and
  `aria-label-universality.test.ts` enforces exactly that.
- **WS-1's Group D dev warning** ("warn when both `label` and `ariaLabel` are set") was
  dropped with it, and would have been wrong anyway: WCAG 2.5.3 supports a short visible
  label with a longer accessible name (`label="Qty"`, `aria-label="Quantity in units"`), so
  the warning would have fired on a correct pattern.
- **WS-6's two-value-enum guard was written, run, and removed.** It flagged 19 boilerplate
  descriptions on first run ("Layout orientation of the component.", "Selects the visual
  style variant."). A guard needing 19 allowlist entries before it is green has been
  allowlisted into uselessness — the failure mode `dead-props.test.ts`'s own header warns
  about. Those descriptions are worth fixing; they are not this report's scope.
- **WS-9's `apps/examples/deploy` router step could not be done as specced**: no example app
  in the repo uses a router at all, so there was nothing to add a lazy index route to. The
  doc claim that depended on it was removed rather than left unbacked; the `claims.test.ts`
  guard (dated citations, no absolutes) shipped as specced and does the durable work.
- **WS-8 ships without a hover tooltip** on the subpath, the option §4.4 left open. The
  tooltip is what requires the engine, so keeping it would have defeated the entry. Stated on
  the entry, in the package README and in the recipe; a DOM-parity test asserts the drawn SVG
  is otherwise identical.
- **WS-8 needed two build changes the spec did not anticipate.** A second entry made Rolldown
  hoist shared code into its own chunk, which broke `css-import-edge`'s CSS-free `node/` twin
  (it copied only entry chunks, leaving `node/index.js` importing a path that resolved inside
  `node/` where nothing was written). The plugin now copies every chunk. `flatten-types.mjs`
  gained a per-entry loop.

### What the work turned up that the report could not see

- **The guard for report item 1 was asserting the opposite of the truth.**
  `vocabulary.test.ts`'s VISIBLE regex contained the substring `text label`, and `Switcher`
  and `CommandMenu` both describe their *invisible* accessible names as "Text label for the
  control." — so the guard certified as visible the exact two components the report tripped
  over. This is §0.1, written before the fix and confirmed by it.
- **`Histogram.label` was inert.** A required prop, documented as "rendered visibly beneath
  the axis", destructured as `_label` and never used. Found by the new `nameVisibility`
  classifier on its first run; it now renders as the x-axis title.
- **`DataTable` could not be given an accessible name at all** without rendering a visible
  caption — a real WCAG 1.3.1/4.1.2 gap. The report listed `DataTable` under `ariaLabel`,
  which was factually wrong in the other direction.

---

This document was written to be handed to an implementing agent as-is. Every finding is
root-caused against current source with `file:line` evidence, verified at commit `fbe4628b`,
and every workstream carries a design decision (with the rejected options), implementation
steps, an executable guard, and acceptance criteria.

**Source report:** an agent built an 8-route Vercel-style deploy console (~1,470 lines) on
`@cascivo/react@0.18.0` + `@cascivo/charts@0.18.0` + React Router 8.3, Path B (prebuilt).
`tsc`, `eslint` and `vite build` each passed on the **first** run; all 8 routes rendered with
zero runtime errors; **no workarounds were written**. The report contains no blockers.

---

## §0 — The finding under the findings

The report's most important paragraph is red flag 3, not any of the eleven numbered defects:

> The docs cite adopter friction reports as a design input, which is excellent, and also
> reveals how much of the API surface needed that correction. […] a _fresh_ adopter's success
> is currently load-bearing on the docs staying this good — the API itself still has the sharp
> edges. **The docs are doing work the API should eventually do itself.**

That is correct and it is the organising principle of this plan. Every doc warning in
`docs/AI-RULES.md` is a prose patch over a place where the type system, the export list, or a
runtime warning could have carried the same information to a reader who never fetched the
docs. The eleven numbered items are almost all instances of it.

So each workstream below is graded on **which layer the fix lands in**, cheapest-to-consume
first, and a fix is only allowed to stop at a lower row when the rows above are genuinely
impossible:

| Layer | Reaches an adopter who… | Example in this plan |
| --- | --- | --- |
| 1. **Type system** | never read anything; the compiler tells them | WS-1 (`ariaLabel` accepted everywhere), WS-2 (`Switch` export), WS-3 (`hint` alias) |
| 2. **Runtime dev warning** | wrote code that compiles but looks wrong | WS-7 (dual-axis area fills) |
| 3. **JSDoc on the prop** | hovers, or Ctrl-clicks into the `.d.ts` | WS-6 (`DataList.orientation`), WS-4 (`Text.muted`) |
| 4. **Manifest → every generated surface** | asked the MCP server / read `llms.txt` | WS-2 (component `aliases`), WS-13 |
| 5. **Hand-written guide prose** | read the guide for that exact task | WS-9, WS-10, WS-11, WS-12 |

The report proves the value of the guides — but a guide is layer 5. **Nothing in this plan may
be fixed only at layer 5 if layers 1–3 can carry it.**

### §0.1 — Why the existing guards did not catch item 1 (the recurrence root cause)

The user's framing is that these classes of defect "were already mentioned multiple times, and
it always was mentioned to be fixed." For the accessible-name inconsistency (report item 1)
that is literally true — `docs/AI-RULES.md:165-179` already states the rule and
`scripts/checks/vocabulary.test.ts:197` already claims to enforce it:

```
docs/AI-RULES.md:181  Enforced by `vocabulary.test.ts`: a `label` prop whose manifest
                      description states neither fails `pnpm meta:check`. Silence is the bug.
```

**The guard has a false-negative and the two worst offenders slip through it.**
`scripts/checks/vocabulary.test.ts:204` is:

```ts
const VISIBLE = /visible|beside|shown|displayed|rendered|text label|caption|above the/i
```

`Switcher`'s and `CommandMenu`'s manifests both say **"Text label for the control."**
(`packages/components/src/switcher/switcher.meta.ts:24`,
`packages/components/src/command-menu/command-menu.meta.ts:53`). The substring `text label`
matches `VISIBLE`, so the guard passes — while both props are in fact **invisible accessible
names** (`switcher.tsx:43` → `aria-label={label ?? …}`; `command-menu.tsx:465` →
`aria-label={resolvedLabel}`). The guard is asserting the opposite of the truth on the exact
two components the report tripped over.

This is the pattern to break, and it generalises: **a guard whose predicate is a keyword regex
over prose will eventually assert a lie.** WS-0 fixes this class, not just this instance.

---

## §1 — Findings ledger

Every item in the report, mapped. "Layer" is the §0 table.

| # | Report item | Verdict | Layer | WS | Priority |
| --- | --- | --- | --- | --- | --- |
| 1 | `label` vs `ariaLabel` inconsistent | **Confirmed + guard hole** | 1 | WS-0, WS-1 | P0 |
| 2 | `Text` uses `muted`, not `tone` | Confirmed, but `tone` would be **wrong** | 3 | WS-4 | P2 |
| 3 | No `Switch`; it is `Toggle` | Confirmed | 1 + 4 | WS-2 | P1 |
| 4 | `Field.description` vs `Input.hint` | Confirmed | 1 | WS-3 | P1 |
| 5 | `Switcher` does not look like a switcher | Confirmed (recipe wording) | 5 | WS-10 | P2 |
| 6 | `SideNav` `footer` not inset like `header` | **Confirmed CSS bug** | — | WS-5 | P0 |
| 7 | Dual-axis area fills overlap muddily | Confirmed | 2 | WS-7 | P1 |
| 8 | Single-series area fill too opaque | Confirmed (design decision) | 2/3 | WS-7 | P2 |
| 9 | `DataList orientation` reads ambiguously | Confirmed | 3 | WS-6 | P2 |
| 10 | Recipe's 500 kB warning is wrong | **Confirmed — doc states a falsehood** | 5 | WS-9 | P0 |
| 11 | React Router `HydrateFallback` noise | Confirmed (undocumented) | 5 | WS-11 | P2 |
| RF1 | Version spread reads pre-alpha | Confirmed (positioning) | 5 | WS-12 | P2 |
| RF2 | Everything is 0.x; mitigation not findable | Confirmed | 5 | WS-12 | P2 |
| RF3 | Docs do work the API should do | **The organising finding** | 1–4 | WS-13 | P1 |
| RF4 | No sparkline-only subpath | Confirmed | 1 | WS-8 | P1 |

**One report claim is factually wrong and must not be implemented as written.** Item 1's table
lists `DataTable` under `ariaLabel`. `DataTable` has **no** `ariaLabel` prop
(`packages/components/src/data-table/data-table.tsx` names its table via `title` +
`aria-labelledby`, line 492). The real defect there is the opposite one — a `DataTable` with no
visible `title` has **no accessible name at all**. Folded into WS-1 as WS-1c.

---

## WS-0 — Kill the guard class that asserts prose (P0, root cause of item 1)

### Finding

`scripts/checks/vocabulary.test.ts:197-220` decides whether a `label` prop is visible by
regex-matching the manifest's English description. It gets `Switcher` and `CommandMenu`
backwards (§0.1). Any fix to those manifests that keeps the regex leaves the next component
one adjective away from the same failure.

### Design decision

**Replace the prose predicate with a structured field, and derive the prose from it.** Add to
`PropMeta` in `packages/core/src/types.ts`:

```ts
/**
 * For a prop that carries an accessible name or a label: whether the string is
 * rendered on screen. Required on every prop named `label` / `ariaLabel`.
 * `'visible'` — rendered as text the user sees (and it becomes the accessible name).
 * `'invisible'` — goes to `aria-label` only; never painted.
 */
nameVisibility?: 'visible' | 'invisible'
```

- The guard asserts the **field**, not the sentence. No regex over prose survives.
- `pnpm regen` derives the sentence: every `label`/`ariaLabel` prop's rendered doc line gets a
  generated suffix — "Rendered on screen." / "Not rendered — screen readers only." — appended
  in `registry.json`, `llms/<name>.md`, `context/<name>.md`, and the site props table. The
  author can no longer write a description that contradicts behaviour, because the
  authoritative half is machine-written.
- Cross-check the field against source: a prop whose value flows into `aria-label={…}` **and**
  into no JSX text position is `invisible`; one that reaches a text position is `visible`. This
  is a mechanical AST check, not a heuristic — the two positions are syntactically distinct.

### Rejected

- *Tighten the regex* (drop `text label`). Fixes the instance, keeps the class. Rejected — this
  is exactly the "always mentioned to be fixed" loop the user called out.
- *Require the description to start with a fixed sentence.* Still prose, still spoofable, and
  makes descriptions read like boilerplate.

### Implementation

1. `packages/core/src/types.ts` — add `nameVisibility` to `PropMeta`.
2. `scripts/checks/vocabulary.test.ts` — replace the `VISIBLE`/`INVISIBLE` regex block
   (lines 197-220) with: every prop named `label` or `ariaLabel` on every manifest **must**
   declare `nameVisibility`; every `ariaLabel` must declare `'invisible'`.
3. New `scripts/checks/name-visibility-parity.test.ts` — AST-parse each component's TSX;
   assert the declared `nameVisibility` matches where the prop's value actually lands
   (`aria-label={…}` attribute vs. a JSX text child). Fails in both directions. Add to
   `pnpm meta:check`.
4. Backfill `nameVisibility` on all ~47 `label`/`ariaLabel` props (list in WS-1).
5. Fix `switcher.meta.ts:24` and `command-menu.meta.ts:53` to `nameVisibility: 'invisible'`
   and rewrite both descriptions ("Accessible name for the … landmark. Not rendered.").
6. `scripts/llms/generate.ts` — emit the derived sentence; `pnpm regen`; commit artifacts.

### Guard

`pnpm meta:check` (vocabulary + the new parity test). Both must fail on a deliberately
mis-declared prop — add that negative case to the test file itself.

### Acceptance

- `nameVisibility` present on 100% of `label`/`ariaLabel` props.
- Flipping `Switcher`'s value to `'visible'` makes `pnpm meta:check` **fail**. (Prove it, then
  revert. A guard nobody has watched fail is a guard nobody has tested.)
- No regex over a `description` string remains anywhere in `vocabulary.test.ts`.

---

## WS-1 — One accessible-name spelling that is always correct (P0, report item 1)

### Finding

The catalogue splits three ways and the report paid a compile cycle on `OverflowMenu`:

| Group | Components | Today |
| --- | --- | --- |
| A — `ariaLabel` only | `breadcrumb`, `dock`, `filter`, `menu`, `menubar`, `navigation-menu`, `otp-input`, `overflow-menu`, `progress`, `radial-progress`, `side-nav`, `steps`, `structured-list`, `swap`, `tree-view`, `virtual-list`, `wheel-picker` | rejects `label` |
| B — invisible `label` only | `switcher`, `command-menu`, `spinner`, `fab`, `progress-circle`, `resizable`, `qr-code` | rejects `ariaLabel` |
| C — both | `icon-button` (`icon-button.tsx:33`), `sparkline` (`sparkline.tsx:37`) | XOR union |
| D — visible `label`, forwards raw `aria-label` | `toggle` (`toggle.tsx:21-26`), `input`, `checkbox`, `radio`, `slider`, `select`, … | rejects `ariaLabel` |

Group D is the trap `AI-RULES.md:190-203` documents (the 2026-08-14 `<Toggle label>` report).

### Design decision

**`ariaLabel` becomes universal and one-directional: it is accepted on every component that
has an accessible name, and it is _never_ visible. `label` keeps its per-component meaning.**

That single rule makes an agent's guess safe without erasing the visible/invisible distinction:
whenever the intent is "name it for a screen reader only", `ariaLabel` is correct on 100% of
the catalogue, with no lookup. This is layer 1 — the compiler now accepts the guess.

Concretely:

- **Group A** — additionally accept `label` as a plain alias (`aria-label={ariaLabel ?? label}`),
  `nameVisibility: 'invisible'` on both. Fixes the report's `<OverflowMenu label=…>` verbatim.
- **Group B** — additionally accept `ariaLabel`; keep `label`; neither deprecated (matches the
  precedent set for `IconButton`/`Sparkline` in `AI-RULES.md:171`).
- **Group C** — unchanged. Keep the XOR union: the name is **required** there, and the
  2026-08-02 plan (`docs/plans/adopter-experience-2026-08-plan.md`, WS-D5) already recorded
  that making both optional to add an alias drops the compile-time a11y guarantee. Do not
  repeat that mistake.
- **Group D** — add a **separate** `ariaLabel?: string` that maps to `aria-label`, alongside the
  visible `label`. They are different props with different jobs, not aliases. Dev-warn when both
  are set (the `aria-label` wins and silently overrides the visible text — that is always a bug).

### Rejected

- *Accept `label` everywhere as the report suggests.* On group D `label` is visible, so
  "accept both everywhere" cannot mean "both do the same thing" — it would re-create the
  2026-08-14 `<Toggle label>` footgun on every form control. The asymmetric rule (`ariaLabel`
  universal and never visible) is the version that is actually true everywhere.
- *Rename group A's prop to `label`.* Breaking, and loses the invisibility signal in the name.

### WS-1c — `DataTable` has no accessible name

`data-table.tsx:492` names the table via `aria-labelledby` → the `title` prop, which renders
visibly. A table with no `title` ships an unnamed `<table>` — a real WCAG 1.3.1/4.1.2 gap, not
a naming inconsistency. Add `ariaLabel?: string` (`nameVisibility: 'invisible'`), used when
`title` is absent; dev-warn when neither is present.

### Implementation

1. Group A (17 components): widen the props interface, `aria-label={ariaLabel ?? label ?? t(builtin.…)}`,
   manifest gains the `label` row with `nameVisibility: 'invisible'`.
2. Group B (7): add `ariaLabel`, resolution order `ariaLabel ?? label ?? builtin default`.
3. Group D: add `ariaLabel` + the both-set dev warning (reuse the shape of `field.tsx:30-36`,
   which already warns on a duplicated `label`).
4. WS-1c on `DataTable`.
5. `docs/AI-RULES.md` §"Accessible-name and item-identity props" — replace the current
   "two components predate the rule" paragraph with the universal rule, and add the
   **accessible-name row the report asked for** to the "Data and shape props" table.
6. `scripts/llms/generate.ts:1028` — add the same rule to the `llms.txt` vocabulary bullet.
7. `pnpm regen`.

### Guard

New `scripts/checks/aria-label-universality.test.ts` (in `pnpm meta:check`): every component
whose TSX contains an `aria-label={…}` attribute on its root **must** declare an `ariaLabel`
prop. Extends the existing rule at `vocabulary.test.ts:144` (which today only covers components
declaring the raw `'aria-label'` spelling) to cover components that hard-wire the attribute
from some other prop. Allowlist requires a written reason.

### Acceptance

- `<OverflowMenu label="…">`, `<SideNav label="…">`, `<Switcher ariaLabel="…">`,
  `<CommandMenu ariaLabel="…">`, `<Toggle ariaLabel="…">`, `<DataTable ariaLabel="…">` all
  type-check and produce the correct `aria-label` in the rendered DOM. One test each.
- `<Toggle label="X" ariaLabel="Y">` warns in dev.
- `pnpm ready` green; `props-parity` clean after regen.

---

## WS-2 — Foreign component names resolve (P1, report item 3)

### Finding

Every peer system (Radix, MUI, Chakra, shadcn, HeadlessUI) calls the toggle switch `Switch`.
cascivo calls it `Toggle` (`packages/components/src/toggle/toggle.tsx`), while `ToggleGroup` is
a different thing (a segmented control), and `Toggle`'s own JSDoc calls it "the switch"
(`toggle.tsx:21-24`). `Switch` is not exported from `packages/react/src/index.ts`. The report's
suggested fix names the precedent exactly: icons already ship a foreign-name map
(`packages/icons/svg/aliases.json`, 23 entries, surfaced as `aliases` in
`icons.catalog.json` and as `LayoutDashboard→Dashboard` in `llms.txt` via
`scripts/llms/generate.ts:515-529`). **Components have no equivalent.**

### Design decision

**Do both halves — the machine-readable map _and_ the export alias — because they reach
different readers.**

**(a) `packages/components/aliases.json`**, same shape and same generator treatment as the icon
file: `{ "toggle": ["Switch", "switch"], … }`, keyed by registry name. Feeds:
- `registry.json` (new `aliases` field on each entry, via `scripts/registry/`),
- `cascivo add switch` / `cascivo search switch` → resolve + print `Switch → Toggle`,
- MCP `search_components` (`packages/mcp/src/server.ts:151`) and `get_component`,
- the `llms.txt` naming-map line, next to the icon one.

Seed set (audit the full catalogue against Radix + MUI + shadcn + Chakra during
implementation; these are the ones a deploy console hits):

| Foreign name | cascivo |
| --- | --- |
| `Switch` | `Toggle` |
| `Dialog` | `Modal` |
| `Snackbar`, `ToastMessage` | `Toast` |
| `Chip` | `Tag` |
| `Menu` (Radix `DropdownMenu`) | `Dropdown` |
| `Skeleton` | `Skeleton` (confirm) / `InlineLoading` |
| `Popper` | `Popover` |
| `SegmentedControl` | `SegmentedControl` (confirm) / `ToggleGroup` |
| `Accordion.Item` | `Collapsible` |

**(b) A real `Switch` export.** `export { Toggle as Switch, type ToggleProps as SwitchProps }`
from `packages/react/src/index.ts` and from the component's `index.ts` — because a map at layer
4 still requires the adopter to *ask*, and `import { Switch }` is what they *write*. Mark it in
the manifest as an alias export, not a second component, so `meta-coverage` and
`export-collisions` stay honest and no second doc page is generated.

### Rejected

- *Rename `Toggle` → `Switch`.* Breaking across the whole catalogue, and `Toggle` is a
  defensible name. Rejected.
- *Map only, no export.* Loses the compile-time hit — layer 4 when layer 1 is available.
- *Export only, no map.* Fixes one name; the next agent guesses `Dialog`.

### Implementation

1. `packages/components/aliases.json` + a `_comment` header mirroring the icons file.
2. `packages/core/src/types.ts` — no schema change needed if the map stays a sidecar (preferred:
   one file to review, mirrors icons). Fold into `registry.json` at generation time.
3. `scripts/registry/` — emit `aliases` per entry.
4. `packages/cli` — `add`/`search`/`list` resolve aliases and print the mapping line.
5. `packages/mcp/src/registry.ts` `searchComponents` — match aliases; `get_component` accepts
   an alias and echoes the canonical name.
6. `scripts/llms/generate.ts` — component naming-map line beside the icon one (~line 515).
7. `packages/react/src/index.ts` + `packages/components/src/toggle/index.ts` — the `Switch`
   alias export, with a JSDoc stating it is the same component.
8. `docs/MIGRATING-FROM-SHADCN.md` + `docs/AI-RULES.md` — link the map.

### Guard

New `scripts/checks/component-aliases.test.ts` in `pnpm meta:check`:
- every alias target resolves to a real registry entry (mirrors `deprecation-surfaces.test.ts`);
- no alias collides with a real component name or with another alias;
- every alias appears in `registry.json` after `pnpm regen` (drift);
- `export-collisions.test.ts` still passes with the `Switch` export.

### Acceptance

`import { Switch } from '@cascivo/react'` compiles and renders a toggle switch.
`npx cascivo add switch` installs `toggle` and says so. MCP `search_components("switch")`
returns `toggle` first. `llms.txt` contains `Switch→Toggle`.

---

## WS-3 — Supporting text under a control: one word (P1, report item 4)

### Finding

`Input.hint` (`input.tsx:17`, rendered at `:69-71`, wired via `aria-describedby` at `:53`) and
`Field.description` (`field.tsx:41`, rendered at `:113-115`) render the same thing in the same
place under the same kind of control. `hint` is on 8 components (`input`, `textarea`, `select`,
`number-input`, `combobox`, `date-picker`, `time-picker`, `file-uploader`); `description` is on
`Field` plus the feedback components (`Alert`, `Notification`, `EmptyState`), where
`AI-RULES.md`'s data-props table already reserves it for "body text of a feedback component".

`Field` is therefore the single outlier: a form component using the feedback word.

### Design decision

**The rule is: `hint` on a form control, `description` on a feedback component. `Field` accepts
`hint` as an alias of `description` and neither is deprecated.**

Aliasing rather than renaming, because `Field.description` is public API in 0.18 and the
`Alert`/`Notification` meaning of `description` is correct and must not move.

Also add the sibling dev warning to `Field`, mirroring the `label` one that already exists at
`field.tsx:30-36`: when a `Field` sets `description`/`hint` **and** its child control also sets
`hint`, two describedby texts render for one control. Today that is silent.

### Rejected

- *Rename `Field.description` → `hint`.* Breaking; and `Field` legitimately reads as both.
- *Add `description` to the 8 form controls too.* Doubles the surface in the wrong direction —
  it makes the ambiguity permanent instead of resolving it.

### Implementation

1. `field.tsx` — `hint?: ReactNode` alias; resolution `description ?? hint`; manifest row;
   JSDoc on both naming the other.
2. `field.tsx` — duplicate-supporting-text dev warning (reuse `warnDuplicateLabel`'s shape).
3. `docs/AI-RULES.md` "Data and shape props" table — add the row:
   *Supporting text under a **form control** → `hint`; body text of a **feedback** component →
   `description`.*
4. `scripts/llms/generate.ts:1028` — same sentence in the `llms.txt` vocabulary bullet.
5. `pnpm regen`.

### Guard

Extend `scripts/checks/vocabulary.test.ts`: no component in category `inputs` may declare
`description` without also declaring `hint`; no component in `feedback` may declare `hint`.
Allowlist entries require a reason string.

### Acceptance

`<Field hint="…">` compiles and renders identically to `<Field description="…">`.
`<Field hint="a"><Input hint="b" /></Field>` warns in dev. `pnpm ready` green.

---

## WS-4 — `Text.muted` vs `tone` (P2, report item 2)

### Finding

The report wrote `<Text tone="subtle">` three times. `Text` takes `muted?: boolean`
(`text.tsx:21`). `tone` is established elsewhere — `SideNavTone` (`side-nav.tsx:17`),
`Timeline.tone`, `ToneInput` on `Status`/`Badge`.

### Design decision — **do not add `tone` to `Text`**, and say why in the docs.

This is the one report suggestion that must be declined on the merits. `Tone` in this system is
a **severity** vocabulary (`neutral | info | success | warning | danger`, `@cascivo/core`), and
`AI-RULES.md:288-296` makes it canonical catalogue-wide with a guard
(`vocabulary.test.ts` fails a component that models severity with a private union). `Text`'s
`muted` is **emphasis**, not severity. Adding `tone="subtle"` to `Text` would put a third
meaning on the catalogue's most load-bearing word and break the one vocabulary that currently
holds.

So this is a genuine layer-3 fix, and it is allowed to stop there **only because layers 1–2 are
unavailable**: TypeScript cannot attach a custom message to an unknown-prop error, and a
runtime warning for an unknown prop would fire on every legitimate DOM passthrough.

*(Optional layer-1 escalation exists — see WS-13's lint rule. If WS-13 ships, `<Text tone>`
becomes a lint error with the right suggestion. That is the real fix; this WS is the floor.)*

### Implementation

1. `text.tsx:16-21` — expand the JSDoc: *"`Text` has no `tone` prop, by design: `tone` is the
   catalogue's **severity** vocabulary (`Status`, `Badge`, `Timeline`, `SideNav`). Text
   **emphasis** is `muted`. For coloured text conveying severity, use `Status` or wrap in a
   `Badge`."* This is what a Ctrl-click lands on.
2. Same sentence in `text.meta.ts:34`'s description → flows to `registry.json`, `llms/text.md`,
   the site props table by regen.
3. `docs/AI-RULES.md` — add a **"near-miss prop names"** table (new, and the home for WS-6's
   entry too):

   | You probably wrote | The prop is | On |
   | --- | --- | --- |
   | `tone="subtle"` | `muted` (boolean) | `Text` |
   | `hint` | `description` (both accepted after WS-3) | `Field` |
   | `label` | `ariaLabel` (both accepted after WS-1) | `OverflowMenu`, `SideNav`, `Steps`, `Breadcrumb` |
   | `Switch` | `Toggle` (both work after WS-2) | — |
   | `gap="4"` | `gap={4}` | every layout |
   | `orientation="vertical"` meaning "stack the items" | it stacks the **value under its label** | `DataList` |

4. `scripts/llms/generate.ts` — emit that table into `llms.txt` (it is the single highest-value
   block for a cold agent; keep it dense, one line per row).

### Guard

`scripts/checks/doc-api-drift.test.ts` (exists) extended: every "the prop is" cell in the
near-miss table must name a prop that exists on the named component, and every "you probably
wrote" cell must name one that does **not**. A table that rots is worse than no table.

### Acceptance

Hovering `Text` in an editor explains the absence of `tone`. The near-miss table appears in
`llms.txt`, `AI-RULES.md`, and `@cascivo/docs`. The drift guard fails when a row goes stale.

---

## WS-5 — `SideNav` `footer` is not inset like `header` (P0, report item 6 — real bug)

### Finding

Confirmed in source. `packages/components/src/side-nav/side-nav.module.css`:

```css
282  .header {
283    padding-block: var(--cascivo-space-2);
284    padding-inline: var(--cascivo-space-2);   ← inset
...
289  .footer {
290    padding-block: var(--cascivo-space-2);
291    /* no padding-inline */                    ← flush against the edge
```

`.customItem` (`:296-299`) — the documented escape hatch, commented *"provides the item's
padding/alignment context"* — has both. So `.footer` is the only slot missing it, and the
asymmetry is unintentional: `header`'s prop doc says *"rendered above the items, inside the
item padding context"* (`side-nav.tsx:152`) while `footer`'s says only *"content rendered above
the collapse toggle"* (`:153`). Rendered at `:423` and `:601`.

Not covered by any test: `apps/examples/deploy` does not use the `footer` slot, so no visual
baseline contains it.

### Design decision

**Fix the CSS.** `footer` gets `padding-inline: var(--cascivo-space-2)` — the same one line
`header` and `customItem` already carry. This is a bug fix, not an API change: no adopter can
have depended on a footer sitting flush against the rail while every sibling is inset.

### Implementation

1. `side-nav.module.css:289` — add `padding-inline: var(--cascivo-space-2);`.
2. `side-nav.tsx:153` — align the JSDoc with `header`'s wording ("…inside the item padding
   context").
3. `side-nav.meta.ts` — same for both prop descriptions.
4. `apps/examples/deploy` — add a `footer` to its `SideNav` ("Hobby plan · fra1", exactly the
   report's content) so the composition is exercised by the example app and lands in the
   visual baselines.
5. Refresh the three theme baselines (`pnpm visual:baselines:check` names them).

### Guard

`scripts/checks/computed-style.test.ts` — the correct home: this is a computed-style fact in a
real browser, invisible to jsdom, which is exactly that file's stated purpose (see its header
comment, lines 1-22). Add: render `SideNav` with `header`, `items` and `footer` against the
**shipped** `dist/` CSS; assert the resolved `padding-inline-start` of `[class*="footer"]`
equals that of `[class*="header"]` **and** that both equal the nav item's inline inset.
Asserting equality with the header, not a literal, means a future token change cannot
re-open the asymmetry.

### Acceptance

`pnpm computed:check` fails on current `main` and passes after the CSS change (verify in that
order). `pnpm visual:baselines:check` green with regenerated baselines.

---

## WS-6 — `DataList orientation` says what it does (P2, report item 9)

### Finding

`orientation="vertical"` stacks the **value under its label**; items are stacked vertically in
both modes. Prop doc is `"Layout orientation of the component."` (`data-list.tsx:13`,
`data-list.meta.ts:20`) — which is the ambiguity, stated.

### Design decision

**Document precisely; do not rename.** `orientation` on a `<dl>` is conventional, a rename is
breaking, and the confusion is entirely removable with an accurate sentence — this is a
prop-doc defect, not an API defect. (`AI-RULES.md`'s own naming rules do not cover
"orientation", and inventing a rule for one component is worse than a good sentence.)

### Implementation

1. `data-list.tsx:12-19` JSDoc → *"Where the **value** sits relative to its label.
   `'horizontal'` (default) puts the value beside the label; `'vertical'` puts it underneath.
   Items are always stacked vertically — this does not change the list's own axis. With ~6+
   items, `'vertical'` produces a tall block; prefer `'horizontal'` in a summary card."*
2. `data-list.meta.ts:20` — same, so it reaches `registry.json` / `llms/data-list.md` / the site.
3. Add an example to the manifest showing both, side by side.
4. Row in WS-4's near-miss table.

### Guard

Covered by WS-0's parity work only in spirit; add a narrow rule to
`scripts/checks/manifest-completeness.test.ts`: a prop typed as a two-member string union whose
description is under 60 characters and does not name **both** members fails. Ambiguity here is
almost always a description that names neither value. Allowlist with reasons.

### Acceptance

Both surfaces carry the precise sentence; `pnpm meta:check` green.

---

## WS-7 — Chart area fills (P1/P2, report items 7 + 8)

### Finding — item 7 (dual axis)

`solidFillStyle()` (`area-chart.tsx:44-47`) drops overlapping fills to
`--cascivo-chart-fill-opacity-overlap` (light `0.125`, dark `0.2` —
`packages/themes/src/dark.css:135`). Two areas at 0.2 over a dark surface still composite to a
visible third colour where they cross — which is what the report saw. The existing dev warning
(`packages/charts/src/core/dev-warn.ts:55-73`) solves the *scaling* problem and stops there, by
design; it names `axis: 'right'` + `secondAxis` and says nothing about what to draw.

Dual-axis comparisons are conventionally **line over area**, not area over area. `AreaChart`
already supports it per series: `type?: 'area' | 'line'` (`area-chart.tsx:79`) — and
`solidFillStyle` already excludes `type: 'line'` series from the overlap count
(`:307`), so the remaining area keeps full opacity. **The library already has the right answer
and never tells anyone.**

### Finding — item 8 (single series)

A lone area uses `--cascivo-chart-fill-opacity` (light `0.25`, dark `0.4`). `fill?: FillKind`
supports `'gradient'` (`area-chart.tsx:127-133`) and defaults to `'solid'` (`:236`).

### Design decisions

**7 → extend the warning (layer 2), do not auto-change the rendering.** Add
`warnDualAxisAreas(chart, …)` to `dev-warn.ts`, fired when `hasRight` (`:301`) is true and 2+
series would paint a fill. Follow the house style the report singled out as exemplary — name
the series, the consequence, and the exact fix:

> `[cascivo charts] AreaChart: "Requests" and "Errors" are on different axes but both paint an
> area fill, so they composite to a third colour where they cross. Dual-axis comparisons read
> as line-over-area: set `type: 'line'` on "Errors" (the secondary series), or split it into a
> second chart.`

Silently lowering opacity would change every existing dual-axis chart's appearance on a patch
release and still leave two washed-out fills — the composition is the problem, not the alpha.

**8 → an explicit decision for the maintainer; recommendation: change the default to
`'gradient'` for the single-series case only.** A gradient from the theme's fill opacity at the
curve to transparent at the baseline is the console-dashboard convention the report describes,
costs nothing (the code path exists), and does not touch multi-series or stacked charts. It
**is** a visual change to every existing single-series `AreaChart`, so it needs sign-off and a
changeset note — see §Open decisions. If declined, the fallback is layer 3: document
`fill="gradient"` in the `AreaChart` manifest examples and in `RECIPE-DASHBOARD.md`'s chart
section, which is where a dashboard author is already reading.

### Implementation

1. `dev-warn.ts` — `warnDualAxisAreas`, same `warnOnce` dedupe + prod strip as its neighbours.
2. `area-chart.tsx` — call it where `hasRight` is computed (`:301`).
3. Test in `packages/charts/src/charts/area-chart/area-chart.test.tsx` (assert the message
   names both series and `type: 'line'`; use `__resetChartWarnings()` as
   `chart-chrome.test.tsx:321` does).
4. If item 8 is approved: default `fill` to `'gradient'` when `series.length === 1 && !stacked`;
   changeset; regenerate chart visual baselines; note in `docs/CHART-LIBRARIES.md`.
5. `docs/RECIPE-DASHBOARD.md` — a short "two metrics, two scales" block showing the
   line-over-area shape.

### Guard

`packages/charts` unit tests + `pnpm visual:baselines:check` for any default change.

### Acceptance

Reproducing the report's chart (requests + errors, `axis: 'right'`, `secondAxis`) emits the new
warning; applying `type: 'line'` silences it and renders a line over a full-opacity area.

---

## WS-8 — `@cascivo/charts/sparkline` subpath (P1, red flag 4)

### Finding

`packages/charts/package.json` exports exactly `.`, `./styles.css`, `./package.json`. So
`import { Sparkline }` pulls the whole engine — 44.87 kB / 14.84 kB gzip as measured by the
report. `docs/RECIPE-DASHBOARD.md:113` states this as permanent (*"There is no third option
today"*), which then forces the false dichotomy WS-9 has to undo.

Root cause is `ChartFrame` (`packages/charts/src/core/chart-frame.tsx:1-14`), which imports
`voronoi`, `canvas-layer`, `zoom`, `Toolbox`, `export` (SVG/PNG serialisation), `ChartTooltip`
and `nearest`. `Sparkline` (`sparkline.tsx:65-72`) uses `ChartFrame` in `plain` mode and needs
exactly two of those things: a tooltip model and `nearest`. It draws with `linearScale` +
`linePath` and nothing else.

### Design decision

**Add a `./sparkline` subpath backed by a minimal frame.** Extract `MiniFrame` — sizing +
`title` + the sr-only data-table fallback (`chart-frame.tsx:16-30`, which must be preserved:
that inline `SR_ONLY` style is what stops a raw x/y table rendering visibly for consumers who
skip `styles.css`) + a `nearest`-based tooltip. No voronoi, no canvas, no zoom, no toolbox, no
export.

Non-negotiable constraints:
- `import { Sparkline } from '@cascivo/charts'` keeps working and keeps **identical behaviour**
  (same DOM, same tooltip, same a11y fallback). The root entry may re-export the light one only
  if a DOM-equality test proves parity; otherwise the two coexist and the root keeps the
  `ChartFrame` version.
- Target budget: **≤ 6 kB gzip** for `@cascivo/charts/sparkline`. Measure and record.

### Implementation

1. `packages/charts/src/core/mini-frame.tsx` + `packages/charts/src/sparkline.ts` entry.
2. `package.json` exports — `./sparkline` with `types`/`node`/`import`/`default`, mirroring `.`.
   **Then run the subpath sweep CLAUDE.md mandates**: an alias-map prefix collision means
   `'@cascivo/charts/sparkline'` must be listed **above** `'@cascivo/charts'` in every vite
   alias map that carries the package (`apps/site`, `apps/storybook`, and any
   `apps/examples/*` aliasing charts), and every consumer's `rollupOptions.external` for
   charts must become subpath-aware: `/^@cascivo\/charts($|\/)/`.
3. CSS: the subpath must ship its own CSS edge or document that it needs none —
   `pnpm css-contract:check` decides which.
4. Record the measured gzip size in `docs/BENCHMARKS.md`.

### Guard

- `pnpm pkg-exports` / `pnpm meta:check` (`pkg-exports` requires `./package.json` — unaffected,
  but re-run).
- `pnpm css-contract:check`, `pnpm isolated:check` (subpath resolves under a strict,
  non-hoisted install with `skipLibCheck` off), `pnpm ready:ci` (cold cache — this is exactly
  the build-ordering class that CLAUDE.md warns the subpath sweep exists for).
- New `scripts/checks/sparkline-subpath-size.test.ts`: build, measure the `./sparkline` entry's
  gzip transitive size, fail over the budget. A subpath that silently regains the engine is
  worse than no subpath.
- A DOM-parity test: root `Sparkline` and subpath `Sparkline` render identical markup for the
  same props.

### Acceptance

`import { Sparkline } from '@cascivo/charts/sparkline'` in a fresh Vite app produces a bundle
with **zero** references to the chart engine's zoom/toolbox/export/voronoi modules (grep the
built output, as the report did). Budget met and recorded.

---

## WS-9 — The recipe's bundle warning states a falsehood (P0, report item 10)

### Finding

`docs/RECIPE-DASHBOARD.md:94-113` tells the adopter to pick between a ~525 kB entry chunk and a
chart-free landing page, and closes with:

> There is no third option today: `@cascivo/charts` has no sparkline-only subpath, so importing
> `Sparkline` imports the engine.

**The third option exists and is the default shape of every data router.** The report
route-split the **index** route too (`lazy: () => import('./routes/overview')`), which pushed
the engine into a shared chunk (44.87 kB / 14.84 kB gzip) and produced **413.07 kB entry /
133.25 kB gzip, no warning — with sparklines on the landing page.** Verified by grepping the
built bundles for engine references. The reporter pre-emptively set
`build.chunkSizeWarningLimit: 700` on the strength of this doc, then deleted it.

This is the most serious item in the report: a prominent boxed warning in a first-day guide
telling adopters to accept a worse outcome and to raise a warning threshold they never needed.
It is P0 because a wrong doc is worse than a missing one — it is trusted.

### Design decision

Rewrite the box around the measured numbers. Lead with the third option; keep the honest
statement of what `Sparkline` costs; after WS-8 lands, add the fourth (the subpath). Cite this
report the way the file already cites others, with the date and the measurement.

### Implementation

Replace `RECIPE-DASHBOARD.md:88-113` with, in order:

1. **Route-split every route, including the index one.** Show the React Router `lazy` shape for
   `path: '/'` explicitly — the omission is what caused the misdiagnosis, because splitting
   "the chart routes" reads as *not* including the landing page. Give the measured result:
   413.07 kB / 133.25 kB gzip, sparklines on the landing page, no warning (2026-08-21 report).
2. **Why the earlier report saw 524.70 kB**: their index route was eager, so `Sparkline` pulled
   the engine into the entry chunk. The engine is not the problem; an eager index route is.
   Keep this — it is a real and easy mistake.
3. **After WS-8**: `@cascivo/charts/sparkline` for a page that wants one sparkline and no engine.
4. **Only then**, as the last resort: `build.chunkSizeWarningLimit`. Currently it is presented
   as "the option most consoles should take", which is now wrong.
5. Delete "There is no third option today."
6. Cross-link the router guide's new code-splitting section (WS-11).

### Guard

`scripts/checks/claims.test.ts` is the existing home for "the docs assert a measurable fact"
and it must own this one: assert that `RECIPE-DASHBOARD.md` contains no
"no third option"-style absolute, and that every kB figure in the box is tagged with the
report date it came from. Additionally — the durable fix — add the index-route-split shape to
`apps/examples/deploy`'s router so the recommended shape is the one CI actually builds, and
record its entry-chunk size in `docs/BENCHMARKS.md`. A doc claim backed by a built example
cannot rot silently.

### Acceptance

The box recommends the measured-best option first. `apps/examples/deploy` builds with a lazy
index route and no chunk-size warning. `pnpm claims:check` green.

---

## WS-10 — The `Switcher` recipe row points the wrong way (P2, report item 5)

### Finding

`docs/RECIPE-DASHBOARD.md:23`:

| Project/workspace switcher (top-left) | `Switcher`, or `Dropdown` for a richer trigger | … | `Switcher` is a static nav list; use `Dropdown` if the trigger itself needs a button/avatar with a menu. |

`Switcher` (`switcher.tsx:38-66`) renders a flat `<nav>` of every entry, always visible. Vercel's
team switcher is a collapsed dropdown. The Notes column is correct — but the **row label**
("switcher") and the **component name** both point at the always-visible list, and the name is
what an agent pattern-matches on. The reporter used it and got a permanently expanded team list
in the sidebar.

### Design decision

**Reword the row; do not rename the component.** `Switcher` is accurate for what it is, and
after WS-2 the recipe is the right place to disambiguate. Lead with the more common shape.

### Implementation

1. Split the row in two:
   - *"Workspace/project switcher — collapsed trigger (the usual console shape)"* → **`Dropdown`**,
     with a one-line snippet showing an avatar + name trigger.
   - *"Workspace list — always visible in the sidebar"* → **`Switcher`**, note: renders every
     entry, permanently, at full height; budget the vertical space.
2. `switcher.meta.ts` `description` + `intent.whenNotToUse` — add *"Not a collapsed dropdown:
   every item is always visible. For a collapsed trigger use `Dropdown`."* This is layer 4, so
   it reaches the MCP/`llms.txt` reader who never opens the recipe.
3. `switcher.tsx` JSDoc — same sentence (layer 3).
4. `pnpm regen`.

### Guard

`scripts/checks/doc-surface.test.ts` / `intent-completeness.test.ts` (exists at
`packages/components/src/intent-completeness.test.ts`): assert `Switcher`'s `whenNotToUse`
names `Dropdown`. Narrow, but it is the fact that was missing.

### Acceptance

Recipe leads with `Dropdown` for the collapsed case. `get_component("switcher")` via MCP
returns the disambiguation without the recipe.

---

## WS-11 — `HydrateFallback` and route splitting in the router guide (P2, report item 11)

### Finding

React Router logs *"No HydrateFallback element provided to render during initial hydration"* on
every page load for `lazy` routes on a data router. It is React Router's warning, not cascivo's
— but cascivo's recipe is what told the adopter to use `lazy` routes, so cascivo owns the
follow-through. `HydrateFallback` appears **nowhere** in `docs/` (verified: zero matches).

### Design decision

Own it in `docs/USING-WITH-A-ROUTER.md` — the report calls that guide "the right document, in
the right place, and complete", so extending it costs the reader nothing. Code splitting is
currently absent from it entirely (zero matches for `lazy`), while `RECIPE-DASHBOARD.md`
recommends it: the advice and its consequences live in two different files.

### Implementation

Add a "Code splitting" section to `USING-WITH-A-ROUTER.md`, after the `setLinkComponent`
section:

1. The `lazy` route shape for React Router and TanStack Router, **including the index route**
   (the WS-9 fix, stated once and linked from both files).
2. The `HydrateFallback` warning verbatim, what causes it, that it is React Router's and
   harmless, and the two-line fix (`HydrateFallback` on the root route → a cascivo `Spinner` or
   `Skeleton`). Give the copy-paste snippet — the report copied `isActive` verbatim from this
   guide, so verbatim-copyable is the format that works here.
3. Cross-link from `RECIPE-DASHBOARD.md`'s bundle box.

### Guard

`scripts/checks/docs-links.test.ts` (relative links resolve) + `docs-imports.test.ts` (every
`@cascivo/*` import in the snippet resolves) — both existing, both will cover the new snippet
automatically once it is in the guide.

### Acceptance

Following the guide's snippet produces a console with no `HydrateFallback` warning.

---

## WS-12 — The 0.x / version-spread story (P2, red flags 1 + 2)

### Finding

An install list reading `@cascivo/react@0.18.0`, `@cascivo/themes@0.4.13`,
`@cascivo/icons@0.3.10`, `@cascivo/platform@0.0.4`, `cascivo@0.9.0` "reads as *half of this is
pre-alpha*. A procurement reviewer will ask." And: the mitigations exist
(`breaking-changes.json`, `cascivo doctor --drift`) but "the mitigation is only reachable if you
already know to look for it."

The facts are documented — `docs/GETTING-STARTED.md:249` explains independent versioning,
`docs/UPGRADING.md:28-43` documents `breaking-changes.json`, `packages/cli/src/commands/drift.ts`
exists. The gap is **placement**: the explanation is not where the number is first seen.

### Design decision

Put the answer next to the number, on every surface where the number appears first. No new
policy, no version realignment (lockstep versioning would be a real cost to fix a perception).

### Implementation

1. **`README.md` + `docs/GETTING-STARTED.md`** — a short "Versioning and stability" block
   immediately after the install command (not 249 lines in), covering: packages version
   independently via changesets; a low number means *fewer releases*, not *less finished*
   (`@cascivo/platform@0.0.4` is new, not immature — say which); compatibility is per-entry
   `peerVersions` in `registry.json`, not version equality; `breaking-changes.json` and
   `cascivo doctor --drift` in the same breath, with the command spelled out.
2. **`cascivo init` output** — one line: *"Packages version independently. Run `cascivo doctor
   --drift` after any upgrade; machine-readable history: `breaking-changes.json`."* This reaches
   the adopter at the moment the version spread first appears on their screen.
3. **`llms.txt`** (`scripts/llms/generate.ts`) — the same three facts as one bullet.
4. **`docs/ENTERPRISE-READINESS.md`** — a "for a procurement reviewer" paragraph naming the 0.x
   policy, the deprecation policy (`ComponentDeprecation`, `core/src/types.ts:171-181`), and the
   drift tooling. That is the document that gets forwarded; make it answer the question.

### Guard

Extend `scripts/checks/getting-started-contract.test.ts` — the existing guard whose stated job
is "a first-day fact appears on every first-day surface". Add the versioning fact to its
contract set (README, GETTING-STARTED, `llms.txt`, `cascivo init` output). This is precisely
the mechanism the user's "make sure this is perfectly documented and easy to find" asks for:
not a paragraph somewhere, but a fact whose presence on every entry surface is enforced.

### Acceptance

`pnpm meta:check` fails if any of the four surfaces loses the versioning fact.

---

## WS-13 — Close the layer gap: make the API self-teaching (P1, red flag 3)

### Finding

The report's own summary: *"If someone reaches the library through a stale training snapshot or
a partial doc fetch instead of `@cascivo/docs`, those edges are all still there."* WS-1, WS-2
and WS-3 remove three edges at layer 1. This workstream is about the ones that **cannot** be
removed at layer 1 — `gap={4}` vs `gap="4"`, `Flex` defaulting vertical, `useTheme()` returning
a tuple, `<Text tone>` — where the type error is correct but the *message* teaches nothing.

### Design decision

**Ship `@cascivo/eslint-plugin` with a single rule: `cascivo/prop-vocabulary`.**

`@cascivo/eslint-config` is config-only today (`packages/eslint-config/src/index.js`, no rules).
Adopters following `docs/USING-WITH-STRICT-ESLINT.md` already install it — the report did, and
credited it. So the delivery channel exists and is already adopted; only the rule is missing.

The rule reads **one generated data file** (`prop-vocabulary.json`, emitted by `pnpm regen`
from the manifests + `aliases.json` + the near-miss table) and reports, with a fix where the
mapping is unambiguous:

| Written | Report | Autofix |
| --- | --- | --- |
| `<Text tone="subtle">` | *"`Text` has no `tone`. Text emphasis is `muted` (boolean); `tone` is the severity vocabulary on `Status`/`Badge`."* | — |
| `<Flex gap="4">` | *"`gap` is a numeric `SpaceStep`."* | → `gap={4}` |
| `import { Switch } from '@cascivo/react'` (pre-WS-2) | *"`Switch` is `Toggle`."* | → `Toggle` |
| `const { theme } = useTheme()` | *"`useTheme()` returns a tuple `[name, setTheme]`."* | — |
| `<Flex justify="between">` with no `direction` | *"`Flex` defaults to `direction=\"vertical\"`; `justify` acts on the block axis here."* | — |

One rule, one generated table, no per-case code. Every future adopter report adds a row to a
JSON file instead of a paragraph to a guide — which is the durable answer to "it always was
mentioned to be fixed."

### Rejected

- *TypeScript custom error messages.* Not a language feature. The only near-equivalent —
  branded never-types — produces worse messages than the default.
- *Runtime dev warnings for unknown props.* Cannot distinguish a typo from a legitimate DOM
  passthrough, and fires after the build the adopter is trying to fix.

### Implementation

1. `packages/eslint-plugin/` — new package: one rule, JSON-driven, flat-config export.
2. `scripts/llms/generate.ts` (or a sibling under `scripts/registry/`) — emit
   `prop-vocabulary.json` from the manifests and `aliases.json` at regen time.
3. `@cascivo/eslint-config` — include the plugin at `warn` by default (never `error`: a lint
   rule that blocks a build on a naming opinion will get the whole config removed), documented
   in `USING-WITH-STRICT-ESLINT.md`. Keep the "spread it last" advice intact.
4. Dogfood on `apps/examples/*` — the rule must be clean on the repo's own examples.

### Guard

- Rule unit tests (`RuleTester`) per row.
- Drift: `prop-vocabulary.json` regenerates identically in CI (`git diff --exit-code` — the
  existing drift job covers it once the file is generated).
- `scripts/checks/doc-api-drift.test.ts` — every row's "correct" prop still exists.

### Acceptance

A fresh app with `@cascivo/eslint-config` gets the five messages above from `eslint .`, with
autofix where listed. `pnpm ready` green.

**Sequencing note:** this is the largest item and it is the only one that can be deferred whole
without leaving a defect behind — every row it covers is also covered by a doc fix elsewhere in
this plan. Ship it last; do not let it block Phase 1.

---

## §2 — The docs-findability contract

The user's instruction: *"If it's a docs issue, make sure this is perfectly documented and easy
to find."* Concretely, for this plan that means **no fact lands in exactly one file.** Every
doc-layer fix above names its surfaces; the contract is:

| Fact | Canonical home | Generated into | Enforced by |
| --- | --- | --- | --- |
| Prop semantics (visible/invisible, hint/description, orientation) | the `.meta.ts` manifest | `registry.json`, `llms/<name>.md`, `context/<name>.md`, site props table, `@cascivo/docs`, MCP `get_component` | `pnpm regen` + drift job |
| Catalogue-wide naming rules | `docs/AI-RULES.md` | `llms.txt` (via `scripts/llms/generate.ts`) | `doc-api-drift.test.ts` |
| Near-miss prop names (WS-4) | `docs/AI-RULES.md` table | `llms.txt` | `doc-api-drift.test.ts` |
| Foreign component names (WS-2) | `packages/components/aliases.json` | `registry.json`, `llms.txt`, CLI, MCP | `component-aliases.test.ts` |
| First-day facts (WS-12) | contract set | README, GETTING-STARTED, `llms.txt`, `cascivo init` | `getting-started-contract.test.ts` |
| Task recipes (WS-9, WS-10, WS-11) | the relevant `USING-WITH-*.md` / `RECIPE-*.md` | `@cascivo/docs`, `@cascivo/docspack` | `docs-links` + `docs-imports` + `claims.test.ts` |

Two rules follow from the §0.1 root cause and apply to every doc change in this plan:

1. **A doc claim that states a number or an absolute must be backed by something executable** —
   a built example app, a measured benchmark, or a `claims.test.ts` assertion. WS-9 exists
   because a boxed warning stated an absolute nobody could re-check.
2. **A guard may not decide anything by matching prose.** WS-0 exists because one did.

---

## §3 — Phasing

| Phase | Contents | Why together |
| --- | --- | --- |
| **1 — Bugs and falsehoods** | WS-5 (SideNav footer), WS-9 (bundle box), WS-0 (guard hole) | The three things currently shipping something wrong: a visual defect, a false doc, a lying guard. No API surface changes; can land immediately. |
| **2 — Naming, at layer 1** | WS-1, WS-2, WS-3, WS-1c | One coherent API-surface change with one changeset and one `AI-RULES.md` rewrite. All additive; no breaking changes. |
| **3 — Prose and prop docs** | WS-4, WS-6, WS-10, WS-11, WS-12 | Doc-only; parallelisable; each has a small guard. |
| **4 — Charts and bundle** | WS-7, WS-8 | WS-8 changes packaging (subpath sweep, `ready:ci`, `isolated:check`) and must not be entangled with Phase 2's API changes when something goes red. WS-9's step 3 lands here as a follow-up edit. |
| **5 — Optional, highest leverage** | WS-13 | New package; ship only when 1–4 are green. |

Every phase ends with `pnpm ready` green. Phase 4 additionally requires `pnpm ready:ci`,
`pnpm isolated:check`, `pnpm css-contract:check`, and `pnpm visual:baselines:check`.

---

## §4 — Open decisions (need a human call before implementation)

1. **WS-7 item 8 — change `AreaChart`'s default `fill` to `'gradient'` for single-series
   charts?** Recommended yes. It is a visual change to every existing single-series area chart
   on a minor release, needs a changeset note and regenerated visual baselines. If no, the
   fallback is documentation only.
2. **WS-2(b) — export `Switch` as an alias of `Toggle`?** Recommended yes. Cost: one more name
   in the export surface, and a permanent alias to carry. Benefit: the single most-guessed
   component name in the ecosystem compiles.
3. **WS-13 — build `@cascivo/eslint-plugin`?** Recommended yes but last. It is the only
   structural answer to red flag 3, and the only item here that turns a future friction report
   into a one-line JSON change instead of a doc paragraph.
4. **WS-8 budget — is ≤ 6 kB gzip the right ceiling for `@cascivo/charts/sparkline`?** If a
   tooltip cannot fit under it, decide whether the subpath ships without a tooltip (documented)
   or the budget moves.

## §5 — Non-goals

- Renaming `Toggle`, `Switcher`, `DataList.orientation`, or `Field.description`. Every naming
  fix in this plan is additive; nothing that compiles today stops compiling.
- Lockstep versioning across packages (WS-12 fixes the explanation, not the scheme).
- Any change to the `Tone` / `Progress` vocabularies (WS-4 explicitly protects them).
- Touching the report's praised surfaces — `@cascivo/docs`, `USING-WITH-A-ROUTER.md`'s
  `setLinkComponent`/`asChild` model, the `.d.ts` authority claim, `warnScaleMismatch`'s
  existing message. They work; the changes above extend them and must not restructure them.
