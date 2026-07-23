# Heading

Section heading with semantic level decoupled from visual size

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add heading
```

Or use it from the prebuilt package without copying:

```tsx
import { Heading } from '@cascivo/react'
```

## Category

`display`

## Sizes

- `sm`
- `md`
- `lg`
- `xl`
- `2xl`

## Props

| Prop    | Type                                    | Required | Default                                                    | Description                                           |
| ------- | --------------------------------------- | -------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`            | no       | `2`                                                        | Heading level (1–6) mapping to h1–h6.                 |
| `size`  | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | no       | `derived from level (1→2xl, 2→xl, 3→lg, 4→md, 5→sm, 6→sm)` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Examples

### Default

```tsx
<Heading>Section title</Heading>
```

### Page title

```tsx
<Heading level={1}>Page title</Heading>
```

### Decoupled size

Keep the document outline correct while controlling the visual scale

```tsx
<Heading level={2} size="2xl">
  Visually large, semantically h2
</Heading>
```

## Design tokens

- `--cascivo-font-display`
- `--cascivo-font-semibold`
- `--cascivo-leading-tight`
- `--cascivo-tracking-tight`
- `--cascivo-color-text`
- `--cascivo-text-base`
- `--cascivo-text-lg`
- `--cascivo-text-xl`
- `--cascivo-text-2xl`
- `--cascivo-text-3xl`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `heading`

## Dependencies

- `@cascivo/core`

## Tags

typography, heading, title

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
