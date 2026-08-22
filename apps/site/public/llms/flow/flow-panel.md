# FlowPanel

An absolutely-positioned slot for custom flow-canvas UI (legend, toolbar).

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowPanel } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds
```

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | no | `top-right` | Canvas edge slot the panel occupies: `top-right`, `top-center`, `top-left`, `bottom-left`, `bottom-center` or `bottom-right`. |
| `children` | `ReactNode` | no | — | Content rendered inside the component. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### A legend panel

```tsx
() => (
  <div style={{ position: 'relative', height: 160, border: '1px solid var(--cascivo-color-border)' }}>
    <FlowPanel position="top-right">Legend</FlowPanel>
  </div>
)
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

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

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
