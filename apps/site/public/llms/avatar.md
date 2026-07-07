# Avatar

Displays a user image with initials fallback

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add avatar
```

Or use it from the prebuilt package without copying:

```tsx
import { Avatar } from '@cascivo/react'
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

| Prop       | Type                                   | Required | Default | Description                                           |
| ---------- | -------------------------------------- | -------- | ------- | ----------------------------------------------------- |
| `src`      | `string`                               | no       | —       | Image source URL.                                     |
| `alt`      | `string`                               | no       | —       | Alternative text describing the image.                |
| `fallback` | `string`                               | no       | —       | Initials shown when no image is available             |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `status`   | `'online' \| 'offline' \| 'busy'`      | no       | —       | Status state.                                         |

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

- `--cascivo-color-accent-subtle`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/core`

## Tags

user, profile, image
