# AspectRatio

**Category:** layout  
**Description:** Constrains content to a fixed width-to-height ratio

## When to use

- Reserving a stable box for media that loads asynchronously, avoiding layout shift
- Embedding responsive iframes (video, maps) at a known proportion
- Keeping thumbnails or covers uniform across a grid

## When NOT to use

- Content whose height should grow with text — let it size naturally
- A single fixed-pixel image where width and height are already known

## Anti-patterns

### A fixed ratio clips or distorts content that needs variable height

**Bad:** `Wrapping text content that must expand to fit its lines`  
**Good:** `Reserve AspectRatio for media; let prose flow at its intrinsic height`  
**Why:** A fixed ratio clips or distorts content that needs variable height

## Related components

- **Card** (contained-by): Commonly holds a cover image inside a Card media region

## Accessibility rationale

Purely presentational wrapper with no role; the inner media element carries its own semantics and alt text

## Props

| Name       | Type        | Required | Default | Description                                                          |
| ---------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| `ratio`    | `number`    | No       | 16 / 9  | Width-to-height ratio applied via the CSS aspect-ratio property      |
| `children` | `ReactNode` | No       | —       | Content to fill the ratio box (typically an image, video, or iframe) |

## Tokens

- `--cascivo-aspect-ratio`

## Examples

### Image at 16:9

```jsx
<AspectRatio ratio={16 / 9}>
  <img src="/cover.jpg" alt="Cover" />
</AspectRatio>
```

### Square

```jsx
<AspectRatio ratio={1}>
  <img src="/avatar.jpg" alt="Avatar" />
</AspectRatio>
```

## Boundaries

| Area         | Level    | Note                                                             |
| ------------ | -------- | ---------------------------------------------------------------- |
| ratio        | flexible | Any positive number; common values are 16/9, 4/3, 1, 3/2         |
| child sizing | strict   | The single child is stretched to fill; provide one media element |
