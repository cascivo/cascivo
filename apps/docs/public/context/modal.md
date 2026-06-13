# Modal

**Category:** overlay  
**Description:** Accessible dialog overlay using native <dialog> element

## When to use

- Presenting focused content or a task that must interrupt the current flow
- Confirmations and forms that require the user to act before continuing
- Cases needing a modal backdrop, focus trap, and Escape-to-close from the native <dialog>

## When NOT to use

- Anchored, non-modal content next to a trigger — use Popover
- A side panel or drawer for secondary content — use Sheet
- A destructive confirmation with a clear yes/no decision — use AlertDialog

## Anti-patterns

### The open prop drives showModal()/close() on the native dialog, which manages the top layer, backdrop, and focus trap; hiding with CSS breaks all three

**Bad:** `Rendering <Modal> mounted but driving visibility with CSS display`  
**Good:** `Control visibility with the open prop`  
**Why:** The open prop drives showModal()/close() on the native dialog, which manages the top layer, backdrop, and focus trap; hiding with CSS breaks all three

## Related components

- **AlertDialog** (alternative): Use AlertDialog for a focused confirm/cancel decision, especially destructive ones
- **Sheet** (alternative): Use Sheet for an edge-anchored drawer rather than a centered dialog
- **Popover** (alternative): Use Popover for lightweight, non-modal content anchored to a trigger

## Accessibility rationale

Built on the native <dialog> element so showModal() provides a real focus trap, top-layer rendering, and inert background for free; role="dialog" plus aria-labelledby/aria-describedby tie the title and description to the dialog, and Escape closes via the platform.

## Props

| Name          | Type         | Required | Default | Description |
| ------------- | ------------ | -------- | ------- | ----------- | --- | --- |
| `open`        | `boolean`    | No       | false   | —           |
| `onClose`     | `() => void` | No       | —       | —           |
| `title`       | `string`     | No       | —       | —           |
| `description` | `string`     | No       | —       | —           |
| `size`        | `'sm'        | 'md'     | 'lg'`   | No          | md  | —   |

## Tokens

- `--cascade-color-surface-overlay`
- `--cascade-color-border`
- `--cascade-radius-modal`
- `--cascade-shadow-xl`
- `--cascade-focus-ring`

## Examples

### Basic modal

```jsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm action">
  <p>Are you sure?</p>
</Modal>
```

## Boundaries

| Area                       | Level    | Note                                                                                                   |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------ | --- | -------------------- |
| token names                | strict   | Overlay surface, border, radius, shadow, and focus-ring must resolve to the listed --cascade-\* tokens |
| size                       | flexible | sm                                                                                                     | md  | lg, defaulting to md |
| title / description / body | flexible | All optional; body accepts arbitrary children                                                          |
