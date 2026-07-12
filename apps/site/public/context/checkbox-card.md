# CheckboxCard

**Category:** inputs  
**Description:** Multi-selectable card backed by a native checkbox. Use multiple independent CheckboxCards for multi-select scenarios.

## When to use

- Multi-select where each option needs a title and supporting description (feature toggles, add-ons)
- Presenting selectable options as larger, scannable click targets rather than a dense checkbox list

## When NOT to use

- A simple labelled boolean in a form — use Checkbox
- Choosing exactly one option from a set — use RadioCard or Radio

## Anti-patterns

### Each CheckboxCard is an independent native checkbox — nothing enforces a single selection across them

**Bad:** `Using CheckboxCard for mutually exclusive options`  
**Good:** `Use RadioCard so only one can be selected`  
**Why:** Each CheckboxCard is an independent native checkbox — nothing enforces a single selection across them

### The description is a single supporting line; long content breaks the card layout and scannability

**Bad:** `Cramming a paragraph of marketing copy into description`  
**Good:** `undefined`  
**Why:** The description is a single supporting line; long content breaks the card layout and scannability

## Related components

- **Checkbox** (alternative): Use the plain checkbox when a title/description card is overkill
- **RadioCard** (alternative): Use for single-select card groups

## Accessibility rationale

Backed by a native <input type="checkbox"> inside a <label>, so the entire card is clickable and role, checked state, Space activation, and label association come from the platform; the SVG glyph is aria-hidden as it is purely decorative

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `ReactNode` | Yes | — | Card title |
| `description` | `ReactNode` | No | — | Optional description |
| `checked` | `boolean` | No | — | Controlled checked state |
| `defaultChecked` | `boolean` | No | — | Uncontrolled default |
| `onCheckedChange` | `(checked: boolean) => void` | No | — | Change callback |
| `disabled` | `boolean` | No | — | Disables the card |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-border`
- `--cascivo-radius-surface`

## Examples

### Feature toggles

Multi-select feature toggles

```jsx
<div style={{ display: 'grid', gap: 12 }}>
  <CheckboxCard title="Automated backups" description="Daily snapshots, 30-day retention" defaultChecked />
  <CheckboxCard title="Monitoring" description="Metrics + alerting" />
  <CheckboxCard title="Audit log" description="Requires Team plan" disabled />
</div>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| controlled vs uncontrolled | flexible | Supports both checked + onCheckedChange and defaultChecked |
| token names | strict | Card styling resolves to --cascivo-color-accent / --cascivo-color-border / --cascivo-radius-surface |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo CheckboxCard component (inputs). Multi-selectable card backed by a native checkbox. Use multiple independent CheckboxCards for multi-select scenarios.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

CheckboxCard is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-border, --cascivo-radius-surface

Accessibility: role "checkbox", WCAG 2.2-AA, keyboard: Space. Keep it AA.

Do not change (strict): token names — Card styling resolves to --cascivo-color-accent / --cascivo-color-border / --cascivo-radius-surface
Flexible: controlled vs uncontrolled.

Do not invent props, tokens, or global viewport media queries.
```
