# Sheet

Slide-in panel from any edge, using popover=manual and @starting-style animations

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add sheet
```

Or use it from the prebuilt package without copying:

```tsx
import { Sheet } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop      | Type              | Required | Default | Description |
| --------- | ----------------- | -------- | ------- | ----------- | --- | ----- | --- |
| `open`    | `boolean`         | yes      | —       | —           |
| `onClose` | `() => void`      | yes      | —       | —           |
| `title`   | `React.ReactNode` | no       | —       | —           |
| `side`    | `'start'          | 'end'    | 'top'   | 'bottom'`   | no  | `end` | —   |

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape, Tab, Shift+Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, drawer, panel, slide
