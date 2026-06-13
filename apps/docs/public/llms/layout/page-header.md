# PageHeader

Page-level header with title, description, breadcrumb, and actions slots.

## Install

```bash
npx cascivo add layout/page-header
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

- `--cascivo-space-2`
- `--cascivo-space-4`
- `--cascivo-font-size-2xl`
- `--cascivo-font-weight-bold`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-font-size-sm`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `banner`

## Dependencies

- `@cascivo/core`

## Tags

layout, header, page
