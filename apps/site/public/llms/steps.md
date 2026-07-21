# Steps

Visual progress indicator for multi-step flows with horizontal and vertical orientations

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add steps
```

Or use it from the prebuilt package without copying:

```tsx
import { Steps } from '@cascivo/react'
```

## Category

`navigation`

## States

- `pending`
- `active`
- `complete`
- `error`

## Props

| Prop          | Type                         | Required | Default        | Description                                                                      |
| ------------- | ---------------------------- | -------- | -------------- | -------------------------------------------------------------------------------- |
| `ariaLabel`   | `string`                     | no       | —              | Accessible label for the steps navigation; defaults to the built-in i18n string. |
| `steps`       | `Step[]`                     | yes      | —              | Array of step objects with label and optional explicit state                     |
| `activeStep`  | `number`                     | no       | `0`            | Index of the currently active step (0-based)                                     |
| `orientation` | `'horizontal' \| 'vertical'` | no       | `'horizontal'` | Layout direction of the steps                                                    |
| `className`   | `string`                     | no       | —              | Additional CSS class names merged onto the root element.                         |

## Examples

### Horizontal (default)

Standard checkout or onboarding progress tracker

```tsx
<Steps
  steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }, { label: 'Confirm' }]}
  activeStep={1}
/>
```

### Vertical

Sidebar-style progress for tall forms

```tsx
<Steps
  orientation="vertical"
  steps={[{ label: 'Account info' }, { label: 'Profile details' }, { label: 'Preferences' }]}
  activeStep={0}
/>
```

### With explicit error state

Override derived state on a specific step

```tsx
<Steps
  steps={[{ label: 'Upload' }, { label: 'Validate', state: 'error' }, { label: 'Process' }]}
  activeStep={1}
/>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-success`
- `--cascivo-color-success-content`
- `--cascivo-color-error`
- `--cascivo-color-error-content`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-border-default`
- `--cascivo-radius-full`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

steps, wizard, stepper, progress, navigation, onboarding, checkout

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
