# EmptyState

Placeholder for views that have no data to display

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add empty-state
```

Or use it from the prebuilt package without copying:

```tsx
import { EmptyState } from '@cascivo/react'
```

## Category

`display`

## Sizes

- `md`
- `lg`

## Props

| Prop          | Type           | Required | Default | Description                                           |
| ------------- | -------------- | -------- | ------- | ----------------------------------------------------- |
| `icon`        | `ReactNode`    | no       | —       | Icon element rendered in the component.               |
| `title`       | `string`       | yes      | —       | Title text for the component.                         |
| `description` | `string`       | no       | —       | Supporting description text.                          |
| `action`      | `ReactNode`    | no       | —       | Primary action shown in the component.                |
| `size`        | `'md' \| 'lg'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Examples

### Basic

```tsx
<EmptyState title="No results" description="Try adjusting your filters." />
```

### With action

```tsx
<EmptyState
  icon="📄"
  title="No documents yet"
  description="Create your first document to get started."
  action={<Button>New document</Button>}
/>
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

empty, placeholder, zero-state, no-data

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
