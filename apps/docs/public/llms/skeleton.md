# Skeleton

Animated loading placeholder that mirrors the shape of pending content

## Install

```bash
npx cascade add skeleton
```

## Category

`display`

## Variants

- `text`
- `circle`
- `rect`

## Props

| Prop      | Type     | Required | Default | Description                                                       |
| --------- | -------- | -------- | ------- | ----------------------------------------------------------------- | ------ | --- |
| `variant` | `'text'  | 'circle' | 'rect'` | no                                                                | `text` | —   |
| `width`   | `string` | no       | —       | CSS length applied as an inline custom property                   |
| `height`  | `string` | no       | —       | CSS length applied as an inline custom property                   |
| `lines`   | `number` | no       | `1`     | Number of bars for the text variant; the last bar renders shorter |

## Examples

### Text

```tsx
<Skeleton lines={3} />
```

### Avatar

```tsx
<Skeleton variant="circle" width="3rem" height="3rem" />
```

### Image

```tsx
<Skeleton variant="rect" height="12rem" />
```

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-sm`
- `--cascivo-radius-full`
- `--cascivo-radius-component`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

loading, placeholder, shimmer
