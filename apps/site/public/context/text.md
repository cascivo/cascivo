# Text

**Category:** display  
**Description:** Body text with size, weight, and muted variants

## When to use

- Rendering body copy, paragraphs, and inline text in app UI
- Applying size/weight/muted treatment to secondary or emphasized text
- Inline emphasis inside flow content (as="span")

## When NOT to use

- Section or page titles — use Heading for the document outline
- Long-form authored/markdown content — use Prose

## Anti-patterns

### Visually-large Text has no heading semantics, so it is missing from the document outline

**Bad:** `<Text size="lg" weight="semibold"> used as a page title`  
**Good:** `<Heading level={1}>`  
**Why:** Visually-large Text has no heading semantics, so it is missing from the document outline

## Related components

- **Heading** (alternative): Heading carries outline semantics; Text is plain body copy

## Accessibility rationale

Renders the chosen native element (p/span/div) without imposing roles; muted styling keeps contrast within AA so secondary text stays readable

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `as` | `'p' \| 'span' \| 'div'` | No | p | The HTML element to render as. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `weight` | `'normal' \| 'medium' \| 'semibold'` | No | normal | Font weight ('normal' \| 'medium' \| 'semibold'). |
| `muted` | `boolean` | No | false | When true, renders in a muted/subtle color. |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-font-normal`
- `--cascivo-font-medium`
- `--cascivo-font-semibold`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-text-sm`
- `--cascivo-text-base`
- `--cascivo-text-lg`

## Examples

### Default

```jsx
<Text>Body copy reads at the base size.</Text>
```

### Muted helper

```jsx
<Text size="sm" muted>Secondary information</Text>
```

### Inline span

Use as="span" inside other flow content

```jsx
<Text as="span" weight="semibold">emphasis</Text>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| as / size / weight | flexible | Choose element and treatment to fit context |
| token names | strict | Font, leading, and color must resolve to --cascivo-* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Text component (display). Body text with size, weight, and muted variants

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Text is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-sans, --cascivo-font-normal, --cascivo-font-medium, --cascivo-font-semibold, --cascivo-leading-normal, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-text-sm, --cascivo-text-base, --cascivo-text-lg

Accessibility: role "paragraph", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Font, leading, and color must resolve to --cascivo-* tokens
Flexible: as / size / weight.

Do not invent props, tokens, or global viewport media queries.
```
