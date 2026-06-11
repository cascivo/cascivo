# Center

Horizontally centered container with a configurable max-width.

## Install

```bash
npx cascade add layout/center
```

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

- `--cascade-space-4`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, center, wrapper
