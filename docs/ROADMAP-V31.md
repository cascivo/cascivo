# cascivo — Roadmap v31: DaisyUI Gap Sprint

**Last updated:** 2026-06-16
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-16-v31-master-plan.md` + tranches 1–6

---

## Vision

v30 made the landing fast. v31 makes cascivo's component vocabulary undeniable.

DaisyUI ships 65 components used in millions of projects. After a full study of its component set, token conventions, and interaction patterns, two categories of work emerged:

**First — token naming gap.** Despite cascivo's primitives and themes already being in oklch, the `-content` pairing convention is incomplete. DaisyUI's semantic colors come in pairs: `primary` + `primary-content`, `error` + `error-content`, and so on. Developers who have used DaisyUI know the pattern: any time you put text on a colored background, you reach for the `-content` variant and contrast is guaranteed. cascivo currently uses a patchwork of `*-fg`, `text-on-*`, and `*-foreground` names with no systematic coverage for status colors (`info`, `success`, `warning`, `error`). There is also no `secondary` color role — a gap DaisyUI fills with a clearly distinguished secondary brand color. v31 closes both with a minimal, backward-compatible token addition across all ten themes.

**Second — 12 missing components.** cascivo ships ~60 components today. Twelve practical components that DaisyUI offers are absent from the registry: Progress, Kbd, Filter, Steps, Pagination, Dock, Join, Indicator, Stack, Swap, Chat Bubble, and Radial Progress. These are not decorative novelties — they are building blocks developers reach for regularly in real products. Their absence is friction when migrating from DaisyUI to cascivo.

After v31:

- All semantic status colors have `-content` paired tokens in every theme (guaranteed contrast with no maths).
- A `secondary` color role exists alongside `primary` and `accent`.
- 12 new components ship with typed props, signal-driven state, WCAG 2.1 AA compliance, complete `component.meta.ts` manifests, and `npx cascivo add` support.
- The registry reaches ~72 components — DaisyUI coverage, with cascivo's advantages.

---

## The DaisyUI comparison — honest assessment

Before writing this plan, DaisyUI was studied in full. The verdict on what it does well and what it does poorly informs v31's scope.

**What DaisyUI does well (and cascivo should match):**

- Complete `-content` pairing so developers never manually compute contrast
- `primary / secondary / accent / neutral / info / success / warning / error` vocabulary — industry-standard, widely understood
- Consistent `xs / sm / md / lg / xl` size scale across every sizable component
- `Join` as a standalone layout primitive (not baked into individual components) for seamless input/button groups

**What DaisyUI does poorly (and cascivo wins on already):**

- Requires Tailwind build pipeline — cascivo works with a `<link>` tag
- CSS-only state patterns (checkbox-driven modals, drawers) break under programmatic control — cascivo signals handle this naturally
- No TypeScript prop types — developers guess at class strings; cascivo has typed React props and autocomplete
- No component manifests — AI agents must scrape HTML docs; cascivo has `registry.json`, `component.meta.ts`, and an MCP server
- No copy-paste CLI — all-or-nothing install; cascivo has `npx cascivo add <name>`
- No accessibility guarantees — cascivo targets WCAG 2.1 AA on every component with keyboard navigation documented in the manifest

v31 closes the vocabulary and component count gap. It does not borrow the Tailwind dependency, checkbox-state patterns, or the lack of TypeScript.

---

## What changes

### Change 1 — Token architecture: -content pairs + secondary role

**-content tokens.** The status colors (`info`, `success`, `warning`, `error`) gain explicit `-content` tokens in every theme — foreground colors that guarantee ≥ 4.5:1 contrast on the corresponding background. The existing `--cascivo-color-primary-fg` and `--cascivo-color-text-on-accent` tokens gain `-content` aliases so the naming is consistent system-wide:

```css
/* New in every theme */
--cascivo-color-primary-content:     oklch(0.985 0 0);      /* white on dark primary */
--cascivo-color-accent-content:      oklch(1 0 0);           /* white on accent blue */
--cascivo-color-info-content:        oklch(1 0 0);
--cascivo-color-success-content:     oklch(1 0 0);
--cascivo-color-warning-content:     oklch(0.145 0 0);       /* dark on yellow warning */
--cascivo-color-error-content:       oklch(1 0 0);
--cascivo-color-destructive-content: oklch(1 0 0);
```

Existing `*-fg` and `text-on-*` tokens are kept as-is for backward compatibility. Components that render text on colored backgrounds (`Alert`, `Badge`, `Button` primary/destructive variants) add a reference to the new `-content` token alongside any existing foreground token. No renames; no breaking changes.

**Secondary color role.** A new `secondary` semantic color is added to every theme. Where `primary` is monochrome (bold black actions on light themes) and `accent` is the hue-driven interactive color, `secondary` is a mid-weight muted tone suited for secondary actions and differentiated badge variants. Each theme sets:

```css
--cascivo-color-secondary:         oklch(...);
--cascivo-color-secondary-content: oklch(...);
--cascivo-color-secondary-hover:   oklch(...);
--cascivo-color-secondary-subtle:  oklch(...);
```

`Button` and `Badge` gain `variant="secondary"` once the tokens exist.

**Why no token renames:** The `parity.test.ts` in `packages/themes/src/` enforces that all ten themes have identical token keys. A rename breaks the parity gate. The addition of new tokens requires updating all ten theme files in T1.

### Change 2 — 12 new components

**Form utilities (T2):**

- **Progress** — `<progress>` element wrapper with determinate state (`value` 0–100), indeterminate state (no `value`), semantic color variants (`primary / info / success / warning / error`), and size variants (`sm / md / lg`). Complements Spinner: Spinner for unknown-duration waits, Progress for tracked operations and quantities.
- **Kbd** — keyboard shortcut display. `<Kbd>⌘K</Kbd>` or compound `<Kbd><Kbd>Ctrl</Kbd>+<Kbd>K</Kbd></Kbd>`. Styled `<kbd>` element using surface and border tokens. No signals needed — pure display.
- **Filter** — toggle-button group for filtering and faceting. Signal-driven, single-select (default) or multi-select (`multi` prop). Pill style (`variant="pill"`) and outline style (`variant="outline"`). Distinct from `SegmentedControl` (which is for navigation/mode switching) and `ToggleGroup` (generic toggle row). Filter is optimized for visible filter chips on listing pages.

**Navigation (T3):**

- **Steps** — horizontal and vertical step indicator for onboarding, checkout, and multi-page forms. Each step takes a `state` (`pending / active / complete / error`) and a `label`. The circle content is a step number by default, an icon when `complete`, an `×` when `error`. Signal-driven for programmatic step advancement.
- **Pagination** — standalone page navigation controls. Previous/Next buttons, numbered page buttons with ellipsis for page counts > 7. Exposes an `onPageChange` callback and renders as a `<nav aria-label="Pagination">`. Does not duplicate the internal pagination inside `DataTable`.
- **Dock** — bottom navigation bar. Mobile app-shell pattern: icon + label items arranged horizontally, active item highlighted via `data-active`. Fixed to `position: fixed; inset-block-end: 0` on mobile; hidden on desktop at `64rem` via media query.

**Layout primitives (T4):**

- **Join** — border-radius collapsing wrapper for adjacent grouped children. `<Join><Input /><Button>Search</Button></Join>` collapses inner radii so the group appears seamless. Implemented with CSS `:first-child`, `:last-child`, `:not()` selectors — no JS children inspection. Works with any combination of `Input`, `Select`, `Button`, `IconButton`, `Kbd`.
- **Indicator** — absolutely positions a `Badge`, `Status`, or arbitrary slot on a corner of its child. `placement` prop controls which corner (`top-end` default). Wrapper is `position: relative`; overlay is `position: absolute`. Correct for notification counts, online dots, "new" labels.
- **Stack** — z-axis stacked layout. Children are `position: absolute` with configurable offsets to create a card pile or notification stack visual. `offset` prop controls the per-layer shift in pixels. CSS-only, no signals.

**Interaction patterns (T5):**

- **Swap** — animated toggle between two child slots (`on` and `off`). `checked` prop drives the visible slot. `mode` prop controls the CSS transition: `"rotate"` (90° spin) or `"flip"` (Y-axis flip). The classic use case is a sun/moon theme toggle icon. Signal-driven so it is fully controllable from outside.
- **Chat Bubble** — message UI primitive. `side` prop (`"start"` | `"end"`) aligns the bubble for incoming/outgoing. Optional `avatar` slot (accepts any node), `name` string, `time` string. Body is `children`. No list, no virtualization — this is a primitive for composition.
- **Radial Progress** — circular progress via `conic-gradient`. `value` prop (0–100) controls the fill angle. Center label slot for the percentage or an icon. Size and color variants match the Progress component. `style={{ '--cascivo-radial-progress': value }}` inline style sets the CSS custom property that drives `conic-gradient`.

---

## Why these changes and not others

**Why -content tokens now?** Developers from DaisyUI backgrounds immediately look for `*-content` tokens when placing text on colored surfaces. The patchwork of `*-fg` and `text-on-*` names creates confusion. Adding a systematic `-content` layer costs one T1 and zero breaking changes.

**Why a secondary color role?** The current primary/accent split covers bold actions (primary) and interactive links (accent) but leaves no slot for secondary actions — buttons that are "less important than primary but not ghost." DaisyUI, Bootstrap, and Material all have a secondary role. Without it, developers reach for `variant="outline"` as a workaround, which is not always the right semantic.

**Why these 12 components?** They close practical coverage gaps in the four most common developer tasks:
- **Building forms:** Progress (status feedback), Kbd (help text shortcuts), Filter (facet chips)
- **Navigation flows:** Steps (multi-step UX), Pagination (listings), Dock (mobile shell)
- **Layout composition:** Join (input groups), Indicator (notification badges), Stack (card piles)
- **Interaction variety:** Swap (icon toggles), Chat Bubble (messaging), Radial Progress (dashboards)

**What is explicitly excluded:** Countdown (novelty animation), Diff (complex comparison slider), Hover 3D Card (gimmick), Text Rotate (marketing animation), Browser/Phone/Window Mockups (developer decorations), and Mask (clip-path utility). These may appear in future roadmaps if there is genuine demand.

---

## Workstreams

| # | Workstream | Tranche | Summary |
|---|---|---|---|
| A | Token Architecture | T1 | -content pairs for all status colors, secondary color role — across all 10 themes; update Alert, Badge, Button |
| B | Form Utilities | T2 | Progress, Kbd, Filter — full implementation + tests + manifests + react/index.ts exports |
| C | Navigation Components | T3 | Steps, Pagination, Dock — full implementation + tests + manifests + react/index.ts exports |
| D | Layout Primitives | T4 | Join, Indicator, Stack — full implementation + tests + manifests + react/index.ts exports |
| E | Interaction Patterns | T5 | Swap, Chat Bubble, Radial Progress — full implementation + tests + manifests + react/index.ts exports |
| F | Gate | T6 | Full CI gate: registry.json audit, manifest completeness check, format+lint+build+type-check+tests+drift+breakpoints |

---

## Cross-cutting rules

1. No `useState`, `useEffect`, `useContext`, `useReducer`, or `useLayoutEffect` in any new component.
2. Every new component has a complete `component.meta.ts` with: `name`, `description`, `category`, `states`, `variants`, `sizes`, `props`, `tokens`, `accessibility`, `examples`, `dependencies`, `tags`, `intent`.
3. Every new component is exported from `packages/react/src/index.ts`.
4. Every new component is added to `packages/components/src/_all-metas.ts`.
5. Every new component passes `pnpm exec vp run @cascivo/components#test`.
6. All token additions must be applied to all 10 theme files in T1 (parity gate requires identical keys across themes).
7. `pnpm breakpoint:check` exits 0 after each tranche.
8. No existing tokens renamed or removed in T1. Additions only.

