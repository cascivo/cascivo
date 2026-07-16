# HeaderPanel

**Category:** navigation  
**Description:** Non-modal panel anchored below the shell header at the inline-end edge — hosts notifications, app switcher, user settings

## When to use

- Hosting a non-modal panel anchored under the shell header (notifications, switcher, settings)
- Showing supplementary content triggered by a ShellHeader icon action
- Light-dismiss content that should not block the rest of the app

## When NOT to use

- Content that must block interaction until resolved — use Modal
- A small contextual menu attached to a trigger — use Dropdown or Popover

## Anti-patterns

### HeaderPanel is non-modal and light-dismissable; blocking flows need modal semantics

**Bad:** `Using HeaderPanel for a blocking confirmation`  
**Good:** `<Modal> or <AlertDialog> for decisions that must block`  
**Why:** HeaderPanel is non-modal and light-dismissable; blocking flows need modal semantics

## Related components

- **ShellHeader** (pairs-with): Opened by a ShellHeader action whose active state mirrors the panel open state
- **Switcher** (contains): A Switcher commonly lives inside a HeaderPanel

## Accessibility rationale

role="region" with the label prop names the panel as a landmark; Escape closes it and focus is managed so keyboard users can dismiss it without a mouse

## Props

| Name        | Type                | Required | Default | Description                                              |
| ----------- | ------------------- | -------- | ------- | -------------------------------------------------------- |
| `open`      | `boolean`           | Yes      | —       | Controlled open state                                    |
| `onClose`   | `() => void`        | Yes      | —       | Called on close button click or light-dismiss            |
| `label`     | `string`            | Yes      | —       | Accessible label for the region (shown as header title)  |
| `children`  | `ReactNode`         | Yes      | —       | Content rendered inside the component.                   |
| `labels`    | `HeaderPanelLabels` | No       | —       | i18n overrides                                           |
| `className` | `string`            | No       | —       | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-shell-header-block-size`
- `--cascivo-shell-panel-inline-size`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`

## Examples

### Notification panel

Pair with a ShellHeader action: action active=open, onAction toggles open

```jsx
<HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
  <p>3 unread messages</p>
</HeaderPanel>
```

## Boundaries

| Area        | Level    | Note                                                                  |
| ----------- | -------- | --------------------------------------------------------------------- |
| content     | flexible | Children are arbitrary panel content                                  |
| token names | strict   | Surface, shadow, and sizing must resolve to --cascivo-\* shell tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo HeaderPanel component (navigation). Non-modal panel anchored below the shell header at the inline-end edge — hosts notifications, app switcher, user settings

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

HeaderPanel is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-shell-header-block-size, --cascivo-shell-panel-inline-size, --cascivo-color-surface, --cascivo-color-border, --cascivo-shadow-md, --cascivo-motion-enter

Accessibility: role "region", WCAG 2.2-AA, keyboard: Escape/Tab. Keep it AA.

Do not change (strict): token names — Surface, shadow, and sizing must resolve to --cascivo-* shell tokens
Flexible: content.

Do not invent props, tokens, or global viewport media queries.
```
