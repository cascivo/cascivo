# TreeView

Hierarchical, expandable tree of nodes with keyboard navigation and selection

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tree-view
```

Or use it from the prebuilt package without copying:

```tsx
import { TreeView } from '@cascivo/react'
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

| Prop               | Type                                                                          | Required | Default  | Description                                                          |
| ------------------ | ----------------------------------------------------------------------------- | -------- | -------- | -------------------------------------------------------------------- |
| `aria-label`       | `string`                                                                      | no       | —        | Accessible label for the tree.                                       |
| `items`            | `{ id: string; label: ReactNode; icon?: ReactNode; children?: TreeNode[] }[]` | yes      | —        | The items to render.                                                 |
| `selectionMode`    | `'single' \| 'multi'`                                                         | no       | `single` | Whether one or multiple nodes can be selected ('single' \| 'multi'). |
| `selected`         | `string \| string[]`                                                          | no       | —        | The controlled selected node id(s).                                  |
| `defaultSelected`  | `string \| string[]`                                                          | no       | —        | The initially selected node id(s) when uncontrolled.                 |
| `onSelectChange`   | `(selected: string \| string[]) => void`                                      | no       | —        | Called with the new selection when it changes.                       |
| `expanded`         | `string[]`                                                                    | no       | —        | The controlled set of expanded node ids.                             |
| `defaultExpanded`  | `string[]`                                                                    | no       | —        | The initially expanded node ids when uncontrolled.                   |
| `onExpandedChange` | `(expanded: string[]) => void`                                                | no       | —        | Called with the new expanded set when it changes.                    |

## Examples

### Single select

```tsx
<TreeView
  defaultExpanded={['src']}
  items={[{ id: 'src', label: 'src', children: [{ id: 'index', label: 'index.ts' }] }]}
/>
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

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
