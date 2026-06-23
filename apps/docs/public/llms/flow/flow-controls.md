# FlowControls

Zoom in / out / fit-view controls for a flow canvas — real, i18n-labeled buttons.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-controls
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop          | Type                 | Required    | Default       | Description     |
| ------------- | -------------------- | ----------- | ------------- | --------------- | --- | ------------- | --- |
| `position`    | `'top-left'          | 'top-right' | 'bottom-left' | 'bottom-right'` | no  | `bottom-left` | —   |
| `showZoom`    | `boolean`            | no          | `true`        | —               |
| `showFitView` | `boolean`            | no          | `true`        | —               |
| `onZoomIn`    | `() => void`         | no          | —             | —               |
| `onZoomOut`   | `() => void`         | no          | —             | —               |
| `onFitView`   | `() => void`         | no          | —             | —               |
| `labels`      | `FlowControlsLabels` | no          | —             | —               |
| `className`   | `string`             | no          | —             | —               |

## Examples

### Canvas controls

```tsx
;() => (
  <div
    style={{ position: 'relative', height: 200, border: '1px solid var(--cascivo-color-border)' }}
  >
    <FlowControls onZoomIn={() => {}} onZoomOut={() => {}} onFitView={() => {}} />
  </div>
)
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `group`
- **Keyboard:** Tab (focus), Enter/Space (activate)

## Dependencies

- `@cascivo/core`

## Tags

flow, controls, zoom, chrome
