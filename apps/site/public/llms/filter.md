# Filter

A group of toggleable pill or outline buttons for filtering content by category

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add filter
```

Or use it from the prebuilt package without copying:

```tsx
import { Filter } from '@cascivo/react'
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

| Prop            | Type                           | Required | Default | Description                                                                                                                                                            |
| --------------- | ------------------------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`     | `string`                       | no       | —       | Invisible accessible name. The catalog convention; the DOM spelling `aria-label` is accepted as an alias so either guess compiles. Not rendered — screen readers only. |
| `aria-label`    | `string`                       | no       | —       | Accessible label for the filter group.                                                                                                                                 |
| `options`       | `FilterOption[]`               | yes      | —       | Array of { label, value } objects to render as filter buttons                                                                                                          |
| `value`         | `string[]`                     | no       | —       | Controlled selected values                                                                                                                                             |
| `defaultValue`  | `string[]`                     | no       | `[]`    | Initial selected values for uncontrolled use                                                                                                                           |
| `onValueChange` | `(selected: string[]) => void` | no       | —       | Called with the selected values whenever the selection changes.                                                                                                        |
| `onChange`      | `(selected: string[]) => void` | no       | —       | Deprecated: use onValueChange (same string[]).                                                                                                                         |
| `multi`         | `boolean`                      | no       | `false` | Allow multiple items to be selected simultaneously                                                                                                                     |
| `variant`       | `'pill' \| 'outline'`          | no       | `pill`  | Selects the visual style variant.                                                                                                                                      |

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

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

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

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
