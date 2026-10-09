# Skeleton

Animated loading placeholder that mirrors the shape of pending content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add skeleton
```

Or use it from the prebuilt package without copying:

```tsx
import { Skeleton } from '@cascivo/react'
```

## Category

`display`

## Variants

- `text`
- `circle`
- `rect`

## Props

| Prop      | Type                           | Required | Default | Description                                                                                                           |
| --------- | ------------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `variant` | `'text' \| 'circle' \| 'rect'` | no       | `text`  | Shape of the placeholder: `text` (stacked lines), `circle` (an avatar), `rect` (a block).                             |
| `width`   | `string`                       | no       | —       | CSS length applied as an inline custom property                                                                       |
| `height`  | `string`                       | no       | —       | CSS length applied as an inline custom property                                                                       |
| `lines`   | `number`                       | no       | `1`     | Number of bars for the text variant; the last bar renders shorter                                                     |
| `ai`      | `boolean`                      | no       | `false` | Tints the placeholder and its sheen with the AI hue, marking content that an AI is generating (Carbon’s AI skeleton). |

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

### AI-generated content

```tsx
<Skeleton ai lines={3} />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-sm`
- `--cascivo-radius-full`
- `--cascivo-radius-component`
- `--cascivo-color-ai-subtle`
- `--cascivo-color-ai-sheen`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

loading, placeholder, shimmer, ai

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
