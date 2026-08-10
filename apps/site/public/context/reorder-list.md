# ReorderList

**Category:** inputs  
**Description:** List whose rows can be reordered by pointer drag or entirely by keyboard

## When to use

- A short, user-owned ordering such as playlist tracks, form fields, or dashboard cards
- Any list whose order is meaningful data the user is expected to change
- Touch surfaces where dragging a handle is the natural gesture

## When NOT to use

- Long or virtualized lists, where dragging to a far position is impractical — offer a "move to position" control
- Ordering that is derived rather than authored (sort by name, date, rank) — use a sortable DataTable
- Read-only lists — use List or StructuredList

## Anti-patterns

### Pointer-only reordering is unusable by keyboard and screen-reader users; it is the standing accessibility gap in pointer-only implementations

**Bad:** `Rendering a drag handle with no keyboard path`  
**Good:** `Keep the built-in handle, which is a real button with Space/Arrow/Escape support`  
**Why:** Pointer-only reordering is unusable by keyboard and screen-reader users; it is the standing accessibility gap in pointer-only implementations

### Index keys make React reuse the wrong DOM nodes as rows move, so focus and animation land on the wrong row

**Bad:** `Deriving row keys from array index`  
**Good:** `Give every item a stable `id``  
**Why:** Index keys make React reuse the wrong DOM nodes as rows move, so focus and animation land on the wrong row

## Related components

- **List** (alternative): Plain list when the order is not user-editable
- **DataTable** (alternative): Column sorting when the order is derived rather than authored
- **SwipeItem** (pairs-with): Row-level swipe actions on the same touch list

## Accessibility rationale

Every row carries a real button as its drag handle, so the entire interaction is reachable by keyboard: Space or Enter picks a row up, ArrowUp/ArrowDown move it, Space or Enter drops it, and Escape restores the order captured at pick-up. The handle exposes aria-pressed so assistive technology can tell held from idle, and each transition — picked up, moved, dropped, cancelled — is announced through a polite role="status" region using interpolated catalog strings that carry the item name and its position out of the total. The handle sets touch-action: none so a touch drag is not stolen by the scroller, and meets the coarse-pointer target floor. Item names for announcements come from `name` when the label is not plain text, so a rich label never produces an empty announcement.

## Props

| Name            | Type                                                                                          | Required | Default | Description                                                        |
| --------------- | --------------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `value`         | `ReorderItem[]`                                                                               | Yes      | —       | The ordered items; the component is controlled                     |
| `onValueChange` | `(value: ReorderItem[]) => void`                                                              | Yes      | —       | Called with the new order whenever a row moves                     |
| `disabled`      | `boolean`                                                                                     | No       | false   | When true, disables the control and removes it from the tab order. |
| `labels`        | `{ handle?: string; grabbed?: string; moved?: string; dropped?: string; cancelled?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).         |
| `className`     | `string`                                                                                      | No       | —       | Additional CSS class names merged onto the root element.           |

## Object types

### `ReorderItem`

| Field   | Type              | Required | Description                                                      |
| ------- | ----------------- | -------- | ---------------------------------------------------------------- |
| `id`    | `string`          | Yes      | Stable identity for the row                                      |
| `label` | `React.ReactNode` | Yes      | Row content                                                      |
| `name`  | `string`          | No       | Plain-text name used in announcements when label is not a string |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-surface-2`
- `--cascivo-color-foreground`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-border-subtle`
- `--cascivo-radius-sm`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-disabled-opacity`
- `--cascivo-target-min-coarse`

## Examples

### Basic

Controlled — the caller owns the order.

```jsx
<ReorderList value={items} onValueChange={setItems} />
```

### Locked

Handles are disabled and drop out of the tab order.

```jsx
<ReorderList value={items} onValueChange={setItems} disabled />
```

## Boundaries

| Area                  | Level    | Note                                                                                 |
| --------------------- | -------- | ------------------------------------------------------------------------------------ |
| value / onValueChange | strict   | Always controlled — the component never holds the order itself                       |
| labels                | flexible | Every announcement string is overridable and supports {name}, {position} and {total} |
| handle                | strict   | The handle is always a focusable button; there is no drag-anywhere mode              |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ReorderList component (inputs). List whose rows can be reordered by pointer drag or entirely by keyboard

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ReorderList is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-surface-2, --cascivo-color-foreground, --cascivo-color-text-muted, --cascivo-color-accent, --cascivo-border-subtle, --cascivo-radius-sm, --cascivo-ring-width, --cascivo-ring-color, --cascivo-disabled-opacity, --cascivo-target-min-coarse

Accessibility: role "list", WCAG 2.2-AA, keyboard: Space/Enter/ArrowUp/ArrowDown/Escape/Tab. Keep it AA.

Do not change (strict): value / onValueChange — Always controlled — the component never holds the order itself; handle — The handle is always a focusable button; there is no drag-anywhere mode
Flexible: labels.

Do not invent props, tokens, or global viewport media queries.
```
