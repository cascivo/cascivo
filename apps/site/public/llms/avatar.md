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

| Prop       | Type                                   | Required | Default | Description                                                                       |
| ---------- | -------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `src`      | `string`                               | no       | —       | Image source URL.                                                                 |
| `alt`      | `string`                               | no       | —       | Alternative text describing the image.                                            |
| `name`     | `string`                               | no       | —       | Full name — used to derive initials for the fallback and as the accessible label. |
| `fallback` | `string`                               | no       | —       | Explicit fallback text (initials/glyph); overrides initials derived from name.    |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').                             |
| `status`   | `'online' \| 'offline' \| 'busy'`      | no       | —       | Status state.                                                                     |

## Examples

### Image

```tsx
<Avatar src="/jane.jpg" alt="Jane Doe" />
```

### Initials from name

Derives initials automatically; also sets the accessible label.

```tsx
<Avatar name="Ada Lovelace" /> // renders "AL"
```

### Explicit fallback

```tsx
<Avatar fallback="JD" alt="Jane Doe" />
```

### With status

```tsx
<Avatar name="Jane Doe" status="online" />
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

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
