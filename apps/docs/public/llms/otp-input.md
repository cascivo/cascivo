# OtpInput

Segmented one-time code input

## Install

```bash
npx cascade add otp-input
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `filled`
- `disabled`

## Props

| Prop            | Type                  | Required        | Default | Description |
| --------------- | --------------------- | --------------- | ------- | ----------- | --- |
| `length`        | `number`              | no              | `6`     | —           |
| `value`         | `string`              | yes             | —       | —           |
| `onValueChange` | `(v: string) => void` | yes             | —       | —           |
| `disabled`      | `boolean`             | no              | `false` | —           |
| `type`          | `'numeric'            | 'alphanumeric'` | no      | `numeric`   | —   |

## Examples

### Basic

```tsx
<OtpInput value="" onValueChange={() => {}} />
```

### 4-digit

```tsx
<OtpInput length={4} value="" onValueChange={() => {}} />
```

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

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

form, otp, code, input, verification
