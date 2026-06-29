# DataList

**Category:** display  
**Description:** Key-value pairs rendered as a description list

## When to use

- Displaying read-only key-value metadata (profile fields, record summaries)
- Presenting structured attributes where each value maps to a single label
- Compact detail panels next to or below a primary subject

## When NOT to use

- Editable fields — use form Inputs, not a DataList
- Tabular data with many rows and columns — use a Table

## Anti-patterns

### dl/dt/dd conveys the term-to-description relationship to assistive tech for free

**Bad:** `Faking a description list with stacked divs and manual labels`  
**Good:** `Use the native dl/dt/dd structure DataList emits`  
**Why:** dl/dt/dd conveys the term-to-description relationship to assistive tech for free

## Related components

- **ContainedList** (alternative): ContainedList shows single-value rows; DataList shows labelled pairs

## Accessibility rationale

Rendered as semantic dl with dt/dd pairs so the label-to-value association is native; no extra ARIA role is added

## Props

| Name          | Type                                                    | Required    | Default | Description                              |
| ------------- | ------------------------------------------------------- | ----------- | ------- | ---------------------------------------- | ----------------------------------------------------- |
| `items`       | `{ id?: string; label: ReactNode; value: ReactNode }[]` | Yes         | —       | The items to render.                     |
| `orientation` | `'horizontal'                                           | 'vertical'` | No      | horizontal                               | Layout orientation of the component.                  |
| `dividers`    | `boolean`                                               | No          | false   | When true, shows dividers between items. |
| `size`        | `'sm'                                                   | 'md'`       | No      | md                                       | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-border`
- `--cascivo-space-3`
- `--cascivo-space-4`

## Examples

### Horizontal data list

```jsx
<DataList
  items={[
    { label: 'Name', value: 'Ada Lovelace' },
    { label: 'Role', value: 'Mathematician' },
  ]}
/>
```

### Vertical with dividers

```jsx
<DataList orientation="vertical" dividers items={[{ label: 'Email', value: 'ada@example.com' }]} />
```

## Boundaries

| Area                 | Level    | Note                                                                        |
| -------------------- | -------- | --------------------------------------------------------------------------- |
| orientation and size | flexible | horizontal for wide panels, vertical for narrow columns; size tunes density |
| dl semantics         | strict   | Always renders dl/dt/dd; do not substitute generic elements                 |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo DataList component (display). Key-value pairs rendered as a description list

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DataList is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-border, --cascivo-space-3, --cascivo-space-4

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): dl semantics — Always renders dl/dt/dd; do not substitute generic elements
Flexible: orientation and size.

Do not invent props, tokens, or global viewport media queries.
```
