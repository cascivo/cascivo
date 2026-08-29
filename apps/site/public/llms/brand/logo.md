# Logo

The cascivo mark and its sanctioned lockups, as inline SVG

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add brand/logo
```

Or use it from the prebuilt package without copying:

```tsx
import { Logo } from '@cascivo/react'
```

## Category

`display`

## Variants

- `mark`
- `mark-accent`
- `horizontal`
- `stacked`
- `nav`

## Props

| Prop      | Type                                                            | Required | Default                      | Description                                                                                                                                          |
| --------- | --------------------------------------------------------------- | -------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant` | `'mark' \| 'mark-accent' \| 'horizontal' \| 'stacked' \| 'nav'` | no       | `mark`                       | `mark` and `mark-accent` render the square alone; `horizontal`, `stacked` and `nav` add the wordmark. `nav` is the only lockup permitted below 24px. |
| `size`    | `number`                                                        | no       | `18 for `nav`, 32 otherwise` | Mark height in px. Clamped to a 16px floor — below that the notch closes optically.                                                                  |

## Examples

### Mark

```tsx
<Logo />
```

### Two colour

The accent fills the notch. Decoration — the mark is complete without it.

```tsx
<Logo variant="mark-accent" />
```

### Horizontal lockup

```tsx
<Logo variant="horizontal" />
```

### Nav lockup

18px mark, 16px wordmark, 10px gap — the only lockup allowed below 24px.

```tsx
<Logo variant="nav" />
```

### Stacked

```tsx
<Logo variant="stacked" size={48} />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-font-display`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/core`

## Tags

logo, brand, mark, wordmark, lockup, identity

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
