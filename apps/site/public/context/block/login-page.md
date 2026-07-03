# LoginPage

**Category:** display  
**Description:** Authentication login page with email and password form.

## When to use

- A complete login page with email and password form
- Standing up authentication quickly with validation built in

## When NOT to use

- You only need the centered auth frame — use AuthLayout
- A multi-step signup or onboarding flow

## Related components

- **AuthLayout** (contained-by): Renders inside the centered auth layout

## Accessibility rationale

Form fields are labeled and validation messages are associated for screen readers.

## Props

| Name       | Type                            | Required | Default | Description                             |
| ---------- | ------------------------------- | -------- | ------- | --------------------------------------- |
| `onSubmit` | `(values: LoginValues) => void` | No       | —       | Called with valid form values on submit |

## Examples

### Default

Login page

```jsx
<LoginPage />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo LoginPage component (display). Authentication login page with email and password form.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

LoginPage is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
