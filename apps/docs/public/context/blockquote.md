# Blockquote

**Category:** display  
**Description:** Quoted passage with optional attribution footer

## When to use

- Setting off a quoted passage from another source with visual emphasis
- Attributing a quote to a person or work via the cite footer

## When NOT to use

- Indenting or emphasizing your own non-quoted text — use Text styling
- Inline quotations within a sentence — use a <q> element

## Anti-patterns

### blockquote semantics tell assistive tech the content is a quotation; misusing it misleads readers

**Bad:** `Using <Blockquote> purely to indent a callout`  
**Good:** `A Card or styled Text block for non-quote emphasis`  
**Why:** blockquote semantics tell assistive tech the content is a quotation; misusing it misleads readers

## Related components

- **Prose** (pairs-with): Prose styles blockquotes among other long-form elements automatically

## Accessibility rationale

Renders a native <blockquote> with the attribution in <footer><cite>, so the quotation and its source are semantically distinct to assistive tech

## Props

| Name   | Type     | Required | Default   | Description |
| ------ | -------- | -------- | --------- | ----------- |
| `cite` | `string` | No       | undefined | —           |

## Tokens

- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-font-sans`
- `--cascivo-font-medium`
- `--cascivo-leading-relaxed`
- `--cascivo-text-sm`
- `--cascivo-text-base`

## Examples

### Default

```jsx
<Blockquote>Less, but better.</Blockquote>
```

### With attribution

Attribution renders as <footer><cite>

```jsx
<Blockquote cite="Dieter Rams">Less, but better.</Blockquote>
```

## Boundaries

| Area        | Level    | Note                                                                   |
| ----------- | -------- | ---------------------------------------------------------------------- |
| attribution | flexible | cite is optional; omit when the source is given in surrounding context |
| token names | strict   | Border and text colors must resolve to --cascivo-\* tokens             |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Blockquote component (display). Quoted passage with optional attribution footer

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Blockquote is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border-strong, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-font-sans, --cascivo-font-medium, --cascivo-leading-relaxed, --cascivo-text-sm, --cascivo-text-base

Accessibility: role "blockquote", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Border and text colors must resolve to --cascivo-* tokens
Flexible: attribution.

Do not invent props, tokens, or global viewport media queries.
```
