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

| Prop   | Type  | Required | Default | Description |
| ------ | ----- | -------- | ------- | ----------- | --- |
| `size` | `'sm' | 'md'`    | no      | `md`        | —   |

## Examples

### Default

```tsx
<Code>npx cascade add button</Code>
```

### In a sentence

Sits inline with surrounding text

```tsx
<Text>
  Run <Code>vp check</Code> before committing.
</Text>
```

### Small

```tsx
<Code size="sm">--cascivo-color-accent</Code>
```

## Design tokens

- `--cascivo-font-mono`
- `--cascivo-color-text`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-indicator`
- `--cascivo-text-xs`
- `--cascivo-text-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `code`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, code, inline, mono
