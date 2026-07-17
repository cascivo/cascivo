# Carousel

**Category:** display  
**Description:** Scroll-snap slide deck with previous/next controls and dot indicators

## When to use

- Presenting a sequence of media or cards the user pages through one at a time
- Image galleries, onboarding decks, or featured-content rotators
- When horizontal swiping/scrolling is a natural interaction on touch devices

## When NOT to use

- Content users must compare side-by-side — show a grid instead
- Critical information that must always be visible — carousels hide most of their content

## Anti-patterns

### Auto-rotation and hidden slides reduce discoverability and accessibility of important content

**Bad:** `Auto-rotating carousel for primary navigation or key calls-to-action`  
**Good:** `A static list or grid where every item is visible`  
**Why:** Auto-rotation and hidden slides reduce discoverability and accessibility of important content

## Related components

- **Tabs** (alternative): Use tabs when sections are distinct and should be directly addressable

## Accessibility rationale

The container is a labelled region with aria-roledescription="carousel"; each slide is a labelled group ("n of total"); prev/next are real buttons and the dot indicators use roving tabindex with arrow-key navigation. Scrolling honours prefers-reduced-motion.

## Props

| Name            | Type                      | Required | Default | Description                                           |
| --------------- | ------------------------- | -------- | ------- | ----------------------------------------------------- |
| `children`      | `ReactNode`               | No       | —       | Slides as children                                    |
| `slides`        | `ReactNode[]`             | No       | —       | Slides as an array                                    |
| `index`         | `number`                  | No       | —       | Controlled active index                               |
| `defaultIndex`  | `number`                  | No       | 0       | The initial slide index when uncontrolled.            |
| `onIndexChange` | `(index: number) => void` | No       | —       | Called with the new slide index when it changes.      |
| `loop`          | `boolean`                 | No       | false   | When true, navigation wraps around from end to start. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Carousel>
  <img src="/1.jpg" alt="" />
  <img src="/2.jpg" alt="" />
</Carousel>
```

### Looping with array

```jsx
<Carousel loop slides={[<Slide1 />, <Slide2 />, <Slide3 />]} />
```

## Boundaries

| Area          | Level    | Note                                                                             |
| ------------- | -------- | -------------------------------------------------------------------------------- |
| transition    | strict   | Paging uses native CSS scroll-snap, not transform math — no custom easing config |
| slide content | flexible | Any ReactNode may be a slide; pass via children or the slides array              |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Carousel component (display). Scroll-snap slide deck with previous/next controls and dot indicators

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Carousel is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-radius-md, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "group", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/Home/End. Keep it AA.

Do not change (strict): transition — Paging uses native CSS scroll-snap, not transform math — no custom easing config
Flexible: slide content.

Do not invent props, tokens, or global viewport media queries.
```
