# EmptyState

Placeholder for views that have no data to display

## Install

```bash
npx cascivo add empty-state
```

## Category

`display`

## Sizes

- `md`
- `lg`

## Props

| Prop          | Type        | Required | Default | Description |
| ------------- | ----------- | -------- | ------- | ----------- | --- |
| `icon`        | `ReactNode` | no       | —       | —           |
| `title`       | `string`    | yes      | —       | —           |
| `description` | `string`    | no       | —       | —           |
| `action`      | `ReactNode` | no       | —       | —           |
| `size`        | `'md'       | 'lg'`    | no      | `md`        | —   |

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
