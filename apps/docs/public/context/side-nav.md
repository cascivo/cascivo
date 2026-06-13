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
| token names               | strict   | Sizing, surfaces, and motion must resolve to --cascade-\* tokens |
