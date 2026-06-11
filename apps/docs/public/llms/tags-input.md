# TagsInput

Free-form multi-value chip input

## Install

```bash
npx cascade add tags-input
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `disabled`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string[]` | yes | — | — |
| `onValueChange` | `(v: string[]) => void` | yes | — | — |
| `placeholder` | `string` | no | — | — |
| `validate` | `(tag: string) => boolean` | no | — | — |
| `max` | `number` | no | — | — |
| `disabled` | `boolean` | no | `false` | — |

## Examples

### Basic

```tsx
<TagsInput value={['react', 'vue']} onValueChange={() => {}} placeholder="Add tag…" />
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-destructive`
- `--cascade-color-bg-subtle`
- `--cascade-radius-input`
- `--cascade-radius-full`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `textbox`
- **Keyboard:** Enter, ,, Backspace

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

form, tags, chips, multi, input
