# OverflowMenu

**Category:** overlay  
**Description:** Kebab icon button revealing a menu of row-level actions

## When to use

- Collapsing secondary row-level or item-level actions behind a kebab trigger in dense layouts like tables and lists
- Offering a small set of actions where a destructive option needs visual distinction

## When NOT to use

- A primary action that should always be visible — use Button
- Selecting a single value from a set rather than triggering actions — use Select or Dropdown
- New code — this component is deprecated in favor of Menu

## Anti-patterns

### A kebab menu keeps dense rows scannable; surfacing every action inline competes for attention and breaks alignment

**Bad:** `Rendering every row action as a visible Button in a crowded table`  
**Good:** `<OverflowMenu items={[{ label: "Edit", value: "edit" }, { label: "Delete", value: "delete", destructive: true }]} onSelect={handle} />`  
**Why:** A kebab menu keeps dense rows scannable; surfacing every action inline competes for attention and breaks alignment

## Related components

- **Menu** (alternative): Preferred replacement; OverflowMenu is deprecated and delegates to Dropdown internally
- **Dropdown** (contains): OverflowMenu is a kebab-triggered wrapper around Dropdown
- **Button** (alternative): Use for a single always-visible action instead of hiding it in a menu

## Accessibility rationale

The kebab trigger carries a localized aria-label since it has no visible text, and the revealed list uses Dropdown's menu semantics so arrow keys, Home/End, Enter/Space, and Escape work without custom handling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; destructive?: boolean }[]` | Yes | — | The items to render. |
| `onSelect` | `(value: string) => void` | No | — | Called with the selected value. |
| `placement` | `'bottom-start' \| 'bottom-end'` | No | bottom-end | Placement relative to the trigger. |
| `ariaLabel` | `string` | No | More actions | Accessible label for the component. |
| `size` | `'sm' \| 'md'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`

## Examples

### Row actions

```jsx
<OverflowMenu items={[{ label: "Edit", value: "edit" }, { label: "Delete", value: "delete", destructive: true }]} onSelect={handle} />
```

### Small, start-aligned

```jsx
<OverflowMenu size="sm" placement="bottom-start" items={items} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Trigger and item styling must resolve to the listed --cascivo-* tokens |
| item set and labels | flexible | items, ariaLabel, and placement are free to suit the context |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo OverflowMenu component (overlay). Kebab icon button revealing a menu of row-level actions

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

OverflowMenu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-bg-subtle, --cascivo-color-destructive, --cascivo-color-destructive-subtle, --cascivo-radius-button, --cascivo-focus-ring

Accessibility: role "menu", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Home/End/Enter/Space/Escape. Keep it AA.

Do not change (strict): token names — Trigger and item styling must resolve to the listed --cascivo-* tokens
Flexible: item set and labels.

Do not invent props, tokens, or global viewport media queries.
```
