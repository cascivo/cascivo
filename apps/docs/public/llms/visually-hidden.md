# VisuallyHidden

Hides content visually while keeping it available to screen readers

## Install

```bash
npx cascade add visually-hidden
```

## Category

`display`

## Props

| Prop       | Type        | Required | Default | Description                                               |
| ---------- | ----------- | -------- | ------- | --------------------------------------------------------- |
| `children` | `ReactNode` | yes      | —       | Content announced by assistive technology but not painted |

## Examples

### Icon button label

Gives an icon-only control an accessible name

```tsx
<button type="button">
  <CloseIcon />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

### Table context

```tsx
<th>
  Price <VisuallyHidden>(in euros)</VisuallyHidden>
</th>
```

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `none`

## Dependencies

- `@cascade-ui/core`

## Tags

accessibility, screen-reader, sr-only, hidden
