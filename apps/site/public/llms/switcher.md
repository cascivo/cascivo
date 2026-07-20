# Switcher

App/product switcher list — lives inside HeaderPanel, renders links with active indicator and optional dividers

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add switcher
```

Or use it from the prebuilt package without copying:

```tsx
import { Switcher } from '@cascivo/react'
```

## Category

`navigation`

## States

- `default`

## Props

| Prop        | Type              | Required | Default              | Description                                                                   |
| ----------- | ----------------- | -------- | -------------------- | ----------------------------------------------------------------------------- |
| `items`     | `SwitcherEntry[]` | yes      | —                    | SwitcherLink ({ label, href, active?, icon? }) or divider ({ divider: true }) |
| `label`     | `string`          | no       | `Switch application` | Text label for the control.                                                   |
| `className` | `string`          | no       | —                    | Additional CSS class names merged onto the root element.                      |

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

- `--cascivo-color-text`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-border`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

navigation, switcher, shell, console, app-switcher

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
