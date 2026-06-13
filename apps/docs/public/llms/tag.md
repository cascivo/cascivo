# Tag

Compact chip for labeling, categorizing, or filtering content

## Install

```bash
npx cascivo add tag
```

## Category

`display`

## Variants

- `default`
- `info`
- `success`
- `warning`
- `error`

## Sizes

- `sm`
- `md`

## Props

| Prop           | Type         | Required | Default   | Description                                                     |
| -------------- | ------------ | -------- | --------- | --------------------------------------------------------------- | -------- | --- | --------- | --- |
| `variant`      | `'default'   | 'info'   | 'success' | 'warning'                                                       | 'error'` | no  | `default` | —   |
| `size`         | `'sm'        | 'md'`    | no        | `md`                                                            | —        |
| `onDismiss`    | `() => void` | no       | —         | When provided, renders a trailing remove button inside the chip |
| `dismissLabel` | `string`     | no       | `Remove`  | —                                                               |

## Examples

### Default

```tsx
<Tag>Design</Tag>
```

### Success

```tsx
<Tag variant="success">Approved</Tag>
```

### Dismissible

Renders a trailing remove button labeled by dismissLabel

```tsx
<Tag onDismiss={() => removeFilter()}>Filter: Active</Tag>
```

## Design tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-text-subtle`
- `--cascivo-color-info`
- `--cascivo-color-info-subtle`
- `--cascivo-color-success`
- `--cascivo-color-success-subtle`
- `--cascivo-color-warning`
- `--cascivo-color-warning-subtle`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-radius-badge`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

chip, label, filter, category
