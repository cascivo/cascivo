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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | no | `bottom-left` | Position of the component. |
| `showZoom` | `boolean` | no | `true` | When true, shows the zoom-in/zoom-out buttons. |
| `showFitView` | `boolean` | no | `true` | When true, shows the fit-to-view button. |
| `onZoomIn` | `() => void` | no | — | Called when the zoom-in control is activated. |
| `onZoomOut` | `() => void` | no | — | Called when the zoom-out control is activated. |
| `onFitView` | `() => void` | no | — | Called when the fit-to-view control is activated. |
| `labels` | `FlowControlsLabels` | no | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Canvas controls

```tsx
() => (
  <div style={{ position: 'relative', height: 200, border: '1px solid var(--cascivo-color-border)' }}>
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
