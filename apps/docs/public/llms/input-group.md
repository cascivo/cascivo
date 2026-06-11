# InputGroup

Prefix/suffix addon wrapper for Input; ButtonGroup collapses adjacent button borders

## Install

```bash
npx cascade add input-group
```

## Category

`inputs`

## Props

| Prop       | Type        | Required | Default | Description |
| ---------- | ----------- | -------- | ------- | ----------- |
| `prefix`   | `ReactNode` | no       | —       | —           |
| `suffix`   | `ReactNode` | no       | —       | —           |
| `children` | `ReactNode` | yes      | —       | —           |

## Examples

### With prefix

```tsx
<InputGroup prefix="https://">
  <Input placeholder="example.com" />
</InputGroup>
```

### ButtonGroup

```tsx
<ButtonGroup>
  <Button>Left</Button>
  <Button>Right</Button>
</ButtonGroup>
```

## Design tokens

- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-text-subtle`
- `--cascade-radius-input`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

form, input, addon, group, layout
