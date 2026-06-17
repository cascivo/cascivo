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

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | No | — | Slides as children |
| `slides` | `ReactNode[]` | No | — | Slides as an array |
| `index` | `number` | No | — | Controlled active index |
| `defaultIndex` | `number` | No | 0 | — |
| `onIndexChange` | `(index: number) => void` | No | — | — |
| `loop` | `boolean` | No | false | — |

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

| Area | Level | Note |
|------|-------|------|
| transition | strict | Paging uses native CSS scroll-snap, not transform math — no custom easing config |
| slide content | flexible | Any ReactNode may be a slide; pass via children or the slides array |
