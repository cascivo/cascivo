# Breadcrumb

Shows the current page location within a navigation hierarchy

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add breadcrumb
```

Or use it from the prebuilt package without copying:

```tsx
import { Breadcrumb } from '@cascivo/react'
```

## Category

`navigation`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `{ label: string; href?: string }[]` | yes | — | The items to render. |
| `maxVisible` | `number` | no | — | When items exceed this count, collapse to the first item, an ellipsis, and the trailing items |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `ariaLabel` | `string` | no | `Breadcrumb` | Accessible label for the component. |

## Examples

### Basic

```tsx
<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Breadcrumb' }]} />
```

### Collapsed

Long trails collapse to the first item, an ellipsis, and the trailing items.

```tsx
<Breadcrumb maxVisible={3} items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Components', href: '/docs/components' }, { label: 'Breadcrumb' }]} />
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

breadcrumb, navigation, hierarchy

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
