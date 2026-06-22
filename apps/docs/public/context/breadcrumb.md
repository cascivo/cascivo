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

| Name         | Type                                 | Required | Default    | Description                                                                                   |
| ------------ | ------------------------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------- |
| `items`      | `{ label: string; href?: string }[]` | Yes      | —          | —                                                                                             |
| `maxVisible` | `number`                             | No       | —          | When items exceed this count, collapse to the first item, an ellipsis, and the trailing items |
| `className`  | `string`                             | No       | —          | —                                                                                             |
| `ariaLabel`  | `string`                             | No       | Breadcrumb | —                                                                                             |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Breadcrumb
  items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Breadcrumb' }]}
/>
```

### Collapsed

Long trails collapse to the first item, an ellipsis, and the trailing items.

```jsx
<Breadcrumb
  maxVisible={3}
  items={[
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Components', href: '/docs/components' },
    { label: 'Breadcrumb' },
  ]}
/>
```

## Boundaries

| Area        | Level    | Note                                                           |
| ----------- | -------- | -------------------------------------------------------------- |
| maxVisible  | flexible | Collapse long trails to fit available width                    |
| token names | strict   | Text colors and focus ring must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Breadcrumb component (navigation). Shows the current page location within a navigation hierarchy

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Breadcrumb is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-radius-sm, --cascivo-focus-ring

Accessibility: role "navigation", WCAG 2.2-AA, keyboard: Tab/Enter. Keep it AA.

Do not change (strict): token names — Text colors and focus ring must resolve to --cascivo-* tokens
Flexible: maxVisible.

Do not invent props, tokens, or global viewport media queries.
```
