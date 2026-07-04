# MenuButton

**Category:** navigation  
**Description:** A button that opens an anchored action menu of one-shot commands

## When to use

- Exposing a small set of one-shot actions behind a single labeled button
- Toolbar or header overflow actions where each item runs a command on activation
- Action lists that need ArrowUp/ArrowDown roving focus and Enter/Space activation

## When NOT to use

- Choosing and persisting a value from options — use Select
- Right-click contextual actions on a target element — use ContextMenu
- A single action with no list — use a plain Button
- Rich interactive content (forms, pickers) rather than a list of commands — use Popover

## Anti-patterns

### role="menuitem" items do not model a selected value and dismiss the menu when activated, so they cannot represent persistent choices

**Bad:** `Rendering checkbox or radio state inside MenuButton items and treating selection as a chosen value`  
**Good:** `Use Select or MultiSelect for value selection; MenuButton items are one-shot actions that close the menu on activation`  
**Why:** role="menuitem" items do not model a selected value and dismiss the menu when activated, so they cannot represent persistent choices

### A trigger with no accessible name is unusable for screen-reader and voice-control users

**Bad:** `Leaving the trigger label empty with no visible text and no labels.open override`  
**Good:** `Provide visible label text, or pass labels.open / rely on the built-in i18n accessible name`  
**Why:** A trigger with no accessible name is unusable for screen-reader and voice-control users

## Related components

- **Menu** (alternative): Use Menu for fully composable trigger + item children; MenuButton is the prop-driven convenience form
- **ContextMenu** (alternative): Use ContextMenu when actions are triggered by right-click on a target rather than a button
- **Select** (alternative): Use Select when the user is picking a value instead of firing an action
- **Button** (contains): The trigger is a styled button that opens the menu

## Accessibility rationale

The trigger is a real <button> exposing aria-haspopup="menu", aria-expanded reflecting open state, and aria-controls pointing at the role="menu" panel. ArrowDown/Enter/Space open the menu and move focus to the first enabled item, ArrowUp opens and focuses the last item, ArrowUp/ArrowDown rove focus between items with wrap-around, disabled items are aria-disabled and skipped by roving focus, Escape closes and restores focus to the trigger, and Tab closes without trapping focus. DismissableLayer provides outside-pointer and Escape dismissal, and high-contrast plus reduced-motion preferences are honored in CSS.

## Props

| Name       | Type                                  | Required | Default     | Description                                             |
| ---------- | ------------------------------------- | -------- | ----------- | ------------------------------------------------------- |
| `label`    | `ReactNode`                           | Yes      | —           | Trigger button content                                  |
| `items`    | `MenuButtonItem[]`                    | Yes      | —           | Action items: { id, label, onSelect?, disabled? }       |
| `variant`  | `'primary' \| 'secondary' \| 'ghost'` | No       | 'secondary' | Trigger visual variant                                  |
| `size`     | `'sm' \| 'md' \| 'lg'`                | No       | 'md'        | Trigger size                                            |
| `disabled` | `boolean`                             | No       | false       | Disables the trigger                                    |
| `align`    | `'start' \| 'end'`                    | No       | 'start'     | Aligns the menu to the start or end edge of the trigger |
| `labels`   | `{ open?: string }`                   | No       | —           | Override the trigger accessible name                    |

## Tokens

- `--cascivo-color-primary`
- `--cascivo-color-primary-fg`
- `--cascivo-color-primary-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-control`
- `--cascivo-radius-overlay`
- `--cascivo-radius-item`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-z-dropdown`

## Examples

### Basic action menu

A secondary button that opens a list of actions

```jsx
<MenuButton
  label="Actions"
  items={[
    { id: 'edit', label: 'Edit', onSelect: () => edit() },
    { id: 'duplicate', label: 'Duplicate', onSelect: () => duplicate() },
    { id: 'delete', label: 'Delete', onSelect: () => remove(), disabled: !canDelete },
  ]}
/>
```

### End-aligned, primary

Aligns the menu to the trigger end edge

```jsx
<MenuButton
  label="Create"
  variant="primary"
  align="end"
  items={[
    { id: 'doc', label: 'New document', onSelect: createDoc },
    { id: 'folder', label: 'New folder', onSelect: createFolder },
  ]}
/>
```

## Boundaries

| Area               | Level    | Note                                                                     |
| ------------------ | -------- | ------------------------------------------------------------------------ |
| token names        | strict   | Trigger and menu styling must resolve to the listed --cascivo-\* tokens  |
| item content       | flexible | Each item label accepts arbitrary ReactNode; onSelect defines the action |
| trigger appearance | flexible | variant and size choose among the standard button looks and dimensions   |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo MenuButton component (navigation). A button that opens an anchored action menu of one-shot commands

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

MenuButton is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-primary, --cascivo-color-primary-fg, --cascivo-color-primary-hover, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-text, --cascivo-color-bg-subtle, --cascivo-radius-control, --cascivo-radius-overlay, --cascivo-radius-item, --cascivo-shadow-md, --cascivo-focus-ring, --cascivo-motion-enter, --cascivo-z-dropdown

Accessibility: role "menu", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Enter/Space/Escape/Tab. Keep it AA.

Do not change (strict): token names — Trigger and menu styling must resolve to the listed --cascivo-* tokens
Flexible: item content, trigger appearance.

Do not invent props, tokens, or global viewport media queries.
```
