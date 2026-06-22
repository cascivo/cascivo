# Dropdown

**Category:** overlay  
**Description:** Menu of actions revealed from a trigger

## When to use

- Revealing a short menu of actions from a trigger button (row actions, "More" overflow, account menu)
- Grouping related commands behind one affordance with optional icons and separators

## When NOT to use

- Selecting a persistent value for a form — use Select or Combobox
- A global searchable command palette — use CommandMenu; right-click context actions — use ContextMenu

## Anti-patterns

### Dropdown items are role="menuitem" actions fired via onSelect — there is no selected-value semantics for assistive tech or forms

**Bad:** `Using Dropdown to choose a form value and reading the selection as field state`  
**Good:** `Use Select/Combobox which expose role="combobox" and a controlled value`  
**Why:** Dropdown items are role="menuitem" actions fired via onSelect — there is no selected-value semantics for assistive tech or forms

## Related components

- **Select** (alternative): Use for choosing and persisting a single form value
- **CommandMenu** (alternative): Use for a searchable global action palette
- **Button** (pairs-with): The trigger is typically a Button passed via the trigger prop

## Accessibility rationale

The menu is role="menu" with role="menuitem" buttons and roving tabindex; the trigger gets aria-haspopup="menu" and aria-expanded via cloneElement; arrow/Home/End/Enter/Escape are handled and focus returns to the trigger on select or close, and popover="auto" provides light-dismiss synced back to state via the toggle event

## Props

| Name           | Type                                                                                            | Required      | Default | Description  |
| -------------- | ----------------------------------------------------------------------------------------------- | ------------- | ------- | ------------ | --- |
| `trigger`      | `ReactElement`                                                                                  | Yes           | —       | —            |
| `items`        | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; separator?: boolean }[]` | Yes           | —       | —            |
| `onSelect`     | `(value: string) => void`                                                                       | No            | —       | —            |
| `placement`    | `'bottom-start'                                                                                 | 'bottom-end'` | No      | bottom-start | —   |
| `open`         | `boolean`                                                                                       | No            | —       | —            |
| `onOpenChange` | `(open: boolean) => void`                                                                       | No            | —       | —            |

## Tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-md`
- `--cascivo-z-dropdown`

## Examples

### Basic

```jsx
<Dropdown
  trigger={<Button>Actions</Button>}
  items={[{ label: 'Edit', value: 'edit' }]}
  onSelect={handle}
/>
```

## Boundaries

| Area                       | Level    | Note                                                                               |
| -------------------------- | -------- | ---------------------------------------------------------------------------------- |
| trigger element            | flexible | Any ReactElement works as the trigger; ref and aria props are merged in            |
| controlled vs uncontrolled | flexible | Supports open + onOpenChange or fully internal state                               |
| token names                | strict   | Menu styling resolves to semantic --cascivo-color-\* / --cascivo-z-dropdown tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Dropdown component (overlay). Menu of actions revealed from a trigger

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Dropdown is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface-overlay, --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-radius-md, --cascivo-z-dropdown

Accessibility: role "menu", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Home/End/Enter/Space/Escape. Keep it AA.

Do not change (strict): token names — Menu styling resolves to semantic --cascivo-color-* / --cascivo-z-dropdown tokens
Flexible: trigger element, controlled vs uncontrolled.

Do not invent props, tokens, or global viewport media queries.
```
