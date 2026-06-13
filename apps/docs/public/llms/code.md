# Code

Inline code span for identifiers, commands, and short snippets

## Install

```bash
npx cascade add code
```

## Category

`display`

## Sizes

- `sm`
- `md`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' | 'md'` | no | `md` | — |

## Examples

### Default

```tsx
<Code>npx cascade add button</Code>
```

### In a sentence

Sits inline with surrounding text

```tsx
<Text>Run <Code>vp check</Code> before committing.</Text>
```

### Small

```tsx
<Code size="sm">--cascade-color-accent</Code>
```

## Design tokens

- `--cascade-font-mono`
- `--cascade-color-text`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-radius-indicator`
- `--cascade-text-xs`
- `--cascade-text-sm`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `code`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, code, inline, mono