---

## Definition of Done

### Token Architecture (T1)

- [ ] `-content` tokens for `primary`, `accent`, `info`, `success`, `warning`, `error`, `destructive` exist in all 10 theme files.
- [ ] `secondary` color role (`secondary`, `secondary-content`, `secondary-hover`, `secondary-subtle`) defined in all 10 theme files.
- [ ] `Alert` references `--cascivo-color-info-content`, `--cascivo-color-success-content`, `--cascivo-color-warning-content`, `--cascivo-color-error-content`.
- [ ] `Badge` references `-content` tokens for colored variants.
- [ ] `Button` gains `variant="secondary"` wired to `secondary` tokens.
- [ ] `parity.test.ts` passes: all 10 themes have identical token key sets.
- [ ] `pnpm exec vp check` exits 0.

### Form Utilities (T2)

- [ ] `Progress` renders with determinate `value` (0–100). _Verify: T2 tests._
- [ ] `Progress` renders indeterminate when `value` is undefined. _Verify: T2 tests._
- [ ] `Progress` `variant` prop controls color (`primary/info/success/warning/error`). _Verify: T2 tests._
- [ ] `Progress` `size` prop controls height (`sm/md/lg`). _Verify: T2 tests._
- [ ] `Kbd` renders a single key with correct surface/border styling. _Verify: T2 tests._
- [ ] `Kbd` composes correctly when nested for compound shortcuts. _Verify: T2 tests._
- [ ] `Filter` toggles selected items via signal, emits `onChange`. _Verify: T2 tests._
- [ ] `Filter` `multi` prop enables multi-select behavior. _Verify: T2 tests._
- [ ] All three exported from `packages/react/src/index.ts`. _Verify: T2 grep._
- [ ] All three in `packages/components/src/_all-metas.ts`. _Verify: T2 grep._
- [ ] `pnpm exec vp run @cascivo/components#test` exits 0.

