# Timeline

**Category:** display  
**Description:** Ordered sequence of events with status markers and a connector line

## When to use

- Showing an ordered sequence of events over time (activity feeds, order tracking)
- Communicating progress through discrete stages with complete/current/upcoming status
- Presenting a chronological history where order is meaningful

## When NOT to use

- Interactive multi-step navigation the user controls — use Tabs or a Stepper
- Unordered lists where sequence carries no meaning — use List

## Anti-patterns

### Multiple current markers make the active position ambiguous for assistive tech

**Bad:** `Marking several items as status="current" at once`  
**Good:** `Exactly one current item so aria-current="step" points to a single position`  
**Why:** Multiple current markers make the active position ambiguous for assistive tech

## Related components

- **List** (alternative): List is for unordered prose; Timeline conveys ordered, time-stamped events

## Accessibility rationale

Rendered as an ordered list (ol/li) to convey sequence; the active item carries aria-current="step" and decorative markers are aria-hidden so screen readers read only the text

## Props

| Name          | Type                                                                                                           | Required      | Default         | Description |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | ----------- | --- | --- |
| `items`       | `{ id: string; title: ReactNode; description?: ReactNode; time?: string; icon?: ReactNode; status?: "complete" | "current"     | "upcoming" }[]` | Yes         | —   | —   |
| `orientation` | `'vertical'                                                                                                    | 'horizontal'` | No              | vertical    | —   |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-color-success`
- `--cascivo-color-primary`
- `--cascivo-radius-full`

## Examples

### Vertical timeline with statuses

```jsx
<Timeline
  items={[
    { id: '1', title: 'Order placed', time: '09:00', status: 'complete' },
    { id: '2', title: 'Shipped', time: '12:30', status: 'current' },
    { id: '3', title: 'Delivered', status: 'upcoming' },
  ]}
/>
```

## Boundaries

| Area             | Level    | Note                                                                   |
| ---------------- | -------- | ---------------------------------------------------------------------- |
| orientation      | flexible | vertical for feeds, horizontal for compact progress strips             |
| status semantics | strict   | Use a single current item; status drives marker colour via data-status |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Timeline component (display). Ordered sequence of events with status markers and a connector line

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Timeline is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-surface, --cascivo-color-success, --cascivo-color-primary, --cascivo-radius-full

Accessibility: role "list", WCAG 2.2-AA. Keep it AA.

Do not change (strict): status semantics — Use a single current item; status drives marker colour via data-status
Flexible: orientation.

Do not invent props, tokens, or global viewport media queries.
```
