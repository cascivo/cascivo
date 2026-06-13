# Breadcrumb

**Category:** navigation  
**Description:** Shows the current page location within a navigation hierarchy

## When to use

- Showing the user where the current page sits in a navigation hierarchy
- Providing one-click navigation back to ancestor pages
- Collapsing deep trails to keep the trail compact (maxVisible)

## When NOT to use

- Paging through data records — use Pagination
- Switching between sibling views — use Tabs

## Anti-patterns

### Breadcrumb models hierarchy depth, not sequential position in a list

**Bad:** `Using Breadcrumb to step through pages 1, 2, 3 of a dataset`  
**Good:** `<Pagination> for paged data`  
**Why:** Breadcrumb models hierarchy depth, not sequential position in a list

## Related components

- **Pagination** (alternative): Pagination moves through data pages; Breadcrumb moves up a hierarchy

## Accessibility rationale

Wrapped in <nav> with an aria-label and the current page marked aria-current="page"; ancestor entries are real links so keyboard users can jump up the hierarchy

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `{ label: string; href?: string }[]` | Yes | — | — |
| `maxVisible` | `number` | No | — | When items exceed this count, collapse to the first item, an ellipsis, and the trailing items |
| `className` | `string` | No | — | — |
| `ariaLabel` | `string` | No | Breadcrumb | — |

## Tokens

- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-text-subtle`
- `--cascade-radius-sm`
- `--cascade-focus-ring`

## Examples

### Basic

```jsx
<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Breadcrumb' }]} />
```

### Collapsed

Long trails collapse to the first item, an ellipsis, and the trailing items.

```jsx
<Breadcrumb maxVisible={3} items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Components', href: '/docs/components' }, { label: 'Breadcrumb' }]} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| maxVisible | flexible | Collapse long trails to fit available width |
| token names | strict | Text colors and focus ring must resolve to --cascade-* tokens |
