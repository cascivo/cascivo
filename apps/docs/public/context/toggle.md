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

## Related components

- **Checkbox** (alternative): Use for form selections submitted later rather than instant settings
- **SegmentedControl** (alternative): Use when choosing among several exclusive options, not just on/off

## Accessibility rationale

Renders a <button role="switch"> with aria-checked reflecting state, so assistive tech announces it as a switch and Space/Enter toggle it via native button activation.

## Props

| Name             | Type                         | Required | Default | Description |
| ---------------- | ---------------------------- | -------- | ------- | ----------- | --- |
| `checked`        | `boolean`                    | No       | —       | —           |
| `defaultChecked` | `boolean`                    | No       | false   | —           |
| `onChange`       | `(checked: boolean) => void` | No       | —       | —           |
| `label`          | `string`                     | No       | —       | —           |
| `size`           | `'sm'                        | 'md'`    | No      | md          | —   |
| `disabled`       | `boolean`                    | No       | false   | —           |

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
<Toggle checked={enabled} onChange={setEnabled} label="Dark mode" />
```

## Boundaries

| Area        | Level    | Note                                                                                   |
| ----------- | -------- | -------------------------------------------------------------------------------------- |
| token names | strict   | Track and thumb colors must resolve to --cascivo-color-\* / radius / focus-ring tokens |
| label copy  | flexible | Optional label describing the setting being toggled                                    |
