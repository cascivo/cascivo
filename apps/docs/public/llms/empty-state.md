# EmptyState

Placeholder for views that have no data to display

## Install

```bash
npx cascade add empty-state
```

## Category

`display`

## Sizes

- `md`
- `lg`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `ReactNode` | no | — | — |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `action` | `ReactNode` | no | — | — |
| `size` | `'md' | 'lg'` | no | `md` | — |

## Examples

### Basic

```tsx
<EmptyState title="No results" description="Try adjusting your filters." />
```

### With action

```tsx
<EmptyState icon="📄" title="No documents yet" description="Create your first document to get started." action={<Button>New document</Button>} />
```

## Design tokens

- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-text-muted`
- `--cascade-color-bg-subtle`
- `--cascade-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascade-ui/core`

## Tags

empty, placeholder, zero-state, no-data
