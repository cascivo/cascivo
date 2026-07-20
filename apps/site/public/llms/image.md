# Image

Image with load state, blur-up placeholder, graceful fallback, and optional zoom

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add image
```

Or use it from the prebuilt package without copying:

```tsx
import { Image } from '@cascivo/react'
```

## Category

`display`

## States

- `loading`
- `loaded`
- `error`

## Props

| Prop            | Type                                       | Required | Default | Description                                                            |
| --------------- | ------------------------------------------ | -------- | ------- | ---------------------------------------------------------------------- |
| `src`           | `string`                                   | no       | —       | Image source URL.                                                      |
| `alt`           | `string`                                   | no       | —       | Alternative text describing the image.                                 |
| `fallbackSrc`   | `string`                                   | no       | —       | Image shown if src fails to load                                       |
| `width`         | `string \| number`                         | no       | —       | Width of the component.                                                |
| `height`        | `string \| number`                         | no       | —       | Height of the component.                                               |
| `radius`        | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | no       | `md`    | Corner radius of the image ('none' \| 'sm' \| 'md' \| 'lg' \| 'full'). |
| `zoom`          | `boolean`                                  | no       | `false` | When true, zooms the image on hover.                                   |
| `removeWrapper` | `boolean`                                  | no       | `false` | Render a bare <img> with no wrapper, placeholder, or zoom              |
| `isBlurred`     | `boolean`                                  | no       | `false` | When true, renders a blurred backdrop behind the image.                |

## Examples

### Basic

```tsx
<Image src="/photo.jpg" alt="A photo" width={320} height={240} />
```

### With fallback

```tsx
<Image src="/broken.jpg" fallbackSrc="/placeholder.jpg" alt="A photo" />
```

### Blurred placeholder

```tsx
<Image src="/photo.jpg" alt="A photo" isBlurred />
```

### Hover zoom

```tsx
<Image src="/photo.jpg" alt="A photo" zoom />
```

## Design tokens

- `--cascivo-radius-none`
- `--cascivo-radius-sm`
- `--cascivo-radius-md`
- `--cascivo-radius-lg`
- `--cascivo-radius-full`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-space-12`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/core`

## Tags

image, media, display, loading

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
