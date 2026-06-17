# Carousel

Scroll-snap slide deck with previous/next controls and dot indicators

## Install

```bash
npx cascivo add carousel
```

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | no | — | Slides as children |
| `slides` | `ReactNode[]` | no | — | Slides as an array |
| `index` | `number` | no | — | Controlled active index |
| `defaultIndex` | `number` | no | `0` | — |
| `onIndexChange` | `(index: number) => void` | no | — | — |
| `loop` | `boolean` | no | `false` | — |

## Examples

### Basic

```tsx
<Carousel>
  <img src="/1.jpg" alt="" />
  <img src="/2.jpg" alt="" />
</Carousel>
```

### Looping with array

```tsx
<Carousel loop slides={[<Slide1 />, <Slide2 />, <Slide3 />]} />
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** ArrowLeft, ArrowRight, Home, End

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

slider, gallery, slideshow, deck, scroll-snap
