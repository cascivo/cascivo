# TagsInput

**Category:** inputs  
**Description:** Free-form multi-value chip input

## When to use

- Collecting an open-ended set of free-text values the user types themselves (keywords, emails, labels)
- Each entry should appear as a removable chip and there is no fixed list to pick from
- You need per-tag validation or a cap on how many entries are allowed

## When NOT to use

- Values come from a fixed, known list — use MultiSelect
- Only a single line of free text is needed — use Input

## Anti-patterns

### Free-text entry invites typos and inconsistent values when the set is actually constrained; pick from options instead

**Bad:** `<TagsInput value={selectedRoles} ... /> // roles are a fixed enum`  
**Good:** `<MultiSelect options={roleOptions} />`  
**Why:** Free-text entry invites typos and inconsistent values when the set is actually constrained; pick from options instead

## Related components

- **MultiSelect** (alternative): Use when values come from a fixed list rather than free text
- **Input** (alternative): Use for a single free-text value with no chips

## Accessibility rationale

The typing surface is a real <input> and each tag exposes a dedicated remove button with an aria-label naming the tag, so screen-reader users can both add (Enter/comma) and delete (Backspace or the button) without ambiguity.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string[]` | Yes | — | The controlled value. |
| `onValueChange` | `(v: string[]) => void` | Yes | — | Called with the new value when it changes. |
| `placeholder` | `string` | No | — | Placeholder text shown when the field is empty. |
| `validate` | `(tag: string) => boolean` | No | — | Returns whether a candidate tag is allowed. |
| `max` | `number` | No | — | Maximum allowed value. |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<TagsInput value={['react', 'vue']} onValueChange={() => {}} placeholder="Add tag…" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| tag values | flexible | Free text, optionally constrained by the validate predicate and max count |
| commit keys | strict | Enter and comma commit a tag; Backspace on empty removes the last — fixed interaction contract |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo TagsInput component (inputs). Free-form multi-value chip input

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

TagsInput is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-color-bg-subtle, --cascivo-radius-input, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "textbox", WCAG 2.2-AA, keyboard: Enter/,/Backspace. Keep it AA.

Do not change (strict): commit keys — Enter and comma commit a tag; Backspace on empty removes the last — fixed interaction contract
Flexible: tag values.

Do not invent props, tokens, or global viewport media queries.
```
