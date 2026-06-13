# Pagination

**Category:** navigation  
**Description:** Controls for navigating paged data sets, with page size selection

## When to use

- Navigating between pages of a paged dataset
- Letting the user change how many items appear per page (onPageSizeChange)
- Pairing with a table or list that loads data in chunks

## When NOT to use

- Navigating a content hierarchy — use Breadcrumb
- Infinite scroll experiences where pages are not exposed

## Anti-patterns

### Pagination semantics imply sequential pages of one dataset, not arbitrary navigation

**Bad:** `Using Pagination to navigate between unrelated app sections`  
**Good:** `<Tabs> or nav links for section switching`  
**Why:** Pagination semantics imply sequential pages of one dataset, not arbitrary navigation

## Related components

- **DataTable** (pairs-with): DataTable embeds Pagination for its rows
- **Breadcrumb** (alternative): Breadcrumb is for hierarchy, Pagination for sequential pages

## Accessibility rationale

Wrapped in <nav> with an accessible label; page controls are real buttons with current-page state exposed, and all visible/assistive strings are overridable via labels for i18n

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `page` | `number` | Yes | — | Current page (1-based) |
| `pageSize` | `number` | Yes | — | Items per page |
| `totalItems` | `number` | Yes | — | Total number of items |
| `onPageChange` | `(page: number) => void` | Yes | — | — |
| `onPageSizeChange` | `(size: number) => void` | No | — | — |
| `pageSizeOptions` | `number[]` | No | [10, 25, 50, 100] | Options for the page size select |
| `labels` | `PaginationLabels` | No | — | Overridable English strings for all visible and accessible text |
| `className` | `string` | No | — | — |

## Tokens

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

## Examples

### Basic

```jsx
<Pagination page={1} pageSize={25} totalItems={103} onPageChange={setPage} />
```

### With page size select

```jsx
<Pagination page={page} pageSize={size} totalItems={103} onPageChange={setPage} onPageSizeChange={setSize} />
```

### Custom labels

```jsx
<Pagination page={1} pageSize={10} totalItems={42} onPageChange={setPage} labels={{ previous: 'Zurück', next: 'Weiter' }} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| page size options | flexible | pageSizeOptions and the size select are optional |
| token names | strict | Surfaces, borders, and accent must resolve to --cascade-* tokens |
