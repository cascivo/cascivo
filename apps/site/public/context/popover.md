# Popover

**Category:** overlay  
**Description:** Anchored floating panel built on CSS Anchor Positioning + Popover API

## When to use

- Showing rich, interactive content anchored to a trigger that the user must explicitly open by clicking
- Lightweight transient panels (forms, pickers, detail cards) that do not need to block the rest of the page

## When NOT to use

- A short, non-interactive text hint on hover/focus — use Tooltip
- A task that must capture focus and block interaction with the page — use Modal
- Preview content revealed on hover without a click — use HoverCard

## Anti-patterns

### Tooltips are non-interactive and hover-driven; interactive content needs a click-opened dialog popover that users can move focus into

**Bad:** `<Tooltip content={<form>...</form>}>`  
**Good:** `<Popover><PopoverTrigger>…</PopoverTrigger><PopoverContent><form>…</form></PopoverContent></Popover>`  
**Why:** Tooltips are non-interactive and hover-driven; interactive content needs a click-opened dialog popover that users can move focus into

## Related components

- **Tooltip** (alternative): Use for brief non-interactive hints, not interactive content
- **HoverCard** (alternative): Use when the panel should open on hover rather than click
- **Modal** (alternative): Use when the overlay must be blocking and focus-trapping

## Accessibility rationale

The trigger is a real <button> with aria-haspopup="dialog" and aria-expanded reflecting open state, and the panel uses role="dialog" via the native Popover API so Escape-to-close and light-dismiss come from the platform rather than custom handlers.

## Props

| Name           | Type                      | Required | Default | Description                                      |
| -------------- | ------------------------- | -------- | ------- | ------------------------------------------------ | --- | ------ | ---------------------------------- |
| `children`     | `React.ReactNode`         | Yes      | —       | A PopoverTrigger and PopoverContent pair.        |
| `open`         | `boolean`                 | No       | —       | Whether the component is open (controlled).      |
| `onOpenChange` | `(open: boolean) => void` | No       | —       | Called with the next open state when it changes. |
| `placement`    | `'top'                    | 'bottom' | 'left'  | 'right'`                                         | No  | bottom | Placement relative to the trigger. |
| `offset`       | `number`                  | No       | 4       | Distance (px) between the trigger and the panel. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Basic

```jsx
<Popover>
  <PopoverTrigger>Open settings</PopoverTrigger>
  <PopoverContent>
    <form>…</form>
  </PopoverContent>
</Popover>
```

### Controlled with placement

```jsx
<Popover open={isOpen} onOpenChange={setIsOpen} placement="top">
  <PopoverTrigger>Filters</PopoverTrigger>
  <PopoverContent>
    <FilterForm />
  </PopoverContent>
</Popover>
```

## Boundaries

| Area        | Level    | Note                                                                      |
| ----------- | -------- | ------------------------------------------------------------------------- |
| token names | strict   | Panel styling must resolve to the listed --cascivo-\* tokens              |
| content     | flexible | Trigger and panel content are arbitrary children supplied by the consumer |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Popover component (overlay). Anchored floating panel built on CSS Anchor Positioning + Popover API

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Popover is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-md, --cascivo-shadow-md, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "dialog", WCAG 2.2-AA, keyboard: Escape. Keep it AA.

Do not change (strict): token names — Panel styling must resolve to the listed --cascivo-* tokens
Flexible: content.

Do not invent props, tokens, or global viewport media queries.
```
