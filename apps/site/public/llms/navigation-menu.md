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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `NavigationMenuItem[]` | yes | — | The items to render. |
| `aria-label` | `string` | no | — | Accessible label used when no visible label is present. |
| `orientation` | `'horizontal' \| 'vertical' \| 'both'` | no | — | Layout orientation of the component. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Basic

```tsx
<NavigationMenu aria-label="Main" items={[{ id: "home", label: "Home", href: "/" }, { id: "products", label: "Products", content: <ul>…</ul> }]} />
```

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
- **Keyboard:** ArrowLeft, ArrowRight, Home, End, Enter, Escape

## Dependencies

- `@cascivo/core`

## Tags

navigation, menu, flyout, site-nav

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
