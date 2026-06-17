# Collapsible

**Category:** display  
**Description:** A single disclosure region toggled open and closed by its trigger

## When to use

- Hiding a single secondary block until the user asks for it
- Progressive disclosure of details, advanced options, or supplementary text
- Toggling one region whose state you may want to control externally

## When NOT to use

- Several mutually related sections — use Accordion instead
- Transient overlays anchored to a trigger — use Dropdown or Popover

## Anti-patterns

### Accordion manages single/multiple-open semantics and shared keyboard navigation

**Bad:** `Stacking many Collapsibles to emulate an accordion`  
**Good:** `Use Accordion when sections are a related set`  
**Why:** Accordion manages single/multiple-open semantics and shared keyboard navigation

## Related components

- **Accordion** (alternative): Multi-region disclosure; Collapsible is the single-region case

## Accessibility rationale

The trigger is a native button exposing aria-expanded and aria-controls; the region is labelled by the trigger, so screen readers announce the disclosure state and target

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | No | — | Controlled open state |
| `defaultOpen` | `boolean` | No | false | Initial open state for uncontrolled use |
| `onOpenChange` | `(open: boolean) => void` | No | — | Called whenever the open state should change |
| `trigger` | `ReactNode` | Yes | — | Content rendered inside the built-in trigger button |
| `disabled` | `boolean` | No | false | Disables the trigger button |
| `children` | `ReactNode` | No | — | Content of the collapsible region |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`
- `--cascivo-space-3`
- `--cascivo-duration-200`
- `--cascivo-ease-out`

## Examples

### Uncontrolled

```jsx
<Collapsible trigger="Show details">
  <p>Hidden content revealed on toggle.</p>
</Collapsible>
```

### Open by default

```jsx
<Collapsible defaultOpen trigger="Details">
  <p>Visible initially.</p>
</Collapsible>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| open state | flexible | Controlled or uncontrolled via open / defaultOpen |
| trigger markup | strict | Always rendered as a native button for keyboard and a11y correctness |
