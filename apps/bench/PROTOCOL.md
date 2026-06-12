# Bench App Protocol

Every bench app (`bench-app-cascade`, `bench-app-shadcn`, `bench-app-carbon`) implements this
contract exactly. The conformance spec (`runner/test/protocol.spec.ts`) enforces it.

## General

- React app, production-buildable with `vp build`, previewable with `vp preview` on its fixed
  port (cascade 4181, shadcn 4182, carbon 4183, `strictPort`).
- No `<StrictMode>` (double-render would corrupt commit counts).
- Root wrapped in the shared Profiler harness: `window.__commits` increments on every root
  commit.
- After first mount, a double-`requestAnimationFrame` sets `document.body.dataset.benchReady = '1'`.
- All data from the seeded generator (`data.ts`, mulberry32 seed 42). No randomness, no dates.
- Idiomatic state management for the library under test: cascade = signals; shadcn/carbon =
  `useState` per their own docs examples.

## Routes

### `/table`

- Toolbar buttons (all always present):
  - `[data-bench="create-1k"]` — replace table data with 1,000 generated rows
  - `[data-bench="create-10k"]` — replace with 10,000 rows
  - `[data-bench="update-every-10th"]` — append " !!!" to `name` of every 10th row
  - `[data-bench="select-row"]` — select row with id 5 (visible selected styling)
  - `[data-bench="clear"]` — empty the table
- Table container: `[data-bench-root="table"]`. Rows are real `<tr>` inside `<tbody>` — ALL
  rows in the DOM (no pagination slicing, no virtualization; CSS containment is allowed if the
  library ships it by default).
- Columns: ID, Name, Price, Status (status rendered with the library's Badge/Tag component).
- Initial state: empty table.

### `/form`

- `[data-bench-root="form"]` containing:
  - Search text input: `[data-bench-input="search"]` (library's Input component, library's
    idiomatic controlled/uncontrolled pattern). Its current value must render into
    `[data-bench-echo="search"]` (a `<span>` showing the value — forces the idiomatic state
    path to actually propagate).
  - 50 checkbox controls (library's Checkbox), labeled `Option 1..50`. Controls may be native
    `input[type="checkbox"]` or elements with `role="checkbox"` depending on the library.
  - `[data-bench="toggle-all"]` button — inverts all 50 checkboxes.

### `/dialog`

- `[data-bench="open-dialog"]` button opens the library's modal/dialog containing a short form
  (one Input, one Button). Dialog must expose `[role="dialog"]`.
- `[data-bench="close-dialog"]` button inside the dialog closes it.

## Row shape

```ts
type Row = { id: number; name: string; price: string; status: 'active' | 'paused' | 'archived' }
```

## Fairness rules

- Same React version across all apps. Production mode for timing runs. Versions pinned exact.
- DOM parity: same row count, same column count, comparable semantics. Library-specific
  wrappers (Carbon's table markup, etc.) are allowed — we benchmark components as shipped.
- No app-level memoization heroics (`React.memo`/`useMemo` walls) unless the library's own
  docs example uses them.
