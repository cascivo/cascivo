# TreeView

Hierarchical, expandable tree of nodes with keyboard navigation and selection

## Install

```bash
npx cascivo add tree-view
```

## Category

`display`

## Variants

- `single`
- `multi`

## States

- `default`
- `expanded`
- `collapsed`
- `selected`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `{ id: string; label: ReactNode; icon?: ReactNode; children?: TreeNode[] }[]` | yes | — | — |
| `selectionMode` | `'single' | 'multi'` | no | `single` | — |
| `selected` | `string | string[]` | no | — | — |
| `defaultSelected` | `string | string[]` | no | — | — |
| `onSelectChange` | `(selected: string | string[]) => void` | no | — | — |
| `expanded` | `string[]` | no | — | — |
| `defaultExpanded` | `string[]` | no | — | — |
| `onExpandedChange` | `(expanded: string[]) => void` | no | — | — |

## Examples

### Single select

```tsx
<TreeView defaultExpanded={["src"]} items={[{ id: "src", label: "src", children: [{ id: "index", label: "index.ts" }] }]} />
```

### Multi select

```tsx
<TreeView selectionMode="multi" items={nodes} onSelectChange={(ids) => set(ids)} />
```

## Design tokens

- `--cascivo-tree-indent`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`
- `--cascivo-duration-200`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `tree`
- **Keyboard:** ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Home, End, Enter, Space, Typeahead

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

display, tree, hierarchy, navigation, files
