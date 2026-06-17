# Resizable

**Category:** layout  
**Description:** Two-pane splitter whose divider can be dragged or keyboard-nudged to reallocate space

## When to use

- Letting users reallocate space between two adjacent regions, e.g. an editor and a preview
- Side panels or inspectors whose width the user should control
- Master/detail layouts where one pane may need more room than the default

## When NOT to use

- Fixed layouts where the split should never change — use plain flex/grid
- More than two siblings need independent resizing — compose nested splitters instead

## Anti-patterns

### A single separator can only mediate one boundary between two panes

**Bad:** `<Resizable> wrapping three panes`  
**Good:** `Nest two Resizable splitters so each divider controls exactly one boundary`  
**Why:** A single separator can only mediate one boundary between two panes

## Related components

- **Slider** (alternative): Use a slider when picking a value, not when allocating layout space

## Accessibility rationale

The divider is a focusable role="separator" with aria-orientation and aria-valuenow/min/max reflecting the percentage split; arrow keys nudge the ratio and Home/End snap to the configured bounds, matching the APG window-splitter pattern.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | — | Exactly two panes |
| `orientation` | `'horizontal' | 'vertical'` | No | horizontal | — |
| `defaultRatio` | `number` | No | 0.5 | — |
| `ratio` | `number` | No | — | Controlled ratio (0–1) |
| `minRatio` | `number` | No | 0.1 | — |
| `maxRatio` | `number` | No | 0.9 | — |
| `onRatioChange` | `(ratio: number) => void` | No | — | — |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Horizontal split

```jsx
<Resizable>
  <Editor />
  <Preview />
</Resizable>
```

### Vertical with bounds

```jsx
<Resizable orientation="vertical" defaultRatio={0.3} minRatio={0.2} maxRatio={0.8}>
  <Toolbar />
  <Canvas />
</Resizable>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| sizing | strict | Pane sizes derive from a single --cascivo-resizable-ratio custom property via flex |
| min/max ratio | flexible | Consumer-defined clamp range |
