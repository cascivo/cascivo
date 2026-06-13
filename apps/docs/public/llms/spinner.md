# Spinner

Indeterminate loading indicator

## Install

```bash
npx cascade add spinner
```

## Category

`feedback`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop    | Type     | Required | Default   | Description                                  |
| ------- | -------- | -------- | --------- | -------------------------------------------- | ---- | --- |
| `size`  | `'sm'    | 'md'     | 'lg'`     | no                                           | `md` | —   |
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
