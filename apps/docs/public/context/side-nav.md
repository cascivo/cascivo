# SideNav

**Category:** navigation  
**Description:** Collapsible sidebar navigation with optional icons and one level of grouping

## When to use

- Persistent primary navigation along the side of an app shell
- Grouping nav items one level deep with collapsible groups
- Saving space with a collapsible icon rail (collapsed / expandOnHover)

## When NOT to use

- Top-level horizontal navigation — use Header or ShellHeader nav
- A transient contextual menu — use Dropdown

## Anti-patterns

### Deep nesting in a sidebar is hard to scan and the component supports only one level by design

**Bad:** `Nesting nav groups more than one level deep`  
**Good:** `Flatten to a single level of grouping, or split into sections`  
**Why:** Deep nesting in a sidebar is hard to scan and the component supports only one level by design

## Related components

- **ShellHeader** (pairs-with): The header hamburger toggles SideNav collapse

## Accessibility rationale

role="navigation" with an aria-label names the region; the collapse toggle has an explicit expand/collapse label, groups expose aria-expanded, and the collapsed rail provides tooltips/flyouts so icon-only items remain identifiable

## Props

| Name                | Type                           | Required | Default             | Description                                                                                    |
| ------------------- | ------------------------------ | -------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `items`             | `SideNavItem[]`                | Yes      | —                   | { label, href?, icon?, active?, items? } — items with nested items render as expandable groups |
| `collapsed`         | `boolean`                      | No       | —                   | Controlled collapsed state (rail mode)                                                         |
| `defaultCollapsed`  | `boolean`                      | No       | false               | —                                                                                              |
| `onCollapsedChange` | `(collapsed: boolean) => void` | No       | —                   | —                                                                                              |
| `ariaLabel`         | `string`                       | No       | Side navigation     | —                                                                                              |
| `collapseLabel`     | `string`                       | No       | Collapse navigation | —                                                                                              |
| `expandLabel`       | `string`                       | No       | Expand navigation   | —                                                                                              |
| `expandOnHover`     | `boolean`                      | No       | false               | Widens the rail as an overlay on hover/focus-within; suppresses tooltips/flyouts               |
| `footer`            | `ReactNode`                    | No       | —                   | Content rendered above the collapse toggle (e.g. version string, user info)                    |
| `className`         | `string`                       | No       | —                   | —                                                                                              |

## Tokens

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
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-motion-emphasis`

## Examples

### Basic

```jsx
<SideNav
  items={[
    { label: 'Home', href: '/', active: true },
    { label: 'Reports', href: '/reports' },
  ]}
/>
```

### With a group

```jsx
<SideNav items={[{ label: 'Settings', items: [{ label: 'Profile', href: '/profile' }] }]} />
```

### Icon rail

Collapsed rail: icons-only with tooltips, grapheme fallback for icon-less items, flyout menus for groups

```jsx
<SideNav collapsed items={[{ label: 'Home', href: '/', icon: <Home size={16} /> }]} />
```

### Expand on hover

Rail widens as CSS overlay on hover without reflowing adjacent content

```jsx
<SideNav collapsed expandOnHover items={items} />
```

## Boundaries

| Area                      | Level    | Note                                                             |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| collapsed / expandOnHover | flexible | Rail behavior is configurable for density needs                  |
| token names               | strict   | Sizing, surfaces, and motion must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SideNav component (navigation). Collapsible sidebar navigation with optional icons and one level of grouping

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SideNav is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-sidenav-inline-size, --cascivo-sidenav-rail-inline-size, --cascivo-sidenav-bg, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-bg-subtle, --cascivo-color-accent, --cascivo-color-accent-subtle, --cascivo-focus-ring, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-motion-emphasis

Accessibility: role "navigation", WCAG 2.2-AA, keyboard: Tab/Enter/Space/ArrowDown/ArrowUp/Escape. Keep it AA.

Do not change (strict): token names — Sizing, surfaces, and motion must resolve to --cascivo-* tokens
Flexible: collapsed / expandOnHover.

Do not invent props, tokens, or global viewport media queries.
```
