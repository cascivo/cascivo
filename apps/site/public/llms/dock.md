# Dock

Fixed bottom navigation bar for mobile app shells with up to 5 items

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add dock
```

Or use it from the prebuilt package without copying:

```tsx
import { Dock } from '@cascivo/react'
```

## Category

`navigation`

## States

- `default`
- `active`

## Props

| Prop          | Type         | Required | Default | Description                                                                                                         |
| ------------- | ------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`   | `string`     | no       | —       | Accessible label for the dock navigation; defaults to the built-in i18n string. Not rendered — screen readers only. |
| `items`       | `DockItem[]` | yes      | —       | Navigation items, each with a label, icon, and optional href or onClick                                             |
| `activeIndex` | `number`     | no       | —       | Index of the currently active item (0-based)                                                                        |
| `className`   | `string`     | no       | —       | Additional CSS class names merged onto the root element.                                                            |

## Examples

### Basic mobile dock

Fixed bottom navigation for a mobile app shell

```tsx
<Dock
  activeIndex={0}
  items={[
    { label: 'Home', icon: '🏠', onClick: () => navigate('/') },
    { label: 'Search', icon: '🔍', onClick: () => navigate('/search') },
    { label: 'Profile', icon: '👤', onClick: () => navigate('/profile') },
  ]}
/>
```

### With hrefs

Link-based dock items for standard navigation

```tsx
<Dock
  activeIndex={1}
  items={[
    { label: 'Feed', icon: '📰', href: '/feed' },
    { label: 'Explore', icon: '🌐', href: '/explore' },
    { label: 'Notifications', icon: '🔔', href: '/notifications' },
    { label: 'Profile', icon: '👤', href: '/profile' },
  ]}
/>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-text-muted`
- `--cascivo-border-subtle`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-ease-out`
- `--cascivo-target-min-coarse`
- `--cascivo-z-dock`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

dock, tab-bar, bottom-nav, mobile, navigation, app-shell

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
