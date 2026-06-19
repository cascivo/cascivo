# Image

Image with load state, blur-up placeholder, graceful fallback, and optional zoom

## Install

```bash
npx cascivo add image
```

## Category

`display`

## States

- `loading`
- `loaded`
- `error`

## Props

| Prop            | Type      | Required | Default | Description                                               |
| --------------- | --------- | -------- | ------- | --------------------------------------------------------- | ------- | --- | ---- | --- |
| `src`           | `string`  | no       | —       | —                                                         |
| `alt`           | `string`  | no       | —       | —                                                         |
| `fallbackSrc`   | `string`  | no       | —       | Image shown if src fails to load                          |
| `width`         | `string   | number`  | no      | —                                                         | —       |
| `height`        | `string   | number`  | no      | —                                                         | —       |
| `radius`        | `'none'   | 'sm'     | 'md'    | 'lg'                                                      | 'full'` | no  | `md` | —   |
| `zoom`          | `boolean` | no       | `false` | —                                                         |
| `removeWrapper` | `boolean` | no       | `false` | Render a bare <img> with no wrapper, placeholder, or zoom |
| `isBlurred`     | `boolean` | no       | `false` | —                                                         |

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
