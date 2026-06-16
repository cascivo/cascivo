# Filter

A group of toggleable pill or outline buttons for filtering content by category

## Install

```bash
npx cascivo add filter
```

## Category

`inputs`

## Variants

- `pill`
- `outline`

## States

- `default`
- `selected`
- `hover`
- `focus`

## Props

| Prop           | Type                           | Required   | Default | Description                                                   |
| -------------- | ------------------------------ | ---------- | ------- | ------------------------------------------------------------- | --- |
| `options`      | `FilterOption[]`               | yes        | —       | Array of { label, value } objects to render as filter buttons |
| `value`        | `string[]`                     | no         | —       | Controlled selected values                                    |
| `defaultValue` | `string[]`                     | no         | `[]`    | Initial selected values for uncontrolled use                  |
| `onChange`     | `(selected: string[]) => void` | no         | —       | —                                                             |
| `multi`        | `boolean`                      | no         | `false` | Allow multiple items to be selected simultaneously            |
| `variant`      | `'pill'                        | 'outline'` | no      | `pill`                                                        | —   |

## Examples

### Single-select

```tsx
<Filter
  options={[
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
  ]}
  aria-label="Filter by status"
/>
```

### Multi-select

```tsx
<Filter
  multi
  options={[
    { label: 'Design', value: 'design' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Marketing', value: 'marketing' },
  ]}
  aria-label="Filter by team"
/>
```

### Outline variant

```tsx
<Filter
  variant="outline"
  options={[
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
  ]}
  aria-label="Filter by framework"
/>
```

## Design tokens

- `--cascivo-radius-full`
- `--cascivo-border-default`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text`
- `--cascivo-color-active-bg`
- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

filter, chip, tag, pill, facet, category
