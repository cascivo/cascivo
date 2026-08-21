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

| Prop            | Type                         | Required | Default      | Description                                                                                                                                  |
| --------------- | ---------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`     | `string`                     | no       | —            | Alias of `label` — the same invisible accessible name under the catalog spelling. Neither is deprecated. Not rendered — screen readers only. |
| `label`         | `string`                     | no       | —            | Accessible label for the resize handle. Not rendered — screen readers only.                                                                  |
| `children`      | `ReactNode`                  | yes      | —            | Exactly two panes                                                                                                                            |
| `orientation`   | `'horizontal' \| 'vertical'` | no       | `horizontal` | Layout orientation of the component.                                                                                                         |
| `defaultRatio`  | `number`                     | no       | `0.5`        | The initial split ratio when uncontrolled.                                                                                                   |
| `ratio`         | `number`                     | no       | —            | Controlled ratio (0–1)                                                                                                                       |
| `minRatio`      | `number`                     | no       | `0.1`        | Minimum allowed split ratio.                                                                                                                 |
| `maxRatio`      | `number`                     | no       | `0.9`        | Maximum allowed split ratio.                                                                                                                 |
| `onRatioChange` | `(ratio: number) => void`    | no       | —            | Called with the new split ratio when it changes.                                                                                             |

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

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

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

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
