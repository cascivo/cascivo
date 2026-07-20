# InputGroup

Prefix/suffix addon wrapper for Input; InputGroupAddon renders inline icons/units inside the field border; ButtonGroup collapses adjacent button borders

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add input-group
```

Or use it from the prebuilt package without copying:

```tsx
import { InputGroup } from '@cascivo/react'
```

## Category

`inputs`

## Props

| Prop       | Type        | Required | Default | Description                                            |
| ---------- | ----------- | -------- | ------- | ------------------------------------------------------ |
| `prefix`   | `ReactNode` | no       | —       | Content rendered before the input (leading adornment). |
| `suffix`   | `ReactNode` | no       | —       | Content rendered after the input (trailing adornment). |
| `children` | `ReactNode` | yes      | —       | Content rendered inside the component.                 |

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

- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-input`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

form, input, addon, group, layout

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
