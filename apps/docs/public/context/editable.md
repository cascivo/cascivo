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

| Name            | Type                  | Required | Default | Description |
| --------------- | --------------------- | -------- | ------- | ----------- |
| `value`         | `string`              | Yes      | —       | —           |
| `onValueChange` | `(v: string) => void` | Yes      | —       | —           |
| `placeholder`   | `string`              | No       | —       | —           |
| `disabled`      | `boolean`             | No       | false   | —           |
| `submitOnBlur`  | `boolean`             | No       | true    | —           |
| `onCancel`      | `() => void`          | No       | —       | —           |

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

| Area                    | Level    | Note                                                                                     |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------- |
| token names             | strict   | Visual styling must resolve to the listed --cascivo-\* surface/border/accent/text tokens |
| placeholder copy        | flexible | Free, within tone guidance                                                               |
| submit-on-blur behavior | flexible | submitOnBlur toggles whether blurring confirms or cancels the edit                       |
