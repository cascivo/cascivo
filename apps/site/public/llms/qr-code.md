# QrCode

Encodes a URL or short text into a scannable SVG QR code

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add qr-code
```

Or use it from the prebuilt package without copying:

```tsx
import { QrCode } from '@cascivo/react'
```

## Category

`display`

## States

- `default`

## Props

| Prop              | Type                       | Required | Default        | Description                                           |
| ----------------- | -------------------------- | -------- | -------------- | ----------------------------------------------------- |
| `value`           | `string`                   | yes      | —              | Text or URL to encode                                 |
| `size`            | `number`                   | no       | `128`          | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `errorCorrection` | `'L' \| 'M' \| 'Q' \| 'H'` | no       | `M`            | Higher levels tolerate more damage but hold less data |
| `radius`          | `string`                   | no       | —              | CSS length rounding the corners                       |
| `fill`            | `string`                   | no       | `currentColor` | Foreground color of the QR modules.                   |
| `background`      | `string`                   | no       | `transparent`  | Background color behind the QR code.                  |
| `label`           | `string`                   | no       | —              | Text label for the control.                           |

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

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
