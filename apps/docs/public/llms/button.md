# Button

Triggers an action or event

## Install

```bash
npx cascade add button
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

- `--cascade-color-accent`
- `--cascade-color-accent-hover`
- `--cascade-color-accent-active`
- `--cascade-color-text-on-accent`
- `--cascade-color-destructive`
- `--cascade-radius-button`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascade-ui/core`

## Tags

action, form, interactive
