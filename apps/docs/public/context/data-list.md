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

| Name          | Type                                                    | Required    | Default | Description |
| ------------- | ------------------------------------------------------- | ----------- | ------- | ----------- | --- |
| `items`       | `{ id?: string; label: ReactNode; value: ReactNode }[]` | Yes         | —       | —           |
| `orientation` | `'horizontal'                                           | 'vertical'` | No      | horizontal  | —   |
| `dividers`    | `boolean`                                               | No          | false   | —           |
| `size`        | `'sm'                                                   | 'md'`       | No      | md          | —   |

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
