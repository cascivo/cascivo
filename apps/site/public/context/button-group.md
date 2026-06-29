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

| Name              | Type          | Required    | Default | Description                                                               |
| ----------------- | ------------- | ----------- | ------- | ------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `orientation`     | `'horizontal' | 'vertical'` | No      | horizontal                                                                | Layout orientation of the component. |
| `size`            | `'sm'         | 'md'        | 'lg'`   | No                                                                        | md                                   | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `roving`          | `boolean`     | No          | false   | When true, uses roving tabindex so arrow keys move focus between buttons. |
| `loop`            | `boolean`     | No          | false   | When true, navigation wraps around from end to start.                     |
| `aria-label`      | `string`      | No          | —       | Accessible label used when no visible label is present.                   |
| `aria-labelledby` | `string`      | No          | —       | Id of the element that labels this component.                             |

## Tokens

- `--cascivo-button-radius`
- `--cascivo-radius-control`

## Examples

### Joined actions

```jsx
<ButtonGroup aria-label="Text alignment">
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>
```

### Vertical with roving focus

```jsx
<ButtonGroup orientation="vertical" roving aria-label="View">
  <Button>List</Button>
  <Button>Grid</Button>
</ButtonGroup>
```

## Boundaries

| Area        | Level    | Note                                                                                                               |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| token names | strict   | Outer corner radius must resolve to --cascivo-button-radius / --cascivo-radius-control to match standalone buttons |
| children    | flexible | Any focusable controls (Button, IconButton, links) may be grouped                                                  |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ButtonGroup component (inputs). Visually joins a set of related buttons into a single segmented control

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ButtonGroup is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-button-radius, --cascivo-radius-control

Accessibility: role "group", WCAG 2.2-AA, keyboard: ArrowRight/ArrowLeft/ArrowUp/ArrowDown/Home/End. Keep it AA.

Do not change (strict): token names — Outer corner radius must resolve to --cascivo-button-radius / --cascivo-radius-control to match standalone buttons
Flexible: children.

Do not invent props, tokens, or global viewport media queries.
```
