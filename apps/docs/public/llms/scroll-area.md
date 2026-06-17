# ScrollArea

A scroll container with styled, slim scrollbars and overflow shadows

## Install

```bash
npx cascivo add scroll-area
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `height` | `string` | no | — | Max block size of the container (any CSS length) |
| `width` | `string` | no | — | Max inline size of the container (any CSS length) |
| `orientation` | `'vertical' | 'horizontal' | 'both'` | no | `vertical` | Which axes may scroll |
| `children` | `ReactNode` | no | — | Scrollable content |

## Examples

### Vertical scroll

```tsx
<ScrollArea height="12rem">
  <p>Long content…</p>
</ScrollArea>
```

### Both axes

```tsx
<ScrollArea height="12rem" width="20rem" orientation="both">
  <table>…</table>
</ScrollArea>
```

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-control`
- `--cascivo-scroll-area-height`
- `--cascivo-scroll-area-width`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`
- **Keyboard:** ArrowUp, ArrowDown, PageUp, PageDown, Home, End

## Dependencies

- `@cascivo/core`

## Tags

scroll, overflow, scrollbar, container, layout
