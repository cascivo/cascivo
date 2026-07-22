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
- **Tag** (pairs-with): Tag displays the currently active filters as dismissible chips

## Accessibility rationale

Wraps buttons in a role="group" so screen readers announce the group label; each button uses aria-pressed to communicate selected state without relying on color alone

## Props

| Name            | Type                           | Required | Default | Description                                                     |
| --------------- | ------------------------------ | -------- | ------- | --------------------------------------------------------------- |
| `aria-label`    | `string`                       | No       | —       | Accessible label for the filter group.                          |
| `options`       | `FilterOption[]`               | Yes      | —       | Array of { label, value } objects to render as filter buttons   |
| `value`         | `string[]`                     | No       | —       | Controlled selected values                                      |
| `defaultValue`  | `string[]`                     | No       | []      | Initial selected values for uncontrolled use                    |
| `onValueChange` | `(selected: string[]) => void` | No       | —       | Called with the selected values whenever the selection changes. |
| `onChange`      | `(selected: string[]) => void` | No       | —       | Deprecated: use onValueChange (same string[]).                  |
| `multi`         | `boolean`                      | No       | false   | Allow multiple items to be selected simultaneously              |
| `variant`       | `'pill' \| 'outline'`          | No       | pill    | Selects the visual style variant.                               |

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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Filter component (inputs). A group of toggleable pill or outline buttons for filtering content by category

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Filter is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-radius-full, --cascivo-border-default, --cascivo-color-text-subtle, --cascivo-color-text, --cascivo-color-active-bg, --cascivo-color-accent, --cascivo-color-accent-content, --cascivo-ring-width, --cascivo-ring-color, --cascivo-ease-out

Accessibility: role "group", WCAG 2.2-AA, keyboard: Tab/Enter/Space. Keep it AA.
Flexible: variant, multi.

Do not invent props, tokens, or global viewport media queries.
```
