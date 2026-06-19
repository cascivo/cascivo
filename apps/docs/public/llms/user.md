# User

Identity composite: an avatar with a name, description, and optional action slot

## Install

```bash
npx cascivo add user
```

## Category

`display`

## States

- `default`

## Props

| Prop          | Type          | Required | Default | Description                        |
| ------------- | ------------- | -------- | ------- | ---------------------------------- |
| `name`        | `ReactNode`   | yes      | —       | —                                  |
| `description` | `ReactNode`   | no       | —       | —                                  |
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
