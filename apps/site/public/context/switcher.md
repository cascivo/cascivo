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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Switcher component (navigation). App/product switcher list — lives inside HeaderPanel, renders links with active indicator and optional dividers

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Switcher is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-bg-subtle, --cascivo-color-accent, --cascivo-color-accent-subtle, --cascivo-color-border, --cascivo-focus-ring

Accessibility: role "list", WCAG 2.2-AA, keyboard: Tab/Enter. Keep it AA.

Do not change (strict): token names — Accent and surface colors must resolve to --cascivo-* tokens
Flexible: dividers.

Do not invent props, tokens, or global viewport media queries.
```
