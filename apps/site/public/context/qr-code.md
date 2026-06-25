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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo QrCode component (display). Encodes a URL or short text into a scannable SVG QR code

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

QrCode is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text

Accessibility: role "img", WCAG 2.2-AA. Keep it AA.
Flexible: errorCorrection, colors.

Do not invent props, tokens, or global viewport media queries.
```
