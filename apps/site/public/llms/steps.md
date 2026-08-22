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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | no | — | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only. |
| `ariaLabel` | `string` | no | — | Accessible label for the steps navigation; defaults to the built-in i18n string. Not rendered — screen readers only. |
| `items` | `Step[]` | no | — | Alias of `steps` — the catalog-wide name for a config-driven collection. Exactly one of the two is required. |
| `steps` | `Step[]` | no | — | Array of step objects with label and optional explicit state |
| `activeStep` | `number` | no | `0` | Index of the currently active step (0-based) |
| `orientation` | `'horizontal' \| 'vertical'` | no | `'horizontal'` | Axis the steps flow along: `horizontal` runs them across with connectors between, `vertical` stacks them down the page. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Object types

### `Step`

Shape of an entry in `steps` / `items`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | Visible step label. |
| `id` | `string` | no | Stable identity, used as the React key so reordering keeps DOM nodes. |
| `state` | `StepState \| ProgressInput` | no | Step status. `StepState` ('pending' \| 'active' \| 'complete' \| 'error') is canonical; `ProgressInput` also accepts Timeline's `current` / `upcoming` aliases. |

## Examples

### Horizontal (default)

Standard checkout or onboarding progress tracker

```tsx
<Steps
  steps={[
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Confirm' },
  ]}
  activeStep={1}
/>
```

### Vertical

Sidebar-style progress for tall forms

```tsx
<Steps
  orientation="vertical"
  steps={[
    { label: 'Account info' },
    { label: 'Profile details' },
    { label: 'Preferences' },
  ]}
  activeStep={0}
/>
```

### With explicit error state

Override derived state on a specific step

```tsx
<Steps
  steps={[
    { label: 'Upload' },
    { label: 'Validate', state: 'error' },
    { label: 'Process' },
  ]}
  activeStep={1}
/>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

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

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
