# NavigationMenu

Site navigation bar with links and dropdown flyout panels

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add navigation-menu
```

Or use it from the prebuilt package without copying:

```tsx
import { NavigationMenu } from '@cascivo/react'
```

## Category

`navigation`

## States

- `closed`
- `open`

## Props

| Prop          | Type                                   | Required | Default      | Description                                                                                                                                       |
| ------------- | -------------------------------------- | -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `string`                               | no       | —            | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only.    |
| `ariaLabel`   | `string`                               | no       | —            | Invisible accessible name. The catalog convention; `aria-label` is accepted as an alias for the DOM spelling. Not rendered — screen readers only. |
| `items`       | `NavigationMenuItem[]`                 | yes      | —            | The items to render.                                                                                                                              |
| `aria-label`  | `string`                               | no       | —            | Accessible label used when no visible label is present.                                                                                           |
| `orientation` | `'horizontal' \| 'vertical' \| 'both'` | no       | `horizontal` | Which arrow keys move focus, and the axis the items lay out on: `horizontal` (Left/Right), `vertical` (Up/Down), or `both` (all four).            |
| `className`   | `string`                               | no       | —            | Additional CSS class names merged onto the root element.                                                                                          |

## Examples

### Basic

```tsx
<NavigationMenu
  aria-label="Main"
  items={[
    { id: 'home', label: 'Home', href: '/' },
    { id: 'products', label: 'Products', content: <ul>…</ul> },
  ]}
/>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** ArrowLeft, ArrowRight, Home, End, Enter, Space, Escape

## Dependencies

- `@cascivo/core`

## Tags

navigation, menu, flyout, site-nav

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
