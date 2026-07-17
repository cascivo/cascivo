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

| Name          | Type         | Required | Default | Description                                                             |
| ------------- | ------------ | -------- | ------- | ----------------------------------------------------------------------- |
| `items`       | `DockItem[]` | Yes      | —       | Navigation items, each with a label, icon, and optional href or onClick |
| `activeIndex` | `number`     | No       | —       | Index of the currently active item (0-based)                            |
| `className`   | `string`     | No       | —       | Additional CSS class names merged onto the root element.                |

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

| Area         | Level    | Note                                                                                    |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| item element | flexible | Renders <a> when href is provided, <button> otherwise — no wrapper needed               |
| visibility   | strict   | Hidden at 64rem (lg) via display:none — not configurable to preserve mobile-only intent |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Dock component (navigation). Fixed bottom navigation bar for mobile app shells with up to 5 items

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Dock is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-accent, --cascivo-color-text-muted, --cascivo-border-subtle, --cascivo-ring-width, --cascivo-ring-color, --cascivo-ease-out, --cascivo-target-min-coarse, --cascivo-z-dock

Accessibility: role "navigation", WCAG 2.2-AA, keyboard: Tab/Enter. Keep it AA.

Do not change (strict): visibility — Hidden at 64rem (lg) via display:none — not configurable to preserve mobile-only intent
Flexible: item element.

Do not invent props, tokens, or global viewport media queries.
```
