# User

Identity composite: an avatar with a name, description, and optional action slot

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add user
```

Or use it from the prebuilt package without copying:

```tsx
import { User } from '@cascivo/react'
```

## Category

`display`

## States

- `default`

## Props

| Prop          | Type          | Required | Default | Description                        |
| ------------- | ------------- | -------- | ------- | ---------------------------------- |
| `name`        | `ReactNode`   | yes      | —       | The user’s display name.           |
| `description` | `ReactNode`   | no       | —       | Supporting description text.       |
| `avatarProps` | `AvatarProps` | no       | —       | Forwarded to the composed <Avatar> |

## Examples

### Basic

```tsx
<User
  name="Jane Doe"
  description="jane@acme.com"
  avatarProps={{ src: '/jane.jpg', alt: 'Jane Doe' }}
/>
```

### With action

```tsx
<User name="Jane Doe" description="Admin">
  <IconButton aria-label="More" />
</User>
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-space-3`
- `--cascivo-text-sm`
- `--cascivo-text-xs`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`

## Dependencies

- `@cascivo/core`
- `@cascivo/components`

## Tags

user, avatar, identity, display

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
