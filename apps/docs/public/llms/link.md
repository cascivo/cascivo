# Link

Styled anchor for navigation, standalone or inline within prose

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add link
```

Or use it from the prebuilt package without copying:

```tsx
import { Link } from '@cascivo/react'
```

## Category

`navigation`

## Variants

- `standalone`
- `inline`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop       | Type          | Required  | Default | Description  |
| ---------- | ------------- | --------- | ------- | ------------ | ---- | --- |
| `variant`  | `'standalone' | 'inline'` | no      | `standalone` | —    |
| `size`     | `'sm'         | 'md'      | 'lg'`   | no           | `md` | —   |
| `external` | `boolean`     | no        | `false` | —            |
| `href`     | `string`      | no        | —       | —            |

## Examples

### Standalone

```tsx
<Link href="/docs">View documentation</Link>
```

### Inline

Inline links inherit the surrounding font size and stay underlined.

```tsx
<p>
  Read the{' '}
  <Link variant="inline" href="/guide">
    guide
  </Link>{' '}
  first.
</p>
```

### External

Opens in a new tab with rel="noreferrer" and a visual indicator.

```tsx
<Link external href="https://example.com">
  Example
</Link>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `link`
- **Keyboard:** Enter

## Dependencies

- `@cascivo/core`

## Tags

link, anchor, navigation
