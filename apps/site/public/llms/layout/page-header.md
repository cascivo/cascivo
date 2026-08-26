# PageHeader

Page-level header with title, description, breadcrumb, and actions slots.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/page-header
```

Or use it from the prebuilt package without copying:

```tsx
import { PageHeader } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop          | Type        | Required | Default | Description                                                                                                                                                                                                         |
| ------------- | ----------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `ReactNode` | yes      | —       | Page title, rendered as the `<h1>`. Accepts nodes, not just a string, so you can put a status Badge or a linked domain beside the name — the canonical project-header shape. Keep it inline-level: it is an `<h1>`. |
| `description` | `ReactNode` | no       | —       | Supporting line under the title, rendered as a `<p>`. Accepts nodes.                                                                                                                                                |
| `breadcrumb`  | `ReactNode` | no       | —       | Breadcrumb slot                                                                                                                                                                                                     |
| `actions`     | `ReactNode` | no       | —       | Action buttons slot                                                                                                                                                                                                 |
| `className`   | `string`    | no       | —       | Additional CSS class                                                                                                                                                                                                |

## Examples

### Basic

Title with description

```tsx
<PageHeader title="Dashboard" description="Welcome back" />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-space-2`
- `--cascivo-space-4`
- `--cascivo-text-2xl`
- `--cascivo-font-bold`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-text-sm`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `banner`

## Dependencies

- `@cascivo/core`

## Tags

layout, header, page

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
