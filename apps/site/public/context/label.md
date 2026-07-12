# Label

**Category:** inputs  
**Description:** Accessible caption for a form control

## When to use

- Naming a single form control (input, select, checkbox) so clicking the text focuses it
- Marking a field as required with a visible and screen-reader-announced indicator

## When NOT to use

- Labeling a group of controls — use a <fieldset>/<legend> instead
- Static body copy that is not associated with a control — use a plain text element

## Anti-patterns

### Without htmlFor the label is not programmatically associated, so click-to-focus and screen-reader naming break

**Bad:** `<Label>Email</Label><input id="email" />`  
**Good:** `<Label htmlFor="email">Email</Label><input id="email" />`  
**Why:** Without htmlFor the label is not programmatically associated, so click-to-focus and screen-reader naming break

### The required marker is rendered for you with an accessible text alternative; a hand-added asterisk is silent to screen readers

**Bad:** `<Label required>Email <span>*</span></Label>`  
**Good:** `<Label required>Email</Label>`  
**Why:** The required marker is rendered for you with an accessible text alternative; a hand-added asterisk is silent to screen readers

## Related components

- **Field** (contained-by): Field composes Label with a control, description, and error and wires the ids automatically
- **Input** (pairs-with): A label names the input it points at via htmlFor

## Accessibility rationale

Renders a native <label> so the platform handles click-to-focus and accessible naming; the required marker pairs an aria-hidden asterisk with visually-hidden localized text so the requirement is both seen and announced

## Props

| Name       | Type                    | Required | Default | Description                                                                                       |
| ---------- | ----------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `htmlFor`  | `string`                | No       | —       | Id of the form control this label is associated with.                                             |
| `asChild`  | `boolean`               | No       | false   | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `required` | `boolean`               | No       | false   | When true, marks the field as required.                                                           |
| `disabled` | `boolean`               | No       | false   | When true, disables the control and removes it from the tab order.                                |
| `children` | `ReactNode`             | Yes      | —       | Content rendered inside the component.                                                            |
| `labels`   | `{ required?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).                                        |

## Tokens

- `--cascivo-space-1`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-font-medium`
- `--cascivo-leading-snug`
- `--cascivo-leading-none`
- `--cascivo-color-text`
- `--cascivo-color-destructive`

## Examples

### Basic

```jsx
<Label htmlFor="email">Email</Label>
```

### Required

```jsx
<Label htmlFor="email" required>
  Email
</Label>
```

### asChild

Render the label semantics onto a custom element via Slot.

```jsx
<Label asChild htmlFor="email">
  <span>Email</span>
</Label>
```

## Boundaries

| Area        | Level    | Note                                                         |
| ----------- | -------- | ------------------------------------------------------------ |
| token names | strict   | Colors and type must resolve to --cascivo-\* semantic tokens |
| label copy  | flexible | Free, within tone guidance                                   |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Label component (inputs). Accessible caption for a form control

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Label is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-1, --cascivo-font-sans, --cascivo-text-sm, --cascivo-font-medium, --cascivo-leading-snug, --cascivo-leading-none, --cascivo-color-text, --cascivo-color-destructive

Accessibility: role "label", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Colors and type must resolve to --cascivo-* semantic tokens
Flexible: label copy.

Do not invent props, tokens, or global viewport media queries.
```
