# LargeTitleHeader

**Category:** navigation  
**Description:** Scrolling region whose large title collapses into a compact sticky bar as it scrolls

## When to use

- A scrolling screen that should keep its title reachable after the heading scrolls away
- Mobile and tablet layouts following the platform convention of a large title that collapses
- Any page where a persistent back control or actions must stay pinned while content scrolls

## When NOT to use

- A site-wide navigation bar with links and a brand — use Header
- An application chrome header spanning a sidebar layout — use ShellHeader
- A screen whose scroll container is owned by the app shell or router — this component owns its own

## Anti-patterns

### The component is the scroll container at block-size 100%; with an auto-height parent it never scrolls, so the title never collapses

**Bad:** `Rendering it inside a parent with no resolved height`  
**Good:** `Give the parent a height (a grid/flex track, a dvh value, or 100% of a sized ancestor)`  
**Why:** The component is the scroll container at block-size 100%; with an auto-height parent it never scrolls, so the title never collapses

### The component already renders a real h1–h3; repeating it duplicates the heading in the accessibility tree

**Bad:** `Passing the page heading again as the first child of the content below`  
**Good:** `Let the component own the heading`  
**Why:** The component already renders a real h1–h3; repeating it duplicates the heading in the accessibility tree

## Related components

- **Header** (alternative): Site-wide banner with brand, links and actions rather than a page title
- **ShellHeader** (alternative): Application chrome for a shell layout rather than a scrolling page
- **Dock** (pairs-with): Bottom navigation for the same mobile app shell

## Accessibility rationale

The component owns the scroll container, so the sticky bar and the scroll timeline cannot be broken by surrounding markup. The title is a real h1–h3 in normal flow, so heading order and document outline are unaffected; the copy mirrored into the sticky bar is aria-hidden so screen readers announce the title exactly once. The collapse is a CSS scroll-driven animation with no client JavaScript, so the header is complete in server-rendered HTML and nothing depends on hydration. Where animation-timeline is unsupported the mirror stays hidden and the header degrades to a sticky bar above a heading — no content is lost. Under prefers-reduced-motion the reveal snaps with steps(1, jump-end) instead of interpolating. The bar clears the coarse-pointer target floor and pads for the top safe-area inset.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | — | The page title, rendered as the large heading and mirrored in the compact bar |
| `children` | `React.ReactNode` | Yes | — | Content rendered inside the component. |
| `leading` | `React.ReactNode` | No | — | Leading slot of the compact bar — typically a back control |
| `actions` | `React.ReactNode` | No | — | Trailing slot of the compact bar — typically icon buttons |
| `level` | `1 \| 2 \| 3` | No | 1 | Heading level for the title, mapping to h1–h3. |
| `collapseDistance` | `number` | No | 48 | Scroll distance (px) over which the large title collapses into the bar. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-foreground`
- `--cascivo-border-subtle`
- `--cascivo-text-ui`
- `--cascivo-text-heading-lg`
- `--cascivo-font-semibold`
- `--cascivo-font-bold`
- `--cascivo-leading-tight`
- `--cascivo-target-min-coarse`
- `--cascivo-z-raised`

## Examples

### Basic

The component owns the scroll container; give it a parent with a height.

```jsx
<LargeTitleHeader title="Library">
  <List>
    <ListItem>Recently Added</ListItem>
    <ListItem>Artists</ListItem>
    <ListItem>Albums</ListItem>
  </List>
</LargeTitleHeader>
```

### With a back control and actions

Both slots stay in the compact bar and never scroll away.

```jsx
<LargeTitleHeader
  title="Downloads"
  leading={<IconButton label="Back" onClick={goBack}>←</IconButton>}
  actions={<IconButton label="Sort">⇅</IconButton>}
>
  <FileList files={files} />
</LargeTitleHeader>
```

### Longer collapse

Stretches the reveal over more scroll distance.

```jsx
<LargeTitleHeader title="Recently Played" collapseDistance={96}>
  <TrackList tracks={tracks} />
</LargeTitleHeader>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| collapseDistance | flexible | Scroll distance over which the title collapses (default 48px) |
| level | flexible | Heading level is caller-controlled so the page outline stays correct |
| collapse mechanism | strict | Always a CSS scroll-driven animation — there is no JavaScript fallback path |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo LargeTitleHeader component (navigation). Scrolling region whose large title collapses into a compact sticky bar as it scrolls

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

LargeTitleHeader is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-foreground, --cascivo-border-subtle, --cascivo-text-ui, --cascivo-text-heading-lg, --cascivo-font-semibold, --cascivo-font-bold, --cascivo-leading-tight, --cascivo-target-min-coarse, --cascivo-z-raised

Accessibility: role "heading", WCAG 2.2-AA. Keep it AA.

Do not change (strict): collapse mechanism — Always a CSS scroll-driven animation — there is no JavaScript fallback path
Flexible: collapseDistance, level.

Do not invent props, tokens, or global viewport media queries.
```
