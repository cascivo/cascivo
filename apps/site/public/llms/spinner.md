# Spinner

Indeterminate loading indicator

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add spinner
```

Or use it from the prebuilt package without copying:

```tsx
import { Spinner } from '@cascivo/react'
```

## Category

`feedback`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop    | Type     | Required | Default   | Description                                  |
| ------- | -------- | -------- | --------- | -------------------------------------------- | ---- | ----------------------------------------------------- |
| `size`  | `'sm'    | 'md'     | 'lg'`     | no                                           | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `label` | `string` | no       | `Loading` | Accessible label announced by screen readers |

## Examples

### Default

```tsx
<Spinner />
```

### Large

```tsx
<Spinner size="lg" />
```

## Design tokens

- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

loading, progress, feedback
