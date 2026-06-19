# Button

Triggers an action or event

## Install

```bash
npx cascivo add button
```

## Category

`inputs`

## Variants

- `primary`
- `secondary`
- `ghost`
- `destructive`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `loading`

## Props

| Prop       | Type                                         | Required    | Default | Description    |
| ---------- | -------------------------------------------- | ----------- | ------- | -------------- | ---- | --------- | --- |
| `variant`  | `'primary'                                   | 'secondary' | 'ghost' | 'destructive'` | no   | `primary` | —   |
| `size`     | `'sm'                                        | 'md'        | 'lg'`   | no             | `md` | —         |
| `loading`  | `boolean`                                    | no          | `false` | —              |
| `disabled` | `boolean`                                    | no          | `false` | —              |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>` | no          | —       | —              |

## Examples

### Primary

```tsx
<Button>Click me</Button>
```

### Loading

```tsx
<Button loading>Saving…</Button>
```

### Destructive

```tsx
<Button variant="destructive">Delete</Button>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`
- `--cascivo-disabled-opacity`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

action, form, interactive
