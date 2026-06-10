# PageHeader

Page-level header with title, description, breadcrumb, and actions slots.

## Install

```bash
npx cascade add layout/page-header
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | yes | — | Page title |
| `description` | `string` | no | — | Supporting description |
| `breadcrumb` | `ReactNode` | no | — | Breadcrumb slot |
| `actions` | `ReactNode` | no | — | Action buttons slot |
| `className` | `string` | no | — | Additional CSS class |

## Examples

### Basic

Title with description

```tsx
<PageHeader title="Dashboard" description="Welcome back" />
```

## Design tokens

- `--cascade-space-2`
- `--cascade-space-4`
- `--cascade-font-size-2xl`
- `--cascade-font-weight-bold`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-font-size-sm`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `banner`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, header, page