### Navigation Components (T3)

- [ ] `Steps` renders all four step states (`pending/active/complete/error`). _Verify: T3 tests._
- [ ] `Steps` supports `orientation="horizontal"` (default) and `orientation="vertical"`. _Verify: T3 tests._
- [ ] `Pagination` renders correct page buttons with ellipsis at > 7 pages. _Verify: T3 tests._
- [ ] `Pagination` calls `onPageChange` with correct page number on click. _Verify: T3 tests._
- [ ] `Dock` renders icon+label items, marks active item with `data-active`. _Verify: T3 tests._
- [ ] `Dock` is hidden on desktop at `64rem` (`@media (min-width: 64rem) { display: none }`). _Verify: T3._
- [ ] All three exported from `packages/react/src/index.ts`. _Verify: T3 grep._
- [ ] `pnpm exec vp run @cascivo/components#test` exits 0.

### Layout Primitives (T4)

- [ ] `Join` collapses inner border-radii between adjacent children. _Verify: T4 visual + tests._
- [ ] `Join` works with `Input`, `Button`, `Select`, `IconButton` as children. _Verify: T4 tests._
- [ ] `Indicator` positions overlay at `top-end` by default. _Verify: T4 visual + tests._
- [ ] `Indicator` `placement` prop accepts all four values (`top-start/top-end/bottom-start/bottom-end`). _Verify: T4 tests._
- [ ] `Stack` stacks children with configurable `offset` prop. _Verify: T4 visual._
- [ ] All three exported from `packages/react/src/index.ts`. _Verify: T4 grep._
- [ ] `pnpm exec vp run @cascivo/components#test` exits 0.

