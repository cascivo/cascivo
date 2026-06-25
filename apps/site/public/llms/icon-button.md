# IconButton

Square, icon-only button with a required accessible label

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add icon-button
```

Or use it from the prebuilt package without copying:

```tsx
import { IconButton } from '@cascivo/react'
```

## Category

`inputs`

## Variants

- `ghost`
- `outline`
- `filled`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`

## Props

| Prop       | Type                                         | Required  | Default   | Description |
| ---------- | -------------------------------------------- | --------- | --------- | ----------- | ------- | --- |
| `label`    | `string`                                     | yes       | —         | —           |
| `icon`     | `React.ReactNode`                            | no        | —         | —           |
| `variant`  | `'ghost'                                     | 'outline' | 'filled'` | no          | `ghost` | —   |
| `size`     | `'sm'                                        | 'md'      | 'lg'`     | no          | `md`    | —   |
| `asChild`  | `boolean`                                    | no        | `false`   | —           |
| `disabled` | `boolean`                                    | no        | `false`   | —           |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>` | no        | —         | —           |

## Examples

### Ghost

```tsx
<IconButton label="Settings">
  <GearIcon />
</IconButton>
```

### Filled

```tsx
<IconButton label="Add" variant="filled" icon={<PlusIcon />} />
```

### As link

```tsx
<IconButton label="Home" asChild>
  <a href="/">
    <HomeIcon />
  </a>
</IconButton>
```

## Design tokens

- `--cascivo-control-height-sm`
- `--cascivo-control-height-md`
- `--cascivo-control-height-lg`
- `--cascivo-button-radius`
- `--cascivo-radius-control`
- `--cascivo-color-primary`
- `--cascivo-color-primary-fg`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

action, icon, compact, toolbar
