# Avatar

Displays a user image with initials fallback

## Install

```bash
npx cascade add avatar
```

## Category

`display`

## Sizes

- `xs`
- `sm`
- `md`
- `lg`
- `xl`

## States

- `loading`
- `loaded`
- `error`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | no | — | — |
| `alt` | `string` | no | — | — |
| `fallback` | `string` | no | — | Initials shown when no image is available |
| `size` | `'xs' | 'sm' | 'md' | 'lg' | 'xl'` | no | `md` | — |
| `status` | `'online' | 'offline' | 'busy'` | no | — | — |

## Examples

### Image

```tsx
<Avatar src="/jane.jpg" alt="Jane Doe" />
```

### Fallback

```tsx
<Avatar fallback="JD" alt="Jane Doe" />
```

### With status

```tsx
<Avatar fallback="JD" status="online" />
```

## Design tokens

- `--cascade-color-accent-subtle`
- `--cascade-color-success`
- `--cascade-color-destructive`
- `--cascade-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/core`

## Tags

user, profile, image
