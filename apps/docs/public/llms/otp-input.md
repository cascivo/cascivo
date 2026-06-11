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

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-bg-subtle`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `group`
- **Keyboard:** ArrowLeft, ArrowRight, Backspace

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

form, otp, code, input, verification
