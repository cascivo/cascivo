# Skeleton

**Category:** display  
**Description:** Animated loading placeholder that mirrors the shape of pending content

## When to use

- Indicating loading by mirroring the shape of the content that will appear
- Reducing layout shift while data for a known structure is fetching
- Loading larger content regions where shape preview reassures the user

## When NOT to use

- Indeterminate work with no known content shape — use Spinner
- A view that is empty rather than loading — use EmptyState

## Anti-patterns

### A persistent skeleton signals perpetual loading and traps assistive tech in a pending state

**Bad:** `Leaving Skeleton mounted after data has loaded`  
**Good:** `Swap Skeleton for the real content once data resolves`  
**Why:** A persistent skeleton signals perpetual loading and traps assistive tech in a pending state

## Related components

- **Spinner** (alternative): Spinner suits indeterminate work with no content shape to preview
- **EmptyState** (alternative): Use EmptyState when the result is empty, not loading

## Accessibility rationale

Presentational by role — the placeholder shapes carry no meaning; the surrounding region should expose busy/loading state so assistive tech is not left guessing

## Props

| Name      | Type                           | Required | Default | Description                                                       |
| --------- | ------------------------------ | -------- | ------- | ----------------------------------------------------------------- |
| `variant` | `'text' \| 'circle' \| 'rect'` | No       | text    | Selects the visual style variant.                                 |
| `width`   | `string`                       | No       | —       | CSS length applied as an inline custom property                   |
| `height`  | `string`                       | No       | —       | CSS length applied as an inline custom property                   |
| `lines`   | `number`                       | No       | 1       | Number of bars for the text variant; the last bar renders shorter |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-sm`
- `--cascivo-radius-full`
- `--cascivo-radius-component`

## Examples

### Text

```jsx
<Skeleton lines={3} />
```

### Avatar

```jsx
<Skeleton variant="circle" width="3rem" height="3rem" />
```

### Image

```jsx
<Skeleton variant="rect" height="12rem" />
```

## Boundaries

| Area                   | Level    | Note                                                           |
| ---------------------- | -------- | -------------------------------------------------------------- |
| variant and dimensions | flexible | Shape, width, height, and line count match the pending content |
| token names            | strict   | Background and radius must resolve to --cascivo-\* tokens      |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Skeleton component (display). Animated loading placeholder that mirrors the shape of pending content

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Skeleton is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-radius-sm, --cascivo-radius-full, --cascivo-radius-component

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Background and radius must resolve to --cascivo-* tokens
Flexible: variant and dimensions.

Do not invent props, tokens, or global viewport media queries.
```
