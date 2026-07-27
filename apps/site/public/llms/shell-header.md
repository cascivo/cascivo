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

| Prop                | Type                            | Required | Default           | Description                                                                              |
| ------------------- | ------------------------------- | -------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `brand`             | `ShellHeaderBrand \| ReactNode` | no       | —                 | Brand: { prefix?, name, href? } or free-form node                                        |
| `nav`               | `ShellHeaderNavItem[]`          | no       | —                 | Top nav: links ({ label, href, active?, onClick? }) or dropdown menus ({ label, items }) |
| `actions`           | `ShellHeaderAction[]`           | no       | —                 | Right-aligned global icon actions with aria-pressed                                      |
| `end`               | `ReactNode`                     | no       | —                 | Free-form trailing slot (user menu, theme switcher)                                      |
| `onMenuClick`       | `() => void`                    | no       | —                 | Renders the hamburger button; call shell.toggleSideNav                                   |
| `menuExpanded`      | `boolean`                       | no       | —                 | aria-expanded for the hamburger button                                                   |
| `skipToContentHref` | `string \| false`               | no       | `'#cascade-main'` | Skip-link target; false disables the link                                                |
| `labels`            | `ShellHeaderLabels`             | no       | —                 | i18n overrides for built-in strings                                                      |

## Object types

### `ShellHeaderAction`

A right-aligned global icon action. `actions` is a typed array of these — pass an `icon` node per item, not free-form JSX. For non-action trailing content (user menu, theme switcher) use the `end` slot instead.

| Field     | Type         | Required | Description                               |
| --------- | ------------ | -------- | ----------------------------------------- |
| `id`      | `string`     | yes      | Stable key for the action.                |
| `label`   | `string`     | yes      | Accessible label (aria-label / tooltip).  |
| `icon`    | `ReactNode`  | yes      | Icon node, e.g. an @cascivo/icons glyph.  |
| `active`  | `boolean`    | no       | Renders aria-pressed for a toggle action. |
| `onClick` | `() => void` | no       | Invoked when the action is activated.     |

### `ShellHeaderBrand`

Structured brand for the `brand` prop (or pass any ReactNode instead).

| Field    | Type     | Required | Description                                              |
| -------- | -------- | -------- | -------------------------------------------------------- |
| `prefix` | `string` | no       | Muted text before the name (e.g. an org).                |
| `name`   | `string` | yes      | Product/app name.                                        |
| `href`   | `string` | no       | Link target for the brand (routed via setLinkComponent). |

### `ShellHeaderNavItem`

A top-nav entry: either a link (`{ label, href, active?, onClick? }`) or a dropdown menu (`{ label, items: { label, href, active? }[] }`).

| Field     | Type                                                  | Required | Description                                            |
| --------- | ----------------------------------------------------- | -------- | ------------------------------------------------------ |
| `label`   | `string`                                              | yes      | Visible nav label.                                     |
| `href`    | `string`                                              | no       | Link target (link items). Routed via setLinkComponent. |
| `items`   | `{ label: string; href: string; active?: boolean }[]` | no       | Dropdown menu entries (menu items).                    |
| `active`  | `boolean`                                             | no       | Marks the current nav entry (aria-current).            |
| `onClick` | `(e: MouseEvent<HTMLAnchorElement>) => void`          | no       | Intercept navigation (e.g. a SPA section switch).      |

## Examples

### Console header

Brand with prefix, dropdown nav, global icon action

```tsx
import { Bell } from '@cascivo/icons'
;<ShellHeader
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

---

_Generated from registry v0.13.0 on 2026-07-27. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
