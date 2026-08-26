# Switcher

Always-visible app/product switcher LIST — every entry is rendered at once, it does not collapse. Lives inside HeaderPanel; renders links with an active indicator and optional dividers. For a collapsed trigger with a menu, use Dropdown.

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

| Prop        | Type              | Required | Default              | Description                                                                                                                                  |
| ----------- | ----------------- | -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`     | `SwitcherEntry[]` | yes      | —                    | SwitcherLink ({ label, href, active?, icon? }) or divider ({ divider: true })                                                                |
| `ariaLabel` | `string`          | no       | —                    | Alias of `label` — the same invisible accessible name under the catalog spelling. Neither is deprecated. Not rendered — screen readers only. |
| `label`     | `string`          | no       | `Switch application` | Accessible name for the switcher list. Not rendered — screen readers only.                                                                   |
| `className` | `string`          | no       | —                    | Additional CSS class names merged onto the root element.                                                                                     |

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

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

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

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
