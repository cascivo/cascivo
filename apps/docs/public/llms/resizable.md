# Resizable

Two-pane splitter whose divider can be dragged or keyboard-nudged to reallocate space

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add resizable
```

Or use it from the prebuilt package without copying:

```tsx
import { Resizable } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop            | Type                      | Required    | Default | Description            |
| --------------- | ------------------------- | ----------- | ------- | ---------------------- | --- |
| `children`      | `ReactNode`               | yes         | —       | Exactly two panes      |
| `orientation`   | `'horizontal'             | 'vertical'` | no      | `horizontal`           | —   |
| `defaultRatio`  | `number`                  | no          | `0.5`   | —                      |
| `ratio`         | `number`                  | no          | —       | Controlled ratio (0–1) |
| `minRatio`      | `number`                  | no          | `0.1`   | —                      |
| `maxRatio`      | `number`                  | no          | `0.9`   | —                      |
| `onRatioChange` | `(ratio: number) => void` | no          | —       | —                      |

## Examples

### Horizontal split

```tsx
<Resizable>
  <Editor />
  <Preview />
</Resizable>
```

### Vertical with bounds

```tsx
<Resizable orientation="vertical" defaultRatio={0.3} minRatio={0.2} maxRatio={0.8}>
  <Toolbar />
  <Canvas />
</Resizable>
```

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `separator`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

splitter, panes, layout, resize, divider
