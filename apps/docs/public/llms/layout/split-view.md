# SplitView

Resizable two-pane split layout with keyboard and pointer drag support.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/split-view
```

_Copy-paste only — this block/layout is not published as an importable package._

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

- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-duration-150`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `separator`
- **Keyboard:** ArrowLeft, ArrowRight

## Dependencies

- `@cascivo/core`

## Tags

layout, split, resizable, pane
