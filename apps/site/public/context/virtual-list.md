# VirtualList

**Category:** display  
**Description:** Renders only the rows inside the viewport, so list length costs no extra DOM

## When to use

- Lists long enough that rendering every row costs noticeable time or memory (roughly a thousand rows and up)
- Log, result and feed views where the collection is already fully in memory
- Any list whose length is unbounded and rows are a uniform height

## When NOT to use

- Short lists — the machinery costs more than it saves; use List
- Rows of varying height, which this component cannot position without measuring
- Content that must be findable with the browser’s in-page search, which cannot see unrendered rows

## Anti-patterns

### Positions are arithmetic, not measured, so a mismatch makes rows overlap or leave gaps that grow with scroll depth

**Bad:** `Passing rows whose real height differs from `itemHeight``  
**Good:** `Fix the row height in CSS to match `itemHeight` exactly`  
**Why:** Positions are arithmetic, not measured, so a mismatch makes rows overlap or leave gaps that grow with scroll depth

### `height` drives the visible row count, which cannot be derived from a relative length without measuring

**Bad:** `Reaching for a percentage or `dvh` viewport height`  
**Good:** `Measure the container and pass a px number`  
**Why:** `height` drives the visible row count, which cannot be derived from a relative length without measuring

### renderItem runs for every row entering the window, including on scroll-back, so a fetch there fires repeatedly

**Bad:** `Fetching the next page inside `renderItem``  
**Good:** `Pair with InfiniteScroll, or load before passing `items``  
**Why:** renderItem runs for every row entering the window, including on scroll-back, so a fetch there fires repeatedly

## Related components

- **List** (alternative): Plain list when the collection is small enough to render whole
- **InfiniteScroll** (pairs-with): Loads further pages into the collection this list renders
- **DataTable** (alternative): Columnar data with sorting and selection rather than a flat row list

## Accessibility rationale

The viewport is a role="list" and each rendered row is a role="listitem" carrying aria-setsize and aria-posinset for the entire collection, so assistive technology announces "row 3 of 10000" rather than the size of the rendered window — the defect that makes naive virtualization unusable with a screen reader. The viewport is also in the tab order, because rows hold plain content rather than focusable controls and a scroll container with nothing focusable inside it is otherwise unreachable without a pointer; once focused it takes the browser’s native arrow, Page and Home/End scrolling. Rows are placed with transform rather than by mutating layout, so scrolling stays on the compositor. Because unrendered rows are absent from the DOM, browser in-page search cannot reach them; provide a real filter or search control alongside any virtualized list, and prefer a non-virtualized list when the collection is small.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `Item[]` | Yes | — | The full collection; only the visible window is rendered |
| `itemHeight` | `number` | Yes | — | Fixed row height in px — every row must be this tall |
| `height` | `number` | Yes | — | Height of the scrolling viewport, in px — not a CSS length, because the visible row count is computed from it |
| `renderItem` | `(item: Item, index: number) => React.ReactNode` | Yes | — | Renders one row |
| `overscan` | `number` | No | 3 | Extra rows rendered above and below the visible window, to cover fast scrolling. |
| `ariaLabel` | `string` | No | — | Accessible label for the list; label it when the list stands alone |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-accent`

## Examples

### Basic

Ten thousand rows cost the same DOM as ten.

```jsx
<VirtualList
  items={Array.from({ length: 10000 }, (_, i) => i)}
  itemHeight={40}
  height={320}
  ariaLabel="Results"
  renderItem={(n) => <span>Row {n + 1}</span>}
/>
```

### Smoother fast scrolling

A larger overscan trades DOM nodes for fewer blank frames when flinging.

```jsx
<VirtualList items={rows} itemHeight={40} height={320} overscan={10} renderItem={renderRow} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| overscan | flexible | Rows rendered beyond the window (default 3) |
| itemHeight | strict | Fixed and uniform — variable row heights are not supported |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo VirtualList component (display). Renders only the rows inside the viewport, so list length costs no extra DOM

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

VirtualList is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent

Accessibility: role "list", WCAG 2.2-AA, keyboard: Tab/ArrowUp/ArrowDown/PageUp/PageDown/Home/End. Keep it AA.

Do not change (strict): itemHeight — Fixed and uniform — variable row heights are not supported
Flexible: overscan.

Do not invent props, tokens, or global viewport media queries.
```
