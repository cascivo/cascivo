# SplitView

Resizable two-pane split layout with keyboard and pointer drag support.

## Install

```bash
npx cascade add layout/split-view
```

## Category

`layout`

## Props

| Prop           | Type        | Required | Default | Description                  |
| -------------- | ----------- | -------- | ------- | ---------------------------- |
| `start`        | `ReactNode` | yes      | —       | Left pane content            |
| `end`          | `ReactNode` | yes      | —       | Right pane content           |
| `defaultRatio` | `number`    | no       | —       | Initial split ratio (0–1)    |
| `min`          | `number`    | no       | —       | Minimum ratio for start pane |
| `max`          | `number`    | no       | —       | Maximum ratio for start pane |
| `aria-label`   | `string`    | no       | —       | Label for the separator      |

## Examples

### Basic

Two-pane split with draggable divider

```tsx
<SplitView start={<FileTree />} end={<Editor />} />
```

## Design tokens

- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-duration-150`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `separator`
- **Keyboard:** ArrowLeft, ArrowRight

## Dependencies

- `@cascade-ui/core`

## Tags

layout, split, resizable, pane
