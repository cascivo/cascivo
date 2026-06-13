# ShellHeader

Console application header: brand with prefix, dropdown nav menus, global icon actions, hamburger, skip-to-content

## Install

```bash
npx cascade add shell-header
```

## Category

`navigation`

## States

- `default`

## Props

| Prop                | Type                   | Required   | Default | Description                                            |
| ------------------- | ---------------------- | ---------- | ------- | ------------------------------------------------------ | ------------------------------------------------- |
| `brand`             | `ShellHeaderBrand      | ReactNode` | no      | —                                                      | Brand: { prefix?, name, href? } or free-form node |
| `nav`               | `ShellHeaderNavItem[]` | no         | —       | Top nav: links or dropdown menus ({ label, items })    |
| `actions`           | `ShellHeaderAction[]`  | no         | —       | Right-aligned global icon actions with aria-pressed    |
| `end`               | `ReactNode`            | no         | —       | Free-form trailing slot (user menu, theme switcher)    |
| `onMenuClick`       | `() => void`           | no         | —       | Renders the hamburger button; call shell.toggleSideNav |
| `menuExpanded`      | `boolean`              | no         | —       | aria-expanded for the hamburger button                 |
| `skipToContentHref` | `string                | false`     | no      | `'#cascade-main'`                                      | Skip-link target; false disables the link         |
| `labels`            | `ShellHeaderLabels`    | no         | —       | i18n overrides for built-in strings                    |

## Examples

### Console header

Brand with prefix, dropdown nav, global icon action

```tsx
<ShellHeader
  brand={{ prefix: 'cascade', name: 'Console', href: '/' }}
  nav={[
    { label: 'Dashboard', href: '/dash', active: true },
    { label: 'Manage', items: [{ label: 'Users', href: '/users' }] },
  ]}
  actions={[{ id: 'notifications', label: 'Notifications', icon: <Bell /> }]}
/>
```

## Design tokens

- `--cascade-shell-header-block-size`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-accent`
- `--cascade-radius-control`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `banner`
- **Keyboard:** Tab, Enter, Space, ArrowDown, ArrowUp, Escape

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

navigation, header, shell, console, menu, app-shell
