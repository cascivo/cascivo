# Button

**Category:** inputs  
**Description:** Triggers an action or event

## When to use

- Triggering an action or navigation the user initiates by click/press
- Submitting a form or confirming a decision

## When NOT to use

- Navigation between pages where a real link is semantically correct — use an anchor
- Toggling a binary setting — use Toggle; persistent selection — use Checkbox/Radio

## Anti-patterns

### Buttons are for actions, links for navigation — assistive tech and the browser treat them differently

**Bad:** `<Button onClick={() => navigate("/x")}>Home</Button>`  
**Good:** `<a href="/x">Home</a>`  
**Why:** Buttons are for actions, links for navigation — assistive tech and the browser treat them differently

## Related components

- **Toggle** (alternative): Use for binary on/off state, not one-shot actions
- **Dropdown** (pairs-with): A button often triggers a menu

## Accessibility rationale

Renders a native <button> so Enter/Space activation, focus, and role come from the platform; loading state uses aria-busy rather than removing the element so focus is preserved

## Props

| Name       | Type                                         | Required    | Default | Description                                                                                       |
| ---------- | -------------------------------------------- | ----------- | ------- | ------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------- | --------------------------------- |
| `variant`  | `'primary'                                   | 'secondary' | 'ghost' | 'destructive'`                                                                                    | No  | primary                                               | Selects the visual style variant. |
| `size`     | `'sm'                                        | 'md'        | 'lg'`   | No                                                                                                | md  | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `loading`  | `boolean`                                    | No          | false   | When true, shows a loading state.                                                                 |
| `disabled` | `boolean`                                    | No          | false   | When true, disables the control and removes it from the tab order.                                |
| `asChild`  | `boolean`                                    | No          | false   | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>` | No          | —       | Called when the element is clicked.                                                               |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`
- `--cascivo-disabled-opacity`
- `--cascivo-text-ui`
- `--cascivo-text-body`

## Examples

### Primary

```jsx
<Button>Click me</Button>
```

### Loading

```jsx
<Button loading>Saving…</Button>
```

### Destructive

```jsx
<Button variant="destructive">Delete</Button>
```

### As link

Render button styling on a real anchor (keeps middle-click / open-in-new-tab).

```jsx
<Button asChild>
  <a href="/pricing">View pricing</a>
</Button>
```

## Boundaries

| Area        | Level    | Note                                                               |
| ----------- | -------- | ------------------------------------------------------------------ |
| token names | strict   | Visual props must resolve to --cascivo-button-\* / semantic tokens |
| label copy  | flexible | Free, within tone guidance                                         |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Button component (inputs). Triggers an action or event

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Button is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-accent-hover, --cascivo-color-accent-active, --cascivo-color-text-on-accent, --cascivo-color-destructive, --cascivo-radius-button, --cascivo-focus-ring, --cascivo-disabled-opacity, --cascivo-text-ui, --cascivo-text-body

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): token names — Visual props must resolve to --cascivo-button-* / semantic tokens
Flexible: label copy.

Do not invent props, tokens, or global viewport media queries.
```
