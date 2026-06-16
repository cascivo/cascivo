# Filter

**Category:** inputs  
**Description:** A group of toggleable pill or outline buttons for filtering content by category

## When to use

- Tag or category filtering on listing pages where the active filters must remain visible
- Facet chips that toggle content visibility (e.g. product categories, team labels)

## When NOT to use

- Navigation between distinct views — use Tabs
- A binary on/off switch — use Toggle
- Form field for selecting a value — use Select or Checkbox

## Anti-patterns

### Filter is for narrowing visible content, not routing between views

**Bad:** `<Filter options={statusOptions} onChange={navigate} />`  
**Good:** `<Tabs items={statusTabs} />`  
**Why:** Filter is for narrowing visible content, not routing between views

## Related components

- **Tabs** (alternative): Tabs navigate between views; Filter narrows displayed content
- **Toggle** (alternative): Toggle is the binary on/off primitive; Filter handles multi-option sets
- **Tag** (complementary): Tag displays the currently active filters as dismissible chips

## Accessibility rationale

Wraps buttons in a role="group" so screen readers announce the group label; each button uses aria-pressed to communicate selected state without relying on color alone

## Props

| Name           | Type                           | Required   | Default | Description                                                   |
| -------------- | ------------------------------ | ---------- | ------- | ------------------------------------------------------------- | --- |
| `options`      | `FilterOption[]`               | Yes        | —       | Array of { label, value } objects to render as filter buttons |
| `value`        | `string[]`                     | No         | —       | Controlled selected values                                    |
| `defaultValue` | `string[]`                     | No         | []      | Initial selected values for uncontrolled use                  |
| `onChange`     | `(selected: string[]) => void` | No         | —       | —                                                             |
| `multi`        | `boolean`                      | No         | false   | Allow multiple items to be selected simultaneously            |
| `variant`      | `'pill'                        | 'outline'` | No      | pill                                                          | —   |

## Tokens

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

## Examples

### Single-select

```jsx
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

```jsx
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

```jsx
<Filter
  variant="outline"
  options={[
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
  ]}
  aria-label="Filter by framework"
/>
```

## Boundaries

| Area    | Level    | Note                                                                                            |
| ------- | -------- | ----------------------------------------------------------------------------------------------- |
| variant | flexible | pill suits floating filter bars; outline suits embedded filter rows within a bordered container |
| multi   | flexible | single-select for mutually exclusive categories; multi for additive facets                      |
