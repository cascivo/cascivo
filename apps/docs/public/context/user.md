# User

**Category:** display  
**Description:** Identity composite: an avatar with a name, description, and optional action slot

## When to use

- Showing a person with their name and a secondary line (email, role) next to an avatar
- Identity rows inside menus, tables, navbars, and account switchers
- A compact, labelled identity primitive too granular for a page-section block

## When NOT to use

- Just an image with no name/description — use Avatar directly
- A full profile card with rich content — compose a Card instead

## Anti-patterns

### The name is the accessible identity label; an empty name leaves the avatar unlabelled

**Bad:** `<User name="" avatarProps={{ src: "/jane.jpg" }} />`  
**Good:** `<User name="Jane Doe" avatarProps={{ src: "/jane.jpg", alt: "Jane Doe" }} />`  
**Why:** The name is the accessible identity label; an empty name leaves the avatar unlabelled

## Related components

- **Avatar** (contains): User wraps Avatar and forwards avatarProps to it
- **AvatarGroup** (alternative): Use AvatarGroup to show several identities as an overlapping stack

## Accessibility rationale

The composite is a labelled group; the name provides the accessible identity and the avatar carries its own role="img"/alt — no redundant roles

## Props

| Name          | Type          | Required | Default | Description                        |
| ------------- | ------------- | -------- | ------- | ---------------------------------- |
| `name`        | `ReactNode`   | Yes      | —       | —                                  |
| `description` | `ReactNode`   | No       | —       | —                                  |
| `avatarProps` | `AvatarProps` | No       | —       | Forwarded to the composed <Avatar> |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-space-3`
- `--cascivo-text-sm`
- `--cascivo-text-xs`

## Examples

### Basic

```jsx
<User
  name="Jane Doe"
  description="jane@acme.com"
  avatarProps={{ src: '/jane.jpg', alt: 'Jane Doe' }}
/>
```

### With action

```jsx
<User name="Jane Doe" description="Admin">
  <IconButton aria-label="More" />
</User>
```

## Boundaries

| Area        | Level    | Note                                                            |
| ----------- | -------- | --------------------------------------------------------------- |
| description | flexible | Any ReactNode — email, role, or a status line                   |
| token names | strict   | Name and description colors must resolve to --cascivo-\* tokens |
