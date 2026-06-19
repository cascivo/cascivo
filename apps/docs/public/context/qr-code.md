# QrCode

**Category:** display  
**Description:** Encodes a URL or short text into a scannable SVG QR code

## When to use

- Letting users scan a URL, contact, or short token with a phone camera
- Bridging print or screen to a digital destination
- Sharing a link where typing it would be error-prone

## When NOT to use

- Encoding long or sensitive payloads — QR codes are public and capacity-limited
- Where a plain, copyable link or button is more accessible

## Anti-patterns

### Long payloads force a dense, hard-to-scan code; encode a short URL that redirects instead

**Bad:** `<QrCode value={veryLongString} />`  
**Good:** `<QrCode value="https://cascivo.dev/s/abc" />`  
**Why:** Long payloads force a dense, hard-to-scan code; encode a short URL that redirects instead

## Related components

- **CopyButton** (pairs-with): Offer a copyable link alongside the QR code for non-camera contexts

## Accessibility rationale

Rendered as role="img" with an accessible label so screen-reader users know a QR code is present; the underlying link should also be available as text since a QR code is not operable by assistive tech

## Props

| Name              | Type     | Required | Default      | Description                     |
| ----------------- | -------- | -------- | ------------ | ------------------------------- | --- | --- | ----------------------------------------------------- |
| `value`           | `string` | Yes      | —            | Text or URL to encode           |
| `size`            | `number` | No       | 128          | —                               |
| `errorCorrection` | `'L'     | 'M'      | 'Q'          | 'H'`                            | No  | M   | Higher levels tolerate more damage but hold less data |
| `radius`          | `string` | No       | —            | CSS length rounding the corners |
| `fill`            | `string` | No       | currentColor | —                               |
| `background`      | `string` | No       | transparent  | —                               |
| `label`           | `string` | No       | —            | —                               |

## Tokens

- `--cascivo-color-text`

## Examples

### URL

```jsx
<QrCode value="https://cascivo.dev" />
```

### High error correction

```jsx
<QrCode value="https://cascivo.dev" errorCorrection="H" size={200} />
```

### Custom colors

```jsx
<QrCode
  value="cascivo"
  fill="var(--cascivo-color-accent)"
  background="var(--cascivo-color-surface)"
/>
```

## Boundaries

| Area            | Level    | Note                                                                                             |
| --------------- | -------- | ------------------------------------------------------------------------------------------------ |
| errorCorrection | flexible | Raise to Q/H when the code may be printed small or partially obscured                            |
| colors          | flexible | Defaults to currentColor; keep sufficient contrast between fill and background to stay scannable |
