# Toggle

**Category:** inputs  
**Description:** On/off switch built as an accessible button

## When to use

- Flipping a single binary setting that takes effect immediately (e.g. notifications on/off)
- On/off state where a physical switch metaphor reads better than a checkmark
- Settings screens where the change applies live without a separate submit

## When NOT to use

- Selecting items in a form that is submitted later — use Checkbox
- Choosing one option among several mutually exclusive labels — use SegmentedControl or Radio

## Anti-patterns

### A switch implies an instant on/off setting; agreement that is submitted with the form is a checkbox

**Bad:** `<Toggle label="I accept the terms" /> inside a submitted form`  
**Good:** `<Checkbox label="I accept the terms" />`  
**Why:** A switch implies an instant on/off setting; agreement that is submitted with the form is a checkbox

### The `label` prop renders visible text and is the accessible name; when a heading already names the control, use aria-label so the name is not shown (and read) twice

**Bad:** `<h3>Dark mode</h3><Toggle label="Dark mode" /> — the label repeats the heading`  
**Good:** `<h3>Dark mode</h3><Toggle aria-label="Dark mode" />`  
**Why:** The `label` prop renders visible text and is the accessible name; when a heading already names the control, use aria-label so the name is not shown (and read) twice

## Related components

- **Checkbox** (alternative): Use for form selections submitted later rather than instant settings
- **SegmentedControl** (alternative): Use when choosing among several exclusive options, not just on/off

## Accessibility rationale

Renders a <button role="switch"> with aria-checked reflecting state, so assistive tech announces it as a switch and Space/Enter toggle it via native button activation.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `checked` | `boolean` | No | — | Whether the control is checked (controlled). |
| `defaultChecked` | `boolean` | No | false | Whether the control is checked on first render (uncontrolled). |
| `onValueChange` | `(checked: boolean) => void` | No | — | Called with the new checked state when the switch is toggled. |
| `onChange` | `(checked: boolean) => void` | No | — | Deprecated: use onValueChange (same checked boolean). |
| `label` | `string` | No | — | Visible text label beside the switch; it also becomes the accessible name. When a heading already labels the control, omit this and pass aria-label instead to avoid duplicated text. |
| `size` | `'sm' \| 'md'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Uncontrolled

```jsx
<Toggle label="Notifications" defaultChecked />
```

### Controlled

```jsx
<Toggle checked={enabled} onValueChange={setEnabled} label="Dark mode" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Track and thumb colors must resolve to --cascivo-color-* / radius / focus-ring tokens |
| label copy | flexible | Optional label describing the setting being toggled |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Toggle component (inputs). On/off switch built as an accessible button

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Toggle is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-border-strong, --cascivo-color-surface, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "switch", WCAG 2.2-AA, keyboard: Space/Enter. Keep it AA.

Do not change (strict): token names — Track and thumb colors must resolve to --cascivo-color-* / radius / focus-ring tokens
Flexible: label copy.

Do not invent props, tokens, or global viewport media queries.
```
