# Center

Horizontally centered container with a configurable max-width.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/center
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop       | Type     | Required | Default | Description         |
| ---------- | -------- | -------- | ------- | ------------------- |
| `maxWidth` | `string` | no       | —       | CSS max-width value |

## Examples

### Centered content

Centered container with custom max-width

```tsx
<Center maxWidth="60rem">
  <p>Content</p>
</Center>
```

## Design tokens

- `--cascivo-space-4`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, center, wrapper
