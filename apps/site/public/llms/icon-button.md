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

| Prop       | Type                                         | Required  | Default   | Description                                                                                       |
| ---------- | -------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| `label`    | `string`                                     | yes       | —         | Text label for the control.                                                                       |
| `icon`     | `React.ReactNode`                            | no        | —         | Icon element rendered in the component.                                                           |
| `variant`  | `'ghost'                                     | 'outline' | 'filled'` | no                                                                                                | `ghost` | Selects the visual style variant.                     |
| `size`     | `'sm'                                        | 'md'      | 'lg'`     | no                                                                                                | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `asChild`  | `boolean`                                    | no        | `false`   | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `disabled` | `boolean`                                    | no        | `false`   | When true, disables the control and removes it from the tab order.                                |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>` | no        | —         | Called when the element is clicked.                                                               |

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
