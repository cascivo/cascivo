# SettingsFormPage

**Category:** display  
**Description:** Settings page with profile form inside a two-column settings layout.

## When to use

- A settings page with a profile form inside a two-column settings layout
- Account or preferences pages with a save action

## When NOT to use

- You only need the layout frame — use SettingsLayout
- A focused single-field edit — use an inline form

## Related components

- **SettingsLayout** (contained-by): Composes the two-column settings layout

## Accessibility rationale

Form fields are labeled and validation messages are associated for screen readers.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSave` | `(values: SettingsValues) => void` | No | — | Called with valid form values on submit |

## Examples

### Default

Settings form page

```jsx
<SettingsFormPage />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SettingsFormPage component (display). Settings page with profile form inside a two-column settings layout.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SettingsFormPage is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
