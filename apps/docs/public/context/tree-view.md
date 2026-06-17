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

Implements the WAI-ARIA TreeView pattern: role=tree on the root, role=treeitem with aria-level/posinset/setsize and aria-expanded on each node, a single roving tabindex, and full APG keyboard support (arrows expand/collapse and move, Home/End, Enter/Space select, printable-character typeahead)

## Props

| Name               | Type                                                                          | Required           | Default | Description |
| ------------------ | ----------------------------------------------------------------------------- | ------------------ | ------- | ----------- | --- |
| `items`            | `{ id: string; label: ReactNode; icon?: ReactNode; children?: TreeNode[] }[]` | Yes                | —       | —           |
| `selectionMode`    | `'single'                                                                     | 'multi'`           | No      | single      | —   |
| `selected`         | `string                                                                       | string[]`          | No      | —           | —   |
| `defaultSelected`  | `string                                                                       | string[]`          | No      | —           | —   |
| `onSelectChange`   | `(selected: string                                                            | string[]) => void` | No      | —           | —   |
| `expanded`         | `string[]`                                                                    | No                 | —       | —           |
| `defaultExpanded`  | `string[]`                                                                    | No                 | —       | —           |
| `onExpandedChange` | `(expanded: string[]) => void`                                                | No                 | —       | —           |

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
