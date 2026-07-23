# FlowPanel

An absolutely-positioned slot for custom flow-canvas UI (legend, toolbar).

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowPanel } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## Props

| Prop        | Type                                                                                              | Required | Default     | Description                                              |
| ----------- | ------------------------------------------------------------------------------------------------- | -------- | ----------- | -------------------------------------------------------- |
| `position`  | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | no       | `top-right` | Position of the component.                               |
| `children`  | `ReactNode`                                                                                       | no       | —           | Content rendered inside the component.                   |
| `className` | `string`                                                                                          | no       | —           | Additional CSS class names merged onto the root element. |

## Examples

### A legend panel

```tsx
;() => (
  <div
    style={{ position: 'relative', height: 160, border: '1px solid var(--cascivo-color-border)' }}
  >
    <FlowPanel position="top-right">Legend</FlowPanel>
  </div>
)
```

## Design tokens

- `--cascivo-space-3`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `group`

## Dependencies

- `@cascivo/core`

## Tags

flow, panel, slot, chrome

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
