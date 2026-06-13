# Switcher

**Category:** navigation  
**Description:** App/product switcher list — lives inside HeaderPanel, renders links with active indicator and optional dividers

## When to use

- Listing sibling apps/products the user can switch between
- Rendering switch destinations inside a HeaderPanel opened from the shell header
- Grouping switch targets with dividers and marking the active one

## When NOT to use

- Primary in-app navigation — use SideNav
- A small action menu attached to a control — use Dropdown

## Anti-patterns

### Switcher models cross-app jumps, not navigation within the current app

**Bad:** `Using Switcher as the main page navigation`  
**Good:** `<SideNav> for primary navigation; Switcher only for app/product switching`  
**Why:** Switcher models cross-app jumps, not navigation within the current app

## Related components

- **HeaderPanel** (contained-by): Switcher is placed inside a HeaderPanel opened by a ShellHeader action

## Accessibility rationale

role="list" structures the entries; each switch target is a real link with the active destination marked, so keyboard and screen-reader users can identify and reach the current app

## Props

| Name        | Type              | Required | Default            | Description                                                                   |
| ----------- | ----------------- | -------- | ------------------ | ----------------------------------------------------------------------------- |
| `items`     | `SwitcherEntry[]` | Yes      | —                  | SwitcherLink ({ label, href, active?, icon? }) or divider ({ divider: true }) |
| `label`     | `string`          | No       | Switch application | —                                                                             |
| `className` | `string`          | No       | —                  | —                                                                             |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-border`
- `--cascivo-focus-ring`

## Examples

### App switcher

Place inside a HeaderPanel opened by a Grid action in ShellHeader

```jsx
<Switcher
  items={[
    { label: 'Console', href: '/console', active: true },
    { label: 'Billing', href: '/billing' },
    { divider: true },
    { label: 'Docs', href: 'https://docs.example.com' },
  ]}
/>
```

## Boundaries

| Area        | Level    | Note                                                          |
| ----------- | -------- | ------------------------------------------------------------- |
| dividers    | flexible | Dividers group entries as needed                              |
| token names | strict   | Accent and surface colors must resolve to --cascivo-\* tokens |
