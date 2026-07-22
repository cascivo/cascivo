# Tabs

**Category:** navigation  
**Description:** Switch between related panels of content

## When to use

- Switching between peer panels of related content in the same context
- Showing one section at a time when all sections are equally important

## When NOT to use

- Stacked sequential content the user reads top to bottom — use Accordion
- Changing a setting or view parameter — use a SegmentedControl
- Navigating between pages — use links

## Anti-patterns

### Tabs imply switching content panels; toggling a parameter is a control, not navigation

**Bad:** `Using Tabs to toggle a single display option (e.g. grid/list view)`  
**Good:** `<SegmentedControl> for view/setting toggles`  
**Why:** Tabs imply switching content panels; toggling a parameter is a control, not navigation

## Related components

- **Accordion** (alternative): Accordion stacks sequential sections; Tabs switch between peers
- **SegmentedControl** (alternative): SegmentedControl changes a setting/parameter rather than swapping panels

## Accessibility rationale

Implements the WAI-ARIA tabs pattern: tablist/tab/tabpanel roles with arrow-key navigation and Home/End, so the active tab and its panel are correctly associated for assistive tech

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `defaultValue` | `string` | No | — | The initial value when uncontrolled. |
| `value` | `string` | No | — | The controlled value. |
| `onValueChange` | `(value: string) => void` | No | — | Called with the new value when it changes. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-border`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Tabs defaultValue="account"><TabsList><TabsTrigger value="account">Account</TabsTrigger></TabsList><TabsContent value="account">…</TabsContent></Tabs>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| controlled vs uncontrolled | flexible | Use value or defaultValue depending on control needs |
| token names | strict | Accent, borders, and focus ring must resolve to --cascivo-* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Tabs component (navigation). Switch between related panels of content

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Tabs is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-border, --cascivo-focus-ring

Accessibility: role "tablist", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/Home/End. Keep it AA.

Do not change (strict): token names — Accent, borders, and focus ring must resolve to --cascivo-* tokens
Flexible: controlled vs uncontrolled.

Do not invent props, tokens, or global viewport media queries.
```
