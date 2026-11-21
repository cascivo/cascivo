# Rust + HTML-first stack: results, W2 (elements pilot)

Package `packages/elements` (`@cascivo/elements`, private): `cv-menu`, `cv-combobox`
(form-associated), `cv-date-picker` (form-associated). Light DOM, behaviour on
`@cascivo/core/pure` (`createMachine` + new `transition`) and `@preact/signals-core`, strings via
`@cascivo/i18n`, CSS = the components' own modules compiled to `cv-<unit>-<local>`.
Gate: `pnpm elements:check` (in `ready` and CI), real Chromium over the built `dist/`.

## Kill criteria

| # | Criterion | Result | Verdict |
|---|---|---|---|
| 2a | a11y sweep | axe WCAG 2.2 AA: 0 violations (closed + each popup open); APG keyboard suites pass; 320/360/390/414 px coarse pointer: no overflow, all targets ≥ 44 px | **pass** (after 2 shared-CSS fixes, below) |
| 2b | ≤ 1.5× React LOC | 0.40× overall (623 vs 1576 LOC) | **pass** |
| 3a | ≤ 3 KB gz per element | menu 1115 B, combobox 1376 B, date-picker 3052 B | **pass** (date-picker: 20 B headroom) |
| 3b | ≤ 15 KB gz per page | 8820 B JS (3 elements + 3277 B shared runtime); CSS 3232 B gz | **pass** |

Sizes: Rolldown, minified, `gzipSync` default level. "Per element" = its entry plus chunks only
it reaches; chunks shared by ≥ 2 entries (signals-core, i18n core, base classes) are the
runtime, counted once per page. With the runtime, menu's closure is 3.77 KB (it alone would not
need the form base).

## LOC (non-blank, non-comment)

| | React | Element | Ratio |
|---|---|---|---|
| menu (`menu.tsx` + `use-popover.ts`) | 336 | 116 | 0.35 |
| combobox (`combobox.tsx` + `list-nav` + `option-list`) | 576 | 149 | 0.26 |
| date-picker (`date-picker.tsx` + `calendar.tsx`) | 664 | 223 | 0.34 |
| shared `base.ts` + `messages.ts` | | 135 | |
| **total** | **1576** | **623** | **0.40** |

Excluded on both sides: `calendar-date.ts`, `parse-date.ts` (the element imports the same pure
helpers). Caveat: the elements cover a subset. Combobox: editable variant only (no select-only,
groups, creatable, match highlight, clear button, loading). Date-picker: typeable only (no
clearable, today button, week numbers, `disabledDate` predicate). Doubling the element LOC
would still be under 1.5×.

## Tests

- `pnpm elements:check`: 13 tests. Size (4), menu / combobox / date-picker behaviour + APG
  keyboard + form association (`FormData`, reset, `:invalid` for `required`, `disabled`),
  events (`cv-select`, `cv-value-change` + native `input`/`change` on the host), axe, 4-width
  touch sweep, idiomorph morph back to server markup (values, open menu and ARIA wiring persist;
  still interactive).
- `vp run @cascivo/elements#test` (jsdom, 15 tests): i18n defaults equal `builtin`, manifest matches
  classes (attributes read, events fired, idempotent `define()`), `set()` writes nothing when
  unchanged.

## Findings

1. **Shared CSS fixed (React benefits too):** `Menu` trigger was 24 px on coarse pointers (no
   coarse rule) → 44 px; `DatePicker` calendar overflowed the viewport at 320/360 px on coarse
   pointers (7 × 44 px cells + two paddings) → bottom sheet below `30rem`.
2. **Morph survival works** with a MutationObserver that re-runs an idempotent `render()`;
   every attribute write must be change-guarded. `el.disabled = true` re-queues a mutation even
   when unchanged and froze the page (regression test added).
3. jsdom has no `ElementInternals.setFormValue`; element behaviour needs a real browser.
4. `builtin` from `@cascivo/i18n` costs ~8 KB gz because its catalogs register as side effects;
   elements declare the same keys locally (parity-tested) and the build treats i18n as
   side-effect-free.
5. A popup opening via a `visibility` transition ignores `focus()` on its first frame; the
   date-picker retries per animation frame (React's picker defers with `setTimeout`).

## Open

- Date-picker has 20 B of budget headroom; any feature (clearable, today) needs a split or a
  budget decision.
- Core gained `transition()` (published `@cascivo/core`, changeset added; `api-surface.json` updated).
- Shared-CSS fixes change `@cascivo/react` output (changeset patch); `isolated:check` / `pack:check` not run.
