# EmptyState

**Category:** display  
**Description:** Placeholder for views that have no data to display

## When to use

- Filling a view that has no data with guidance and a primary next step
- Explaining why a list/table is empty (no results, nothing created yet)
- Offering an action that resolves the empty condition (action prop)

## When NOT to use

- Content is still loading — use Skeleton or Spinner
- An error occurred — use Alert to explain the failure

## Anti-patterns

### Conflating loading with empty tells the user there is no data when there may be

**Bad:** `Showing an EmptyState while data is still fetching`  
**Good:** `A Skeleton during load, then EmptyState only if the result is empty`  
**Why:** Conflating loading with empty tells the user there is no data when there may be

## Related components

- **Skeleton** (alternative): Skeleton covers the loading phase before data resolves
- **Alert** (alternative): Use Alert for error states rather than a generic empty state

## Accessibility rationale

Presentational by role; the title carries the meaning as text and the action is a real focusable control, so keyboard and screen-reader users can act on the next step

## Props

| Name          | Type           | Required | Default | Description                                           |
| ------------- | -------------- | -------- | ------- | ----------------------------------------------------- |
| `icon`        | `ReactNode`    | No       | —       | Icon element rendered in the component.               |
| `title`       | `string`       | Yes      | —       | Title text for the component.                         |
| `description` | `string`       | No       | —       | Supporting description text.                          |
| `action`      | `ReactNode`    | No       | —       | Primary action shown in the component.                |
| `size`        | `'md' \| 'lg'` | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-full`

## Examples

### Basic

```jsx
<EmptyState title="No results" description="Try adjusting your filters." />
```

### With action

```jsx
<EmptyState
  icon="📄"
  title="No documents yet"
  description="Create your first document to get started."
  action={<Button>New document</Button>}
/>
```

## Boundaries

| Area            | Level    | Note                                                                    |
| --------------- | -------- | ----------------------------------------------------------------------- |
| size and action | flexible | Action and icon are optional; size scales for full-page vs in-panel use |
| token names     | strict   | Text and background colors must resolve to --cascivo-\* tokens          |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo EmptyState component (display). Placeholder for views that have no data to display

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

EmptyState is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-text-muted, --cascivo-color-bg-subtle, --cascivo-radius-full

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Text and background colors must resolve to --cascivo-* tokens
Flexible: size and action.

Do not invent props, tokens, or global viewport media queries.
```
