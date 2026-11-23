# InfiniteScroll

**Category:** feedback  
**Description:** Loads the next page when the end of a list scrolls into view

## When to use

- A long, page-fetched feed or list where the user should keep reading without a page break
- Search or media results that stream in as the user scrolls
- Mobile screens where numbered pagination would be awkward to hit

## When NOT to use

- Content the user needs to navigate back into by position — use Pagination so URLs stay addressable
- Lists with a footer below them, which infinite loading makes unreachable
- A fixed, fully-loaded dataset — render it, or virtualize it, instead of faking pages

## Anti-patterns

### A sentinel that stays in view keeps re-firing `onLoadMore` against an exhausted source

**Bad:** `Leaving `disabled` false after the last page`  
**Good:** `Pass `disabled={!hasMore}` so the observer disconnects`  
**Why:** A sentinel that stays in view keeps re-firing `onLoadMore` against an exhausted source

### The observer watches the sentinel against the nearest scroll root; outside it, intersection never changes

**Bad:** `Rendering it outside the element that scrolls`  
**Good:** `Place it as the last child of the scrolling region`  
**Why:** The observer watches the sentinel against the nearest scroll root; outside it, intersection never changes

## Related components

- **Pagination** (alternative): Addressable, position-stable paging when back-navigation matters
- **PullToRefresh** (pairs-with): Refreshes the head of the same list the InfiniteScroll extends
- **Spinner** (contains): Shows the Spinner while the load promise settles

## Accessibility rationale

The trigger is a real button, not a bare sentinel, so the next page is reachable by keyboard and by screen reader rather than only by scrolling — the standing accessibility complaint against scroll-only infinite lists. The IntersectionObserver activates the same code path the button does, so pointer and assistive-technology users converge on identical behaviour. While a page is in flight the button is replaced by a role="status" region carrying the loading string from the i18n catalog, which announces politely. Re-entry is guarded on a loading flag, so a sentinel still in view after a short page cannot loop. Because the component requires client JavaScript, server-render the first page as real content rather than relying on it.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onLoadMore` | `() => Promise<unknown> \| unknown` | Yes | — | Called when the sentinel comes into view, or the button is activated; the spinner shows until it settles |
| `disabled` | `boolean` | No | false | When true, stops observing and renders nothing — there are no more pages. |
| `rootMargin` | `string` | No | '200px' | How far ahead of the end to start loading, as an IntersectionObserver root margin. |
| `labels` | `{ loadMore?: string; loading?: string }` | No | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-text-muted`
- `--cascivo-color-border`
- `--cascivo-color-surface-2`
- `--cascivo-color-foreground`
- `--cascivo-radius-md`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-text-ui`
- `--cascivo-target-min-coarse`

## Examples

### Basic

Place it as the last child of the scrolling region, after the list.

```jsx
<InfiniteScroll onLoadMore={loadNextPage} />
```

### Stopping at the last page

Renders nothing and stops observing once there is nothing left to load.

```jsx
<InfiniteScroll onLoadMore={loadNextPage} disabled={!hasMore} />
```

### Loading earlier

Starts the next page well before the user reaches the end.

```jsx
<InfiniteScroll onLoadMore={loadNextPage} rootMargin="600px" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| rootMargin | flexible | How far ahead of the end loading starts (default 200px) |
| onLoadMore | flexible | May return a promise; the spinner persists until it settles |
| trigger | strict | Always renders an activatable button — there is no sentinel-only mode |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo InfiniteScroll component (feedback). Loads the next page when the end of a list scrolls into view

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

InfiniteScroll is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text-muted, --cascivo-color-border, --cascivo-color-surface-2, --cascivo-color-foreground, --cascivo-radius-md, --cascivo-ring-width, --cascivo-ring-color, --cascivo-text-ui, --cascivo-target-min-coarse

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): trigger — Always renders an activatable button — there is no sentinel-only mode
Flexible: rootMargin, onLoadMore.

Do not invent props, tokens, or global viewport media queries.
```
