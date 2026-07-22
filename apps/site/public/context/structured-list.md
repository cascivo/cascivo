# StructuredList

**Category:** display  
**Description:** Tabular row list for scannable data, optionally single-selectable

## When to use

- Presenting a set of related records in aligned columns the user scans top to bottom
- Letting the user pick exactly one row from a short, readable list (selectable)
- Carbon-style structured content where a full data table is heavier than needed

## When NOT to use

- Sorting, filtering, pagination, or multi-select over many rows — use DataTable
- Free-form vertical content without column alignment — use List

## Anti-patterns

### The selectable variant is a radiogroup; multiple selected rows break the radio semantics

**Bad:** `selectable with multiple rows marked selected`  
**Good:** `A single selected id (value/defaultValue) — selection is single-choice`  
**Why:** The selectable variant is a radiogroup; multiple selected rows break the radio semantics

## Related components

- **DataTable** (alternative): DataTable adds sorting, filtering, and pagination; StructuredList stays static and lightweight
- **List** (alternative): List is single-column vertical content; StructuredList aligns multiple cells per row

## Accessibility rationale

Static lists use table/row/cell roles so columns are announced; selectable lists become a radiogroup of role=radio rows with roving tabindex, so arrow keys move focus and Enter/Space check a row exactly like native radios

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `aria-label` | `string` | No | — | Accessible label for the list table. |
| `items` | `{ id: string; cells: ReactNode[]; selected?: boolean }[]` | Yes | — | The items to render. |
| `headers` | `ReactNode[]` | No | — | The column header cells. |
| `selectable` | `boolean` | No | false | When true, rows can be selected. |
| `value` | `string` | No | — | The controlled value. |
| `defaultValue` | `string` | No | — | The initial value when uncontrolled. |
| `onSelect` | `(id: string) => void` | No | — | Called with the selected value. |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-primary`
- `--cascivo-color-surface`
- `--cascivo-focus-ring`

## Examples

### Static

```jsx
<StructuredList headers={["Name", "Role"]} items={[{ id: "a", cells: ["Ada", "Engineer"] }]} />
```

### Selectable

```jsx
<StructuredList selectable defaultValue="a" items={[{ id: "a", cells: ["Ada"] }, { id: "b", cells: ["Grace"] }]} onSelect={(id) => set(id)} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| selectable | flexible | Toggle selectable based on whether the list is interactive or purely presentational |
| roles | strict | Static uses table semantics; selectable uses radiogroup — do not mix |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo StructuredList component (display). Tabular row list for scannable data, optionally single-selectable

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

StructuredList is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-primary, --cascivo-color-surface, --cascivo-focus-ring

Accessibility: role "table", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Home/End/Enter/Space. Keep it AA.

Do not change (strict): roles — Static uses table semantics; selectable uses radiogroup — do not mix
Flexible: selectable.

Do not invent props, tokens, or global viewport media queries.
```
