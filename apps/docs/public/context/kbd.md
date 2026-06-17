# Kbd

**Category:** display  
**Description:** Displays a keyboard key or shortcut

## When to use

- Showing a keyboard key or shortcut the user should press
- Documenting hotkeys in menus, tooltips, or help text

## When NOT to use

- Inline code, commands, or identifiers — use Code
- A short label that is not a key press — use Badge or Text

## Anti-patterns

### Kbd is for keys to press, not shell commands or code

**Bad:** `<Kbd>npm install</Kbd>`  
**Good:** `<Code>npm install</Code>`  
**Why:** Kbd is for keys to press, not shell commands or code

## Related components

- **Code** (alternative): Code marks literal code; Kbd marks keys to press

## Accessibility rationale

Renders a native <kbd> element so assistive tech identifies the content as keyboard input; compose multiple <kbd> for a chord rather than encoding the combination in one string

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' | 'md'` | No | md | — |

## Tokens

- `--cascivo-color-text-subtle`
- `--cascivo-color-surface-raised`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-sm`

## Examples

### Single key

```jsx
<Kbd>⌘</Kbd>
```

### Shortcut

Compose multiple keys to show a shortcut

```jsx
<span><Kbd>⌘</Kbd> + <Kbd>K</Kbd></span>
```

### Small

```jsx
<Kbd size="sm">Esc</Kbd>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| size | flexible | sm fits inline help; md matches body text |
| token names | strict | Surface and border must resolve to --cascivo-* tokens |