### Interaction Patterns (T5)

- [ ] `Swap` shows `on` child when `checked={true}`, `off` child when `checked={false}`. _Verify: T5 tests._
- [ ] `Swap` `mode="rotate"` and `mode="flip"` apply correct CSS transitions. _Verify: T5._
- [ ] `Chat Bubble` aligns left for `side="start"`, right for `side="end"`. _Verify: T5 tests._
- [ ] `Chat Bubble` renders `avatar`, `name`, `time` when provided. _Verify: T5 tests._
- [ ] `Radial Progress` sets `--cascivo-radial-progress` inline style from `value` prop. _Verify: T5 tests._
- [ ] `Radial Progress` center slot renders `children`. _Verify: T5 tests._
- [ ] All three exported from `packages/react/src/index.ts`. _Verify: T5 grep._
- [ ] `pnpm exec vp run @cascivo/components#test` exits 0.

### Gate (T6)

- [ ] `pnpm exec vp check` exits 0.
- [ ] `pnpm build` exits 0.
- [ ] `pnpm exec vp run -r check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0.
- [ ] `pnpm breakpoint:check` exits 0.
- [ ] `registry.json` contains all 12 new components.
- [ ] Every new component manifest has a non-empty `examples` array (≥ 2 examples).
- [ ] Every new component manifest has a non-empty `intent.whenToUse` array.
