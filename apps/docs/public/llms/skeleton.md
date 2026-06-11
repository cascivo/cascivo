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

- `--cascade-color-border`
- `--cascade-color-bg-subtle`
- `--cascade-radius-sm`
- `--cascade-radius-full`
- `--cascade-radius-component`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `none`

## Dependencies

- `@cascade-ui/core`

## Tags

loading, placeholder, shimmer
