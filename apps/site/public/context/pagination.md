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

| Name               | Type                     | Required | Default           | Description                                                     |
| ------------------ | ------------------------ | -------- | ----------------- | --------------------------------------------------------------- |
| `page`             | `number`                 | Yes      | —                 | Current page (1-based)                                          |
| `pageSize`         | `number`                 | Yes      | —                 | Items per page                                                  |
| `totalItems`       | `number`                 | Yes      | —                 | Total number of items                                           |
| `onPageChange`     | `(page: number) => void` | Yes      | —                 | Called with the new page number when it changes.                |
| `onPageSizeChange` | `(size: number) => void` | No       | —                 | Called with the new page size when it changes.                  |
| `pageSizeOptions`  | `number[]`               | No       | [10, 25, 50, 100] | Options for the page size select                                |
| `labels`           | `PaginationLabels`       | No       | —                 | Overridable English strings for all visible and accessible text |
| `className`        | `string`                 | No       | —                 | Additional CSS class names merged onto the root element.        |

## Tokens

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

## Examples

### Basic

```jsx
<Pagination page={1} pageSize={25} totalItems={103} onPageChange={setPage} />
```

### With page size select

```jsx
<Pagination
  page={page}
  pageSize={size}
  totalItems={103}
  onPageChange={setPage}
  onPageSizeChange={setSize}
/>
```

### Custom labels

```jsx
<Pagination
  page={1}
  pageSize={10}
  totalItems={42}
  onPageChange={setPage}
  labels={{ previous: 'Zurück', next: 'Weiter' }}
/>
```

## Boundaries

| Area              | Level    | Note                                                              |
| ----------------- | -------- | ----------------------------------------------------------------- |
| page size options | flexible | pageSizeOptions and the size select are optional                  |
| token names       | strict   | Surfaces, borders, and accent must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Pagination component (navigation). Controls for navigating paged data sets, with page size selection

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Pagination is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-bg-subtle, --cascivo-color-accent, --cascivo-color-accent-subtle, --cascivo-radius-input, --cascivo-radius-button, --cascivo-focus-ring

Accessibility: role "navigation", WCAG 2.2-AA, keyboard: Tab/Enter/Space/ArrowUp/ArrowDown. Keep it AA.

Do not change (strict): token names — Surfaces, borders, and accent must resolve to --cascivo-* tokens
Flexible: page size options.

Do not invent props, tokens, or global viewport media queries.
```
