# SideNav

Collapsible sidebar navigation with optional icons and one level of grouping

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add side-nav
```

Or use it from the prebuilt package without copying:

```tsx
import { SideNav } from '@cascivo/react'
```

## Category

`navigation`

## States

- `expanded`
- `collapsed`

## Props

| Prop                 | Type                           | Required | Default               | Description                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------ | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `groups`             | `SideNavGroup[]`               | no       | —                     | Grouped navigation items rendered under optional group labels.                                                                                                                                                                                                                                            |
| `showCollapseToggle` | `boolean`                      | no       | —                     | Show the collapse/expand toggle control.                                                                                                                                                                                                                                                                  |
| `items`              | `SideNavItem[]`                | yes      | —                     | { label, href?, icon?, active?, items?, onClick?, disabled?, tone?, trailing?, render? } — an onClick-only item renders a focusable <button>; nested items render expandable menus (links, action sub-items with onSelect/selected, separators, labels); render() is an alignment-preserving escape hatch |
| `collapsed`          | `boolean`                      | no       | —                     | Controlled collapsed state (rail mode)                                                                                                                                                                                                                                                                    |
| `defaultCollapsed`   | `boolean`                      | no       | `false`               | Whether the rail is collapsed on first render (uncontrolled).                                                                                                                                                                                                                                             |
| `onCollapsedChange`  | `(collapsed: boolean) => void` | no       | —                     | Called with the new collapsed state when it changes.                                                                                                                                                                                                                                                      |
| `ariaLabel`          | `string`                       | no       | `Side navigation`     | Accessible label for the component.                                                                                                                                                                                                                                                                       |
| `collapseLabel`      | `string`                       | no       | `Collapse navigation` | Accessible label for the collapse control.                                                                                                                                                                                                                                                                |
| `expandLabel`        | `string`                       | no       | `Expand navigation`   | Accessible label for the expand control.                                                                                                                                                                                                                                                                  |
| `expandOnHover`      | `boolean`                      | no       | `false`               | Widens the rail as an overlay on hover/focus-within; suppresses tooltips/flyouts                                                                                                                                                                                                                          |
| `header`             | `ReactNode`                    | no       | —                     | Content rendered above the items, inside the item padding context (e.g. app-context pickers)                                                                                                                                                                                                              |
| `footer`             | `ReactNode`                    | no       | —                     | Content rendered above the collapse toggle (e.g. version string, user info)                                                                                                                                                                                                                               |
| `className`          | `string`                       | no       | —                     | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                  |

## Examples

### Basic

```tsx
<SideNav
  items={[
    { label: 'Home', href: '/', active: true },
    { label: 'Reports', href: '/reports' },
  ]}
/>
```

### With a group

```tsx
<SideNav items={[{ label: 'Settings', items: [{ label: 'Profile', href: '/profile' }] }]} />
```

### Icon rail

Collapsed rail: icons-only with tooltips, grapheme fallback for icon-less items, flyout menus for groups

```tsx
<SideNav collapsed items={[{ label: 'Home', href: '/', icon: <Home size={16} /> }]} />
```

### Expand on hover

Rail widens as CSS overlay on hover without reflowing adjacent content

```tsx
<SideNav collapsed expandOnHover items={items} />
```

## Design tokens

- `--cascivo-sidenav-inline-size`
- `--cascivo-sidenav-rail-inline-size`
- `--cascivo-sidenav-bg`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-destructive`
- `--cascivo-color-warning`
- `--cascivo-color-success`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-motion-emphasis`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter, Space, ArrowDown, ArrowUp, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

navigation, sidebar, app-shell, collapsible

---

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
