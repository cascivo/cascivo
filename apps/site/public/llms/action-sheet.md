# ActionSheet

Bottom-rising sheet of discrete actions (iOS action-sheet pattern) with a Cancel button

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add action-sheet
```

Or use it from the prebuilt package without copying:

```tsx
import { ActionSheet } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop           | Type                                  | Required | Default | Description                                                                   |
| -------------- | ------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `open`         | `boolean`                             | no       | —       | Whether the component is open (controlled).                                   |
| `defaultOpen`  | `boolean`                             | no       | —       | Whether the component is open on first render (uncontrolled).                 |
| `onOpenChange` | `(open: boolean) => void`             | no       | —       | Called with the next open state when it changes.                              |
| `actions`      | `ActionSheetAction[]`                 | yes      | —       | Choices, each with a label, onSelect, and optional destructive/disabled flags |
| `title`        | `React.ReactNode`                     | no       | —       | Title text for the component.                                                 |
| `description`  | `React.ReactNode`                     | no       | —       | Supporting description text.                                                  |
| `showCancel`   | `boolean`                             | no       | `true`  | When true, shows a cancel button below the actions.                           |
| `labels`       | `{ cancel?: string; label?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).                    |
| `className`    | `string`                              | no       | —       | Additional CSS class names merged onto the root element.                      |

## Examples

### Basic

```tsx
<ActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Share photo"
  actions={[
    { label: 'Copy link', onSelect: copyLink },
    { label: 'Delete', onSelect: remove, destructive: true },
  ]}
/>
```

### Without cancel button

Escape and outside press still dismiss the sheet.

```tsx
<ActionSheet defaultOpen showCancel={false} actions={[{ label: 'Archive', onSelect: archive }]} />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-z-overlay`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowUp, ArrowDown, Home, End, Enter, Space, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, action-sheet, menu, mobile, sheet

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
