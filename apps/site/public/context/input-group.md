# InputGroup

**Category:** inputs  
**Description:** Prefix/suffix addon wrapper for Input; InputGroupAddon renders inline icons/units inside the field border; ButtonGroup collapses adjacent button borders

## When to use

- Attaching a prefix/suffix addon (protocol, currency, unit) to an Input so it reads as one field
- Placing a leading or trailing inline icon/unit inside the field border via InputGroupAddon
- Grouping adjacent buttons with collapsed shared borders via ButtonGroup

## When NOT to use

- A standalone field with no adornment — use Input directly
- Conveying meaning that the user must read via an addon — decorative addons are aria-hidden

## Anti-patterns

### InputGroupAddon is aria-hidden and decorative, so screen readers never announce it

**Bad:** `<InputGroupAddon>Required</InputGroupAddon> to convey field status`  
**Good:** `Use the Input error/hint props for meaningful text`  
**Why:** InputGroupAddon is aria-hidden and decorative, so screen readers never announce it

## Related components

- **Input** (contains): InputGroup composes around an Input to add prefix/suffix addons
- **Button** (contains): ButtonGroup arranges adjacent Buttons with merged borders

## Accessibility rationale

Inline addons are marked aria-hidden because they are purely decorative units/icons, so the wrapped Input keeps its own accessible name; ButtonGroup uses role="group" to convey that its buttons form a related set.

## Props

| Name       | Type        | Required | Default | Description |
| ---------- | ----------- | -------- | ------- | ----------- |
| `prefix`   | `ReactNode` | No       | —       | —           |
| `suffix`   | `ReactNode` | No       | —       | —           |
| `children` | `ReactNode` | Yes      | —       | —           |

## Tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-input`

## Examples

### With prefix

```jsx
<InputGroup prefix="https://">
  <Input placeholder="example.com" />
</InputGroup>
```

### With leading icon addon

```jsx
<InputGroup>
  <InputGroupAddon>
    <svg viewBox="0 0 16 16" width="16" height="16">
      <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </InputGroupAddon>
  <Input placeholder="Search…" aria-label="Search" />
</InputGroup>
```

### With trailing unit addon

```jsx
<InputGroup>
  <Input placeholder="0.00" aria-label="Weight" />
  <InputGroupAddon align="inline-end">kg</InputGroupAddon>
</InputGroup>
```

### ButtonGroup

```jsx
<ButtonGroup>
  <Button>Left</Button>
  <Button>Right</Button>
</ButtonGroup>
```

## Boundaries

| Area            | Level    | Note                                                                                      |
| --------------- | -------- | ----------------------------------------------------------------------------------------- |
| token names     | strict   | Addon background, border, text, and radius must resolve to the listed --cascivo-\* tokens |
| addon alignment | flexible | InputGroupAddon align is inline-start (leading) or inline-end (trailing)                  |
| addon content   | flexible | prefix/suffix and addon children accept arbitrary ReactNode                               |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo InputGroup component (inputs). Prefix/suffix addon wrapper for Input; InputGroupAddon renders inline icons/units inside the field border; ButtonGroup collapses adjacent button borders

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

InputGroup is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-text-subtle, --cascivo-radius-input

Accessibility: role "generic", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Addon background, border, text, and radius must resolve to the listed --cascivo-* tokens
Flexible: addon alignment, addon content.

Do not invent props, tokens, or global viewport media queries.
```
