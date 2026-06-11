# InputGroup

Prefix/suffix addon wrapper for Input; InputGroupAddon renders inline icons/units inside the field border; ButtonGroup collapses adjacent button borders

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

### With leading icon addon

```tsx
<InputGroup>
  <InputGroupAddon>
    <svg viewBox="0 0 16 16" width="16" height="16">
      <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </InputGroupAddon>
  <Input placeholder="Search…" aria-label="Search" />
</InputGroup>
```

### With trailing unit addon

```tsx
<InputGroup>
  <Input placeholder="0.00" aria-label="Weight" />
  <InputGroupAddon align="inline-end">kg</InputGroupAddon>
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
