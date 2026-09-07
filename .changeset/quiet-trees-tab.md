---
'@cascivo/react': minor
---

`TreeView` could become entirely untabbable, and its collapsed branches were rendered anyway.
All existing props keep their shape; `onSelectChange` is deprecated in favour of
`onValueChange` rather than removed.

**The whole widget could drop out of the tab order.** The single tabbable node was
`focusedId ?? firstSelected ?? firstVisible`, and `focusedId` was never invalidated when the
node it named stopped being visible. Expand a branch, click a child, collapse the branch: the
only `tabIndex=0` is now on a node that is not rendered, and Tab skips the tree entirely. The
same happened whenever the `items` prop changed identity. Each candidate is validated against
the visible set now.

**Collapsed subtrees were fully rendered.** Recursion ran on `hasChildren` alone and CSS
merely hid the result, so a 10,000-node tree mounted 10,000 `<li>` on first paint and every
collapsed subtree stayed in the accessibility tree. The manifest justified
`clientJs: 'required'` with "Collapsed branches are not rendered" — which was simply untrue,
and which also made every jsdom test asserting a collapsed child "is in the document" vacuous.

**An expanded node's accessible name absorbed its entire subtree.** The `<li role="treeitem">`
also contains the child `<ul>`, so name computation walked the lot. Each item is named by
`aria-labelledby` pointing at its own label.

Also fixed:

- **Enter and Space disagreed with click.** Click toggled expansion _and_ selected; the keys
  only selected, so a branch behaved differently depending on how it was activated. APG's
  default action for a parent node is the toggle.
- **Type-to-select silently did nothing for JSX labels.** The hand-rolled key buffer matched
  `typeof label === 'string'`, so any node rendering an icon beside its text — the common case
  — was unreachable by typing. It uses the shared `useTypeahead` primitive (which CLAUDE.md
  requires and which the file's own `TODO` acknowledged) and matches a new `textValue`.
- **Multi-select was unannounced**: no `aria-multiselectable` on the tree.
- The `role="group"` sat inside a plain `<div>` rather than being owned by the `treeitem`;
  the wrapper is `role="presentation"`.

New: `TreeNode.disabled` (skipped by arrows, Home/End, type-to-select and selection),
`TreeNode.textValue`, `onValueChange`, and `*` to expand every sibling at the current level.

Styling: added the `@media (pointer: coarse)` block — rows were roughly 34px with none at all.

Tests go from 9 to 28.
