# Text

Body text with size, weight, and muted variants

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add text
```

Or use it from the prebuilt package without copying:

```tsx
import { Text } from '@cascivo/react'
```

## Category

`display`

## Variants

- `normal`
- `medium`
- `semibold`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop     | Type                                 | Required | Default  | Description                                           |
| -------- | ------------------------------------ | -------- | -------- | ----------------------------------------------------- |
| `as`     | `'p' \| 'span' \| 'div'`             | no       | `p`      | The HTML element to render as.                        |
| `size`   | `'sm' \| 'md' \| 'lg'`               | no       | `md`     | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `weight` | `'normal' \| 'medium' \| 'semibold'` | no       | `normal` | Font weight ('normal' \| 'medium' \| 'semibold').     |
| `muted`  | `boolean`                            | no       | `false`  | When true, renders in a muted/subtle color.           |

## Examples

### Default

```tsx
<Text>Body copy reads at the base size.</Text>
```

### Muted helper

```tsx
<Text size="sm" muted>
  Secondary information
</Text>
```

### Inline span

Use as="span" inside other flow content

```tsx
<Text as="span" weight="semibold">
  emphasis
</Text>
```

### Icon beside text

Text renders a <p> by default, so a nested Text needs as="span" — a <p> inside a <p> is invalid HTML and the browser silently closes the outer one, breaking the layout.

```tsx
<Text>
  <CheckIcon aria-hidden />
  <Text as="span" weight="semibold">
    Deployed
  </Text>
</Text>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-font-normal`
- `--cascivo-font-medium`
- `--cascivo-font-semibold`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-text-sm`
- `--cascivo-text-base`
- `--cascivo-text-lg`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `paragraph`

## Dependencies

- `@cascivo/core`

## Tags

typography, text, paragraph, body

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
