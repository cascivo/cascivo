# IconButton

**Category:** inputs  
**Description:** Square, icon-only button with a required accessible label

## When to use

- A compact, recognizable action where an icon alone communicates intent (close, edit, more)
- Dense toolbars or table rows where a text label would not fit

## When NOT to use

- The action is not universally recognizable by its icon — use a Button with a text label
- Navigating between pages — use an anchor (optionally via asChild)

## Anti-patterns

### An icon-only control has no visible text, so the label prop is the only accessible name screen readers can announce

**Bad:** `<IconButton label=""><TrashIcon /></IconButton>`  
**Good:** `<IconButton label="Delete item"><TrashIcon /></IconButton>`  
**Why:** An icon-only control has no visible text, so the label prop is the only accessible name screen readers can announce

## Related components

- **Button** (alternative): Use a Button when the action needs a visible text label
- **ButtonGroup** (contained-by): Icon buttons are commonly joined into a toolbar via ButtonGroup

## Accessibility rationale

Renders a native <button> with a mandatory aria-label so the icon-only control always exposes an accessible name; focus, role, and Enter/Space activation come from the platform

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | — | Text label for the control. |
| `icon` | `React.ReactNode` | No | — | Icon element rendered in the component. |
| `variant` | `'ghost' \| 'outline' \| 'filled'` | No | ghost | Selects the visual style variant. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `asChild` | `boolean` | No | false | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `onClick` | `React.MouseEventHandler<HTMLButtonElement>` | No | — | Called when the element is clicked. |

## Tokens

- `--cascivo-control-height-sm`
- `--cascivo-control-height-md`
- `--cascivo-control-height-lg`
- `--cascivo-button-radius`
- `--cascivo-radius-control`
- `--cascivo-color-primary`
- `--cascivo-color-primary-fg`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-focus-ring`

## Examples

### Ghost

```jsx
<IconButton label="Settings"><GearIcon /></IconButton>
```

### Filled

```jsx
<IconButton label="Add" variant="filled" icon={<PlusIcon />} />
```

### As link

```jsx
<IconButton label="Home" asChild><a href="/"><HomeIcon /></a></IconButton>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Sizing must resolve to --cascivo-control-height-* so it stays square and aligned with other controls |
| icon choice | flexible | Any single icon node; consumer owns the icon set |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo IconButton component (inputs). Square, icon-only button with a required accessible label

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

IconButton is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-control-height-sm, --cascivo-control-height-md, --cascivo-control-height-lg, --cascivo-button-radius, --cascivo-radius-control, --cascivo-color-primary, --cascivo-color-primary-fg, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-surface, --cascivo-focus-ring

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): token names — Sizing must resolve to --cascivo-control-height-* so it stays square and aligned with other controls
Flexible: icon choice.

Do not invent props, tokens, or global viewport media queries.
```
