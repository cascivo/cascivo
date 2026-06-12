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

- `--cascade-radius-full`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `status`

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

loading, progress, feedback
