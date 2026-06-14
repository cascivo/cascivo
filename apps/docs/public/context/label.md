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

| Name       | Type                    | Required | Default | Description |
| ---------- | ----------------------- | -------- | ------- | ----------- |
| `htmlFor`  | `string`                | No       | —       | —           |
| `asChild`  | `boolean`               | No       | false   | —           |
| `required` | `boolean`               | No       | false   | —           |
| `disabled` | `boolean`               | No       | false   | —           |
| `children` | `ReactNode`             | Yes      | —       | —           |
| `labels`   | `{ required?: string }` | No       | —       | —           |

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
