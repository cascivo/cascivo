# Dock

Fixed bottom navigation bar for mobile app shells with up to 5 items

## Install

```bash
npx cascivo add dock
```

## Category

`navigation`

## States

- `default`
- `active`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `DockItem[]` | yes | — | Navigation items, each with a label, icon, and optional href or onClick |
| `activeIndex` | `number` | no | — | Index of the currently active item (0-based) |
| `className` | `string` | no | — | — |

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

## Tags

dock, tab-bar, bottom-nav, mobile, navigation, app-shell
