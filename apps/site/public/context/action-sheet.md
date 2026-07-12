# ActionSheet

**Category:** overlay  
**Description:** Bottom-rising sheet of discrete actions (iOS action-sheet pattern) with a Cancel button

## When to use

- A short list of discrete actions on a touch surface, rising from the bottom
- Confirming or choosing among a few operations (e.g. Share, Edit, Delete) on mobile
- A mobile-first alternative to an anchored dropdown menu when there is no trigger anchor

## When NOT to use

- A single yes/no confirmation — use AlertDialog
- A form or scrollable content — use BottomSheet or Sheet
- A menu anchored to a trigger on desktop — use Menu or Dropdown

## Anti-patterns

### A one-action sheet is a confirmation; AlertDialog states the decision clearly

**Bad:** `<ActionSheet actions={[{ label: "OK", onSelect }]} />`  
**Good:** `<AlertDialog title="Delete item?" />`  
**Why:** A one-action sheet is a confirmation; AlertDialog states the decision clearly

## Related components

- **BottomSheet** (alternative): Use BottomSheet for rich/resizable content; ActionSheet is a fixed list of actions
- **Menu** (alternative): Use Menu for a trigger-anchored dropdown on pointer-first surfaces

## Accessibility rationale

Renders role="menu" with role="menuitem" buttons under vertical roving focus (Arrow keys, Home/End, wrapping). The title labels the menu via aria-labelledby (or a built-in label otherwise) and the description via aria-describedby. FocusScope traps and restores focus; DismissableLayer handles Escape and outside-pointer dismissal; a separate Cancel button provides an explicit non-destructive exit.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | No | — | Whether the component is open (controlled). |
| `defaultOpen` | `boolean` | No | — | Whether the component is open on first render (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void` | No | — | Called with the next open state when it changes. |
| `actions` | `ActionSheetAction[]` | Yes | — | Choices, each with a label, onSelect, and optional destructive/disabled flags |
| `title` | `React.ReactNode` | No | — | Title text for the component. |
| `description` | `React.ReactNode` | No | — | Supporting description text. |
| `showCancel` | `boolean` | No | true | When true, shows a cancel button below the actions. |
| `labels` | `{ cancel?: string; label?: string }` | No | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-z-overlay`

## Examples

### Basic

```jsx
<ActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Share photo"
  actions={[
    { label: 'Copy link', onSelect: copyLink },
    { label: 'Delete', onSelect: remove, destructive: true },
  ]}
/>
```

### Without cancel button

Escape and outside press still dismiss the sheet.

```jsx
<ActionSheet defaultOpen showCancel={false} actions={[{ label: "Archive", onSelect: archive }]} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| actions | flexible | Any number of actions; each may be destructive or disabled |
| open state | flexible | Controlled (open/onOpenChange) or uncontrolled (defaultOpen) |
| cancel | flexible | showCancel toggles the separate Cancel button (Escape/outside press still dismiss) |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ActionSheet component (overlay). Bottom-rising sheet of discrete actions (iOS action-sheet pattern) with a Cancel button

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ActionSheet is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-text-muted, --cascivo-radius-overlay, --cascivo-shadow-overlay, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-z-overlay

Accessibility: role "menu", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/Home/End/Enter/Space/Escape. Keep it AA.
Flexible: actions, open state, cancel.

Do not invent props, tokens, or global viewport media queries.
```
