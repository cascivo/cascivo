# SideNav

Collapsible sidebar navigation with optional icons and one level of grouping

## Install

```bash
npx cascade add side-nav
```

## Category

`navigation`

## States

- `expanded`
- `collapsed`

## Props

| Prop                | Type                           | Required | Default               | Description                                                                                    |
| ------------------- | ------------------------------ | -------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `items`             | `SideNavItem[]`                | yes      | —                     | { label, href?, icon?, active?, items? } — items with nested items render as expandable groups |
| `collapsed`         | `boolean`                      | no       | —                     | Controlled collapsed state (rail mode)                                                         |
| `defaultCollapsed`  | `boolean`                      | no       | `false`               | —                                                                                              |
| `onCollapsedChange` | `(collapsed: boolean) => void` | no       | —                     | —                                                                                              |
| `ariaLabel`         | `string`                       | no       | `Side navigation`     | —                                                                                              |
| `collapseLabel`     | `string`                       | no       | `Collapse navigation` | —                                                                                              |
| `expandLabel`       | `string`                       | no       | `Expand navigation`   | —                                                                                              |
| `expandOnHover`     | `boolean`                      | no       | `false`               | Widens the rail as an overlay on hover/focus-within; suppresses tooltips/flyouts               |
| `footer`            | `ReactNode`                    | no       | —                     | Content rendered above the collapse toggle (e.g. version string, user info)                    |
| `className`         | `string`                       | no       | —                     | —                                                                                              |

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

- `--cascade-sidenav-inline-size`
- `--cascade-sidenav-rail-inline-size`
- `--cascade-sidenav-bg`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-bg-subtle`
- `--cascade-color-accent`
- `--cascade-color-accent-subtle`
- `--cascade-focus-ring`
- `--cascade-motion-enter`
- `--cascade-motion-exit`
- `--cascade-motion-emphasis`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter, Space, ArrowDown, ArrowUp, Escape

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

navigation, sidebar, app-shell, collapsible
