# Carousel

Scroll-snap slide deck with previous/next controls and dot indicators

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add carousel
```

Or use it from the prebuilt package without copying:

```tsx
import { Carousel } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop            | Type                      | Required | Default | Description                                                |
| --------------- | ------------------------- | -------- | ------- | ---------------------------------------------------------- |
| `labels`        | `CarouselLabels`          | no       | —       | Overrides for the component’s user-visible strings (i18n). |
| `children`      | `ReactNode`               | no       | —       | Slides as children                                         |
| `slides`        | `ReactNode[]`             | no       | —       | Slides as an array                                         |
| `index`         | `number`                  | no       | —       | Controlled active index                                    |
| `defaultIndex`  | `number`                  | no       | `0`     | The initial slide index when uncontrolled.                 |
| `onIndexChange` | `(index: number) => void` | no       | —       | Called with the new slide index when it changes.           |
| `loop`          | `boolean`                 | no       | `false` | When true, navigation wraps around from end to start.      |

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

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
