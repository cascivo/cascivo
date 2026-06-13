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

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'text' | 'circle' | 'rect'` | No | text | — |
| `width` | `string` | No | — | CSS length applied as an inline custom property |
| `height` | `string` | No | — | CSS length applied as an inline custom property |
| `lines` | `number` | No | 1 | Number of bars for the text variant; the last bar renders shorter |

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

| Area | Level | Note |
|------|-------|------|
| variant and dimensions | flexible | Shape, width, height, and line count match the pending content |
| token names | strict | Background and radius must resolve to --cascivo-* tokens |
