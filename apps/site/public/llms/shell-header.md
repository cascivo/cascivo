# ShellHeader

Console application header: brand with prefix, dropdown nav menus, global icon actions, hamburger, skip-to-content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add shell-header
```

Or use it from the prebuilt package without copying:

```tsx
import { ShellHeader } from '@cascivo/react'
```

## Category

`navigation`

## States

- `default`

## Props

| Prop                | Type                   | Required   | Default | Description                                                                              |
| ------------------- | ---------------------- | ---------- | ------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `brand`             | `ShellHeaderBrand      | ReactNode` | no      | —                                                                                        | Brand: { prefix?, name, href? } or free-form node |
| `nav`               | `ShellHeaderNavItem[]` | no         | —       | Top nav: links ({ label, href, active?, onClick? }) or dropdown menus ({ label, items }) |
| `actions`           | `ShellHeaderAction[]`  | no         | —       | Right-aligned global icon actions with aria-pressed                                      |
| `end`               | `ReactNode`            | no         | —       | Free-form trailing slot (user menu, theme switcher)                                      |
| `onMenuClick`       | `() => void`           | no         | —       | Renders the hamburger button; call shell.toggleSideNav                                   |
| `menuExpanded`      | `boolean`              | no         | —       | aria-expanded for the hamburger button                                                   |
| `skipToContentHref` | `string                | false`     | no      | `'#cascade-main'`                                                                        | Skip-link target; false disables the link         |
| `labels`            | `ShellHeaderLabels`    | no         | —       | i18n overrides for built-in strings                                                      |

## Examples

### Console header

Brand with prefix, dropdown nav, global icon action

```tsx
<ShellHeader
  brand={{ prefix: 'cascivo', name: 'Console', href: '/' }}
  nav={[
    { label: 'Dashboard', href: '/dash', active: true },
    { label: 'Manage', items: [{ label: 'Users', href: '/users' }] },
  ]}
  actions={[{ id: 'notifications', label: 'Notifications', icon: <Bell /> }]}
/>
```

## Design tokens

- `--cascivo-shell-header-block-size`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-radius-control`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `banner`
- **Keyboard:** Tab, Enter, Space, ArrowDown, ArrowUp, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

navigation, header, shell, console, menu, app-shell
