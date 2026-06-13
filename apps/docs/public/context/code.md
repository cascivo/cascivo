# Code

**Category:** display  
**Description:** Inline code span for identifiers, commands, and short snippets

## When to use

- Marking up an inline identifier, command, path, or token within prose
- Distinguishing literal code from surrounding text with a monospace span

## When NOT to use

- Multi-line code blocks with syntax highlighting — use a <pre> block
- Keyboard shortcuts the user should press — use Kbd

## Anti-patterns

### Code marks literal code; key presses are semantically Kbd

**Bad:** `<Code>Press Cmd+K</Code>`  
**Good:** `<Kbd>⌘</Kbd> <Kbd>K</Kbd>`  
**Why:** Code marks literal code; key presses are semantically Kbd

## Related components

- **Kbd** (alternative): Kbd is for keys to press, not code to read
- **Prose** (pairs-with): Prose styles inline <code> automatically in authored content

## Accessibility rationale

Renders a native <code> element so assistive tech can expose the content as code; relies on monospace and surface, not color alone, to distinguish it

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' | 'md'` | No | md | — |

## Tokens

- `--cascade-font-mono`
- `--cascade-color-text`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-radius-indicator`
- `--cascade-text-xs`
- `--cascade-text-sm`

## Examples

### Default

```jsx
<Code>npx cascade add button</Code>
```

### In a sentence

Sits inline with surrounding text

```jsx
<Text>Run <Code>vp check</Code> before committing.</Text>
```

### Small

```jsx
<Code size="sm">--cascade-color-accent</Code>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| size | flexible | sm fits dense UI; md matches body text |
| token names | strict | Font and surface must resolve to --cascade-font-mono and --cascade-* tokens |
