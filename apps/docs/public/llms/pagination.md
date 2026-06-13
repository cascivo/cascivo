# Pagination

Controls for navigating paged data sets, with page size selection

## Install

```bash
npx cascade add pagination
```

## Category

`navigation`

## Props

| Prop               | Type                     | Required | Default             | Description                                                     |
| ------------------ | ------------------------ | -------- | ------------------- | --------------------------------------------------------------- |
| `page`             | `number`                 | yes      | —                   | Current page (1-based)                                          |
| `pageSize`         | `number`                 | yes      | —                   | Items per page                                                  |
| `totalItems`       | `number`                 | yes      | —                   | Total number of items                                           |
| `onPageChange`     | `(page: number) => void` | yes      | —                   | —                                                               |
| `onPageSizeChange` | `(size: number) => void` | no       | —                   | —                                                               |
| `pageSizeOptions`  | `number[]`               | no       | `[10, 25, 50, 100]` | Options for the page size select                                |
| `labels`           | `PaginationLabels`       | no       | —                   | Overridable English strings for all visible and accessible text |
| `className`        | `string`                 | no       | —                   | —                                                               |

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

- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-color-bg-subtle`
- `--cascade-color-accent`
- `--cascade-color-accent-subtle`
- `--cascade-radius-input`
- `--cascade-radius-button`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter, Space, ArrowUp, ArrowDown

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

pagination, navigation, table, data, pages
