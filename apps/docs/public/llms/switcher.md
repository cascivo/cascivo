# Switcher

App/product switcher list — lives inside HeaderPanel, renders links with active indicator and optional dividers

## Install

```bash
npx cascade add switcher
```

## Category

`navigation`

## States

- `default`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `SwitcherEntry[]` | yes | — | SwitcherLink ({ label, href, active?, icon? }) or divider ({ divider: true }) |
| `label` | `string` | no | `Switch application` | — |
| `className` | `string` | no | — | — |

## Examples

### App switcher

Place inside a HeaderPanel opened by a Grid action in ShellHeader

```tsx
<Switcher
  items={[
    { label: 'Console', href: '/console', active: true },
    { label: 'Billing', href: '/billing' },
    { divider: true },
    { label: 'Docs', href: 'https://docs.example.com' },
  ]}
/>
```

## Design tokens

- `--cascade-color-text`
- `--cascade-color-bg-subtle`
- `--cascade-color-accent`
- `--cascade-color-accent-subtle`
- `--cascade-color-border`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `list`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

navigation, switcher, shell, console, app-switcher
