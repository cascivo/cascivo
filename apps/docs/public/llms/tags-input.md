# TagsInput

Free-form multi-value chip input

## Install

```bash
npx cascivo add tags-input
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

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Enter, ,, Backspace

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, tags, chips, multi, input
