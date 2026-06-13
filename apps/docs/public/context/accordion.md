# Accordion

**Category:** navigation  
**Description:** Vertically stacked, collapsible content sections

## When to use

- Progressively disclosing sections of related content the user reads top to bottom
- Reducing vertical scroll when most sections stay collapsed (FAQs, settings groups)
- Allowing multiple sections open at once (type="multiple")

## When NOT to use

- Switching between mutually exclusive, equally important views — use Tabs
- A single show/hide region — a plain disclosure is enough

## Anti-patterns

### A single permanently-open section adds chrome and indirection for no gain

**Bad:** `<Accordion> with one item that is always open`  
**Good:** `Render the content directly, or use a collapsible disclosure`  
**Why:** A single permanently-open section adds chrome and indirection for no gain

## Related components

- **Tabs** (alternative): Tabs switch between peer views; Accordion stacks sequential sections vertically

## Accessibility rationale

Each trigger is a native <button> exposing aria-expanded and controlling its panel via aria-controls, so screen readers announce open/closed state and Enter/Space toggle from the platform

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | `'single' | 'multiple'` | No | single | — |
| `defaultValue` | `string | string[]` | No | — | — |
| `value` | `string | string[]` | No | — | — |
| `onValueChange` | `(value: string | string[]) => void` | No | — | — |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-radius-md`
- `--cascivo-focus-ring`

## Examples

### Single

```jsx
<Accordion type="single" defaultValue="a"><AccordionItem value="a"><AccordionTrigger>Section</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| single vs multiple | flexible | type prop is free to choose based on whether sections are exclusive |
| token names | strict | Borders, surfaces, and radii must resolve to --cascivo-* semantic tokens |
