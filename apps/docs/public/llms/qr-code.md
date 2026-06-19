# QrCode

Encodes a URL or short text into a scannable SVG QR code

## Install

```bash
npx cascivo add qr-code
```

## Category

`display`

## States

- `default`

## Props

| Prop              | Type     | Required | Default        | Description                     |
| ----------------- | -------- | -------- | -------------- | ------------------------------- | --- | --- | ----------------------------------------------------- |
| `value`           | `string` | yes      | —              | Text or URL to encode           |
| `size`            | `number` | no       | `128`          | —                               |
| `errorCorrection` | `'L'     | 'M'      | 'Q'            | 'H'`                            | no  | `M` | Higher levels tolerate more damage but hold less data |
| `radius`          | `string` | no       | —              | CSS length rounding the corners |
| `fill`            | `string` | no       | `currentColor` | —                               |
| `background`      | `string` | no       | `transparent`  | —                               |
| `label`           | `string` | no       | —              | —                               |

## Examples

### URL

```tsx
<QrCode value="https://cascivo.dev" />
```

### High error correction

```tsx
<QrCode value="https://cascivo.dev" errorCorrection="H" size={200} />
```

### Custom colors

```tsx
<QrCode
  value="cascivo"
  fill="var(--cascivo-color-accent)"
  background="var(--cascivo-color-surface)"
/>
```

## Design tokens

- `--cascivo-color-text`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

qr, qr-code, barcode, encode, display
