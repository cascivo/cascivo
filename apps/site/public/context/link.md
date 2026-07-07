# Link

**Category:** navigation  
**Description:** Styled anchor for navigation, standalone or inline within prose

## When to use

- Navigating to another page, view, or resource via a real href
- Inline cross-references within prose (variant="inline")
- Linking to an external destination with a clear new-tab indicator (external)

## When NOT to use

- Triggering an action or mutation with no destination — use Button
- Submitting a form — use a submit Button

## Anti-patterns

### Links are for navigation; actions belong to buttons so keyboard and assistive tech behave correctly

**Bad:** `<Link onClick={doThing}> with no href`  
**Good:** `<Button onClick={doThing}>`  
**Why:** Links are for navigation; actions belong to buttons so keyboard and assistive tech behave correctly

## Related components

- **Button** (alternative): Button is for actions; Link is for navigation

## Accessibility rationale

Renders a native <a> so role, Enter activation, and focus come from the platform; external links add rel="noreferrer" and a visual indicator so users know a new tab will open

## Props

| Name       | Type                       | Required | Default    | Description                                                                  |
| ---------- | -------------------------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `variant`  | `'standalone' \| 'inline'` | No       | standalone | Selects the visual style variant.                                            |
| `size`     | `'sm' \| 'md' \| 'lg'`     | No       | md         | Visual size of the component (e.g. 'sm', 'md', 'lg').                        |
| `external` | `boolean`                  | No       | false      | When true, treats the link as external (opens in a new tab with rel safety). |
| `href`     | `string`                   | No       | —          | The destination URL.                                                         |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Examples

### Standalone

```jsx
<Link href="/docs">View documentation</Link>
```

### Inline

Inline links inherit the surrounding font size and stay underlined.

```jsx
<p>
  Read the{' '}
  <Link variant="inline" href="/guide">
    guide
  </Link>{' '}
  first.
</p>
```

### External

Opens in a new tab with rel="noreferrer" and a visual indicator.

```jsx
<Link external href="https://example.com">
  Example
</Link>
```

## Boundaries

| Area        | Level    | Note                                                             |
| ----------- | -------- | ---------------------------------------------------------------- |
| variant     | flexible | standalone vs inline depending on whether the link sits in prose |
| token names | strict   | Accent colors and focus ring must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Link component (navigation). Styled anchor for navigation, standalone or inline within prose

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Link is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-accent-hover, --cascivo-color-accent-active, --cascivo-radius-sm, --cascivo-focus-ring

Accessibility: role "link", WCAG 2.2-AA, keyboard: Enter. Keep it AA.

Do not change (strict): token names — Accent colors and focus ring must resolve to --cascivo-* tokens
Flexible: variant.

Do not invent props, tokens, or global viewport media queries.
```
