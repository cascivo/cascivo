# AvatarGroup

Overlapping stack of avatars with a max cap and an i18n-labelled +N overflow chip

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add avatar-group
```

Or use it from the prebuilt package without copying:

```tsx
import { AvatarGroup } from '@cascivo/react'
```

## Category

`display`

## States

- `default`

## Props

| Prop      | Type                | Required | Default | Description                                   |
| --------- | ------------------- | -------- | ------- | --------------------------------------------- | ---- | --- |
| `max`     | `number`            | no       | —       | Cap the number of visible avatars             |
| `total`   | `number`            | no       | —       | Override the total count used for the +N chip |
| `spacing` | `'sm'               | 'md'     | 'lg'`   | no                                            | `md` | —   |
| `isGrid`  | `boolean`           | no       | `false` | —                                             |
| `labels`  | `AvatarGroupLabels` | no       | —       | —                                             |

## Examples

### Basic

```tsx
<AvatarGroup>
  <Avatar fallback="A" />
  <Avatar fallback="B" />
  <Avatar fallback="C" />
</AvatarGroup>
```

### With max

```tsx
<AvatarGroup max={3}>
  {users.map((u) => (
    <Avatar key={u.id} src={u.src} alt={u.name} />
  ))}
</AvatarGroup>
```

### Grid

```tsx
<AvatarGroup isGrid max={8}>
  {avatars}
</AvatarGroup>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-text-muted`
- `--cascivo-space-2`
- `--cascivo-text-xs`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`

## Dependencies

- `@cascivo/core`
- `@cascivo/components`

## Tags

avatar, group, stack, overflow, display
