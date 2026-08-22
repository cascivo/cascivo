# OtpInput

Segmented one-time code input

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add otp-input
```

Or use it from the prebuilt package without copying:

```tsx
import { OtpInput } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `filled`
- `disabled`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `length` | `number` | no | `6` | Number of input cells. |
| `value` | `string` | yes | — | The controlled value. |
| `onValueChange` | `(v: string) => void` | yes | — | Called with the new value when it changes. |
| `disabled` | `boolean` | no | `false` | When true, disables the control and removes it from the tab order. |
| `type` | `'numeric' \| 'alphanumeric'` | no | `numeric` | Accepted characters ('numeric' \| 'alphanumeric'). |

## Examples

### Basic

```tsx
<OtpInput value="" onValueChange={() => {}} />
```

### 4-digit

```tsx
<OtpInput length={4} value="" onValueChange={() => {}} />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** ArrowLeft, ArrowRight, Backspace

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, otp, code, input, verification

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
