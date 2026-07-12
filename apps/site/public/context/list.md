# List

**Category:** display  
**Description:** Styled unordered or ordered list with ListItem

## When to use

- Presenting a set of related items as a bulleted or numbered list
- Conveying sequence with an ordered list (as="ol")
- Keeping list semantics while hiding visual markers (marker="none")

## When NOT to use

- Tabular data with multiple columns — use DataTable
- Interactive navigation items — use SideNav or a menu

## Anti-patterns

### Real list markup lets screen readers announce item count and position

**Bad:** `A stack of <Text> rows used as a visual list`  
**Good:** `<List><ListItem>…</ListItem></List>`  
**Why:** Real list markup lets screen readers announce item count and position

## Related components

- **Text** (contains): ListItem content is typically body Text

## Accessibility rationale

Renders native <ul>/<ol> with <li> children so assistive tech announces the list and its length; marker="none" hides bullets visually without removing list semantics

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `as` | `'ul' \| 'ol'` | No | ul | The HTML element to render as. |
| `marker` | `'disc' \| 'decimal' \| 'none'` | No | derived from as (ul→disc, ol→decimal) | List marker style ('disc' \| 'decimal' \| 'none'). |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-text-base`
- `--cascivo-space-1`
- `--cascivo-space-6`

## Examples

### Unordered

```jsx
<List><ListItem>Tokens</ListItem><ListItem>Themes</ListItem></List>
```

### Ordered

```jsx
<List as="ol"><ListItem>Init</ListItem><ListItem>Add</ListItem></List>
```

### Unmarked

Keeps list semantics without visual markers

```jsx
<List marker="none"><ListItem>Clean row</ListItem></List>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| marker | flexible | disc/decimal/none chosen to match content and visual needs |
| token names | strict | Spacing and text color must resolve to --cascivo-* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo List component (display). Styled unordered or ordered list with ListItem

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

List is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-sans, --cascivo-leading-normal, --cascivo-color-text, --cascivo-text-base, --cascivo-space-1, --cascivo-space-6

Accessibility: role "list", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Spacing and text color must resolve to --cascivo-* tokens
Flexible: marker.

Do not invent props, tokens, or global viewport media queries.
```
