# Search

**Category:** inputs  
**Description:** Search input with debounced search callback and clear button

## When to use

- A query field that filters or searches content, with a built-in clear button and debounced onSearch
- Free-text search where results update as the user types (debounced) or on Enter

## When NOT to use

- General non-search text entry — use Input
- Search that presents an inline list of suggestions/results to pick from — use Combobox
- A bounded numeric value — use NumberInput

## Anti-patterns

### Search provides type="search" semantics, a magnifier affordance, a clear button, and built-in debouncing so you avoid firing a query on every keystroke

**Bad:** `<Input placeholder="Search" onChange={(e) => runQuery(e.target.value)} />`  
**Good:** `<Search onSearch={(q) => runQuery(q)} debounceMs={300} />`  
**Why:** Search provides type="search" semantics, a magnifier affordance, a clear button, and built-in debouncing so you avoid firing a query on every keystroke

## Related components

- **Input** (alternative): Use for general text entry that is not a search query
- **Combobox** (alternative): Use when the query should surface a selectable list of suggestions

## Accessibility rationale

Renders a native <input type="search"> associated with a <label> (defaulting from the i18n catalog) so the field is announced as a searchbox; the clear control is a labeled <button> and moves focus back to the input after clearing.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | No | — | The controlled value. |
| `defaultValue` | `string` | No | '' | The initial value when uncontrolled. |
| `onValueChange` | `(value: string) => void` | No | — | Called with the current text on every keystroke. |
| `onChange` | `(value: string) => void` | No | — | Deprecated: use onValueChange (same string). |
| `onSearch` | `(value: string) => void` | No | — | Called with the query, debounced, as the user types. |
| `debounceMs` | `number` | No | 300 | Debounce delay (ms) before onSearch fires. |
| `placeholder` | `string` | No | Search | Placeholder text shown when the field is empty. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `label` | `string` | No | Search | Text label for the control. |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `clearLabel` | `string` | No | Clear search | Accessible label for the clear button. |
| `id` | `string` | No | — | Id applied to the root element (auto-generated when omitted). |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`
- `--cascivo-search-width`

## Examples

### Basic

```jsx
<Search onSearch={(q) => runQuery(q)} />
```

### Controlled

```jsx
<Search value={query} onChange={setQuery} onSearch={runQuery} debounceMs={500} />
```

### Large

```jsx
<Search size="lg" placeholder="Search products…" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Field and control styling must resolve to the listed --cascivo-* tokens |
| debounce and copy | flexible | debounceMs and the placeholder/label/clear copy are free to suit the context |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Search component (inputs). Search input with debounced search callback and clear button

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Search is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-bg-subtle, --cascivo-radius-input, --cascivo-focus-ring, --cascivo-search-width

Accessibility: role "searchbox", WCAG 2.2-AA, keyboard: Enter. Keep it AA.

Do not change (strict): token names — Field and control styling must resolve to the listed --cascivo-* tokens
Flexible: debounce and copy.

Do not invent props, tokens, or global viewport media queries.
```
