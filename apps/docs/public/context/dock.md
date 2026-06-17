# Dock

**Category:** navigation  
**Description:** Fixed bottom navigation bar for mobile app shells with up to 5 items

## When to use

- Mobile app-shell navigation with 3–5 top-level destinations
- When the primary navigation must be thumb-reachable on small screens

## When NOT to use

- Desktop navigation — the dock hides at the lg breakpoint (64rem)
- More than 5 items — labels become unreadable and tap targets too small
- Secondary or contextual navigation — use Tabs or SideNav instead

## Anti-patterns

### Tap targets become too small and labels collide on narrow screens

**Bad:** `Putting more than 5 items in the Dock`  
**Good:** `Use an overflow menu or drawer for additional destinations`  
**Why:** Tap targets become too small and labels collide on narrow screens

## Related components

- **SideNav** (alternative): SideNav is the desktop equivalent for primary navigation
- **Tabs** (alternative): Tabs are for in-page section switching, not app-level navigation

## Accessibility rationale

Wrapped in <nav> with aria-label; active item carries aria-current="page"; renders as <a> for href items and <button> for onClick items to preserve native semantics

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `DockItem[]` | Yes | — | Navigation items, each with a label, icon, and optional href or onClick |
| `activeIndex` | `number` | No | — | Index of the currently active item (0-based) |
| `className` | `string` | No | — | — |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-text-muted`
- `--cascivo-border-subtle`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-ease-out`
- `--cascivo-target-min-coarse`
- `--cascivo-z-dock`

## Examples

### Basic mobile dock

Fixed bottom navigation for a mobile app shell

```jsx
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

```jsx
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

## Boundaries

| Area | Level | Note |
|------|-------|------|
| item element | flexible | Renders <a> when href is provided, <button> otherwise — no wrapper needed |
| visibility | strict | Hidden at 64rem (lg) via display:none — not configurable to preserve mobile-only intent |
