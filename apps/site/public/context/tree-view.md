# TreeView

**Category:** display  
**Description:** Hierarchical, expandable tree of nodes with keyboard navigation and selection

## When to use

- Showing nested, parent/child data the user expands and collapses (file trees, org charts, nav)
- Letting the user pick one or several nodes from a hierarchy
- Navigating deep structures where indentation communicates depth

## When NOT to use

- A flat, non-nested list of choices — use List or StructuredList
- A small set of mutually exclusive sections of prose — use Accordion

## Anti-patterns

### A tree with no hierarchy adds twisties and ARIA tree semantics for content that is flat

**Bad:** `A single-level TreeView with no children on any node`  
**Good:** `A List or StructuredList`  
**Why:** A tree with no hierarchy adds twisties and ARIA tree semantics for content that is flat

## Related components

- **Accordion** (alternative): Accordion stacks a few sequential disclosure sections; TreeView models arbitrary-depth hierarchy
- **StructuredList** (alternative): StructuredList is flat tabular rows; TreeView is nested with expand/collapse

## Accessibility rationale

A role="tree" of role="treeitem" nodes carrying aria-level, aria-posinset, aria-setsize, aria-selected and aria-expanded, with aria-multiselectable on the tree in multi mode — multi-select was previously unannounced. Each item is named by aria-labelledby pointing at its own label: the <li> also contains the child <ul>, so without it an expanded node's accessible name absorbed its entire subtree. A roving tabindex keeps one node focusable, and the candidate is validated against the _visible_ set — the old build never invalidated the focused id when its node stopped being visible, so collapsing a branch after focusing a child left the only tabIndex=0 on a hidden node and Tab skipped the whole widget. Collapsed subtrees are not rendered, which is what the clientJs justification has always claimed and was not true: recursion ran on hasChildren alone and CSS merely hid the result. Enter and Space perform the same action as a click (toggle a branch, then select) rather than only selecting; arrows, Home/End and type-to-select all skip disabled nodes; and \* expands every sibling at the level. Type-to-select uses the shared useTypeahead primitive and matches a node's textValue, so a JSX label no longer makes it silently inert.

## Props

| Name               | Type                                                                          | Required | Default | Description                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `string`                                                                      | No       | —       | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only.                |
| `ariaLabel`        | `string`                                                                      | No       | —       | Invisible accessible name. The catalog convention; `aria-label` is accepted as an alias for the DOM spelling. Not rendered — screen readers only.             |
| `aria-label`       | `string`                                                                      | No       | —       | Accessible label for the tree.                                                                                                                                |
| `items`            | `{ id: string; label: ReactNode; icon?: ReactNode; children?: TreeNode[] }[]` | Yes      | —       | The items to render.                                                                                                                                          |
| `selectionMode`    | `'single' \| 'multi'`                                                         | No       | single  | Whether one or multiple nodes can be selected ('single' \| 'multi').                                                                                          |
| `selected`         | `string \| string[]`                                                          | No       | —       | The controlled selected node id(s).                                                                                                                           |
| `defaultSelected`  | `string \| string[]`                                                          | No       | —       | The initially selected node id(s) when uncontrolled.                                                                                                          |
| `onSelectChange`   | `(selected: string \| string[]) => void`                                      | No       | —       | Called with the new selection when it changes.                                                                                                                |
| `onValueChange`    | `(selected: string \| string[]) => void`                                      | No       | —       | Called with the new selection. Preferred over `onSelectChange`, which is the catalog’s only value-carrying handler not named onValueChange and is deprecated. |
| `expanded`         | `string[]`                                                                    | No       | —       | The controlled set of expanded node ids.                                                                                                                      |
| `defaultExpanded`  | `string[]`                                                                    | No       | —       | The initially expanded node ids when uncontrolled.                                                                                                            |
| `onExpandedChange` | `(expanded: string[]) => void`                                                | No       | —       | Called with the new expanded set when it changes.                                                                                                             |

## Tokens

- `--cascivo-tree-indent`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`
- `--cascivo-duration-200`
- `--cascivo-ease-out`

## Examples

### Single select

```jsx
<TreeView
  defaultExpanded={['src']}
  items={[{ id: 'src', label: 'src', children: [{ id: 'index', label: 'index.ts' }] }]}
/>
```

### Multi select

```jsx
<TreeView selectionMode="multi" items={nodes} onSelectChange={(ids) => set(ids)} />
```

## Boundaries

| Area           | Level    | Note                                                                                     |
| -------------- | -------- | ---------------------------------------------------------------------------------------- |
| selectionMode  | flexible | single vs multi is the consumer’s choice based on the interaction                        |
| keyboard model | strict   | Arrow/Home/End/typeahead behavior follows the APG tree pattern and must not be re-mapped |
| indent token   | flexible | Per-level indent is driven by --cascivo-tree-indent and may be overridden                |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo TreeView component (display). Hierarchical, expandable tree of nodes with keyboard navigation and selection

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

TreeView is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-tree-indent, --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-radius-control, --cascivo-focus-ring, --cascivo-duration-200, --cascivo-ease-out

Accessibility: role "tree", WCAG 2.2-AA, keyboard: */ArrowDown/ArrowUp/ArrowRight/ArrowLeft/Home/End/Enter/Space/Typeahead. Keep it AA.

Do not change (strict): keyboard model — Arrow/Home/End/typeahead behavior follows the APG tree pattern and must not be re-mapped
Flexible: selectionMode, indent token.

Do not invent props, tokens, or global viewport media queries.
```
