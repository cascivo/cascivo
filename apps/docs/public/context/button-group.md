# ButtonGroup

**Category:** inputs  
**Description:** Visually joins a set of related buttons into a single segmented control

## When to use

- Presenting several related, independent actions that read as one control (e.g. an editor toolbar)
- Visually grouping buttons that share context without implying mutual exclusivity

## When NOT to use

- The buttons represent a single selected value among options — use ToggleGroup
- The actions are unrelated and should read as separate buttons — lay them out with spacing instead

## Anti-patterns

### A group with no accessible name is announced as an unlabeled region; supply aria-label or aria-labelledby

**Bad:** `<ButtonGroup><Button>Bold</Button><Button>Italic</Button></ButtonGroup>`  
**Good:** `<ButtonGroup aria-label="Formatting"><Button>Bold</Button><Button>Italic</Button></ButtonGroup>`  
**Why:** A group with no accessible name is announced as an unlabeled region; supply aria-label or aria-labelledby

## Related components

- **ToggleGroup** (alternative): Use when the buttons select a value rather than fire independent actions
- **Button** (contains): A button group is a layout container for buttons

## Accessibility rationale

Exposes role="group" so assistive tech treats the buttons as one labeled set; optional roving focus lets arrow keys traverse the buttons as a single tab stop, matching toolbar expectations

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `orientation` | `'horizontal' | 'vertical'` | No | horizontal | — |
| `size` | `'sm' | 'md' | 'lg'` | No | md | — |
| `roving` | `boolean` | No | false | — |
| `loop` | `boolean` | No | false | — |
| `aria-label` | `string` | No | — | — |
| `aria-labelledby` | `string` | No | — | — |

## Tokens

- `--cascivo-button-radius`
- `--cascivo-radius-control`

## Examples

### Joined actions

```jsx
<ButtonGroup aria-label="Text alignment"><Button>Left</Button><Button>Center</Button><Button>Right</Button></ButtonGroup>
```

### Vertical with roving focus

```jsx
<ButtonGroup orientation="vertical" roving aria-label="View"><Button>List</Button><Button>Grid</Button></ButtonGroup>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Outer corner radius must resolve to --cascivo-button-radius / --cascivo-radius-control to match standalone buttons |
| children | flexible | Any focusable controls (Button, IconButton, links) may be grouped |
