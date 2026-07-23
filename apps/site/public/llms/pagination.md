# Pagination

Controls for navigating paged data sets, with page size selection

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add pagination
```

Or use it from the prebuilt package without copying:

```tsx
import { Pagination } from '@cascivo/react'
```

## Category

`navigation`

## Props

| Prop               | Type                     | Required | Default             | Description                                                     |
| ------------------ | ------------------------ | -------- | ------------------- | --------------------------------------------------------------- |
| `page`             | `number`                 | yes      | —                   | Current page (1-based)                                          |
| `pageSize`         | `number`                 | yes      | —                   | Items per page                                                  |
| `totalItems`       | `number`                 | yes      | —                   | Total number of items                                           |
| `onPageChange`     | `(page: number) => void` | yes      | —                   | Called with the new page number when it changes.                |
| `onPageSizeChange` | `(size: number) => void` | no       | —                   | Called with the new page size when it changes.                  |
| `pageSizeOptions`  | `number[]`               | no       | `[10, 25, 50, 100]` | Options for the page size select                                |
| `labels`           | `PaginationLabels`       | no       | —                   | Overridable English strings for all visible and accessible text |
| `className`        | `string`                 | no       | —                   | Additional CSS class names merged onto the root element.        |

## Examples

### Basic

```tsx
<Pagination page={1} pageSize={25} totalItems={103} onPageChange={setPage} />
```

### With page size select

```tsx
<Pagination
  page={page}
  pageSize={size}
  totalItems={103}
  onPageChange={setPage}
  onPageSizeChange={setSize}
/>
```

### Custom labels

```tsx
<Pagination
  page={1}
  pageSize={10}
  totalItems={42}
  onPageChange={setPage}
  labels={{ previous: 'Zurück', next: 'Weiter' }}
/>
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-radius-input`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter, Space, ArrowUp, ArrowDown

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

pagination, navigation, table, data, pages

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
