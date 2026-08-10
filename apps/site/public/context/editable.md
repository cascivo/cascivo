# Editable

**Category:** inputs  
**Description:** Inline click-to-edit text field

## When to use

- Editing a single piece of text in place where the value is normally read-only — titles, names, labels
- Keeping the page layout stable: the preview and the edit input occupy the same spot
- Letting users opt into editing by clicking, without a separate edit mode or form

## When NOT to use

- A field that is always meant to be edited — use Input inside a Form instead
- Multi-line or rich text — this is a single-line input only
- Collecting several related values at once — use a Form with grouped fields

## Anti-patterns

### Inline edit hides the affordance behind a click; required form fields should be visibly editable from the start

**Bad:** `<Editable value={email} onValueChange={save} /> as a primary form control`  
**Good:** `<Input label="Email" value={email} onChange={...} />`  
**Why:** Inline edit hides the affordance behind a click; required form fields should be visibly editable from the start

## Related components

- **Input** (alternative): Use Input when the field is always editable rather than click-to-reveal

## Accessibility rationale

The preview renders as a real <button> so it is keyboard-focusable and announces as an actionable control; while editing, Enter confirms and Escape cancels, and focus is moved into the input and its text selected so keyboard users can immediately type.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | Yes | — | The controlled value. |
| `onValueChange` | `(v: string) => void` | Yes | — | Called with the new value when it changes. |
| `placeholder` | `string` | No | — | Placeholder text shown when the field is empty. |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `submitOnBlur` | `boolean` | No | true | When true, commits the edit when the field loses focus. |
| `onCancel` | `() => void` | No | — | Called when the edit is cancelled. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Editable value="Click to edit" onValueChange={() => {}} />
```

### With placeholder

```jsx
<Editable value="" onValueChange={() => {}} placeholder="Enter text" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Visual styling must resolve to the listed --cascivo-* surface/border/accent/text tokens |
| placeholder copy | flexible | Free, within tone guidance |
| submit-on-blur behavior | flexible | submitOnBlur toggles whether blurring confirms or cancels the edit |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Editable component (inputs). Inline click-to-edit text field

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Editable is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-bg-subtle, --cascivo-radius-sm, --cascivo-focus-ring

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Escape. Keep it AA.

Do not change (strict): token names — Visual styling must resolve to the listed --cascivo-* surface/border/accent/text tokens
Flexible: placeholder copy, submit-on-blur behavior.

Do not invent props, tokens, or global viewport media queries.
```
