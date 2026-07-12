---
'@cascivo/core': minor
'@cascivo/react': patch
---

Add `useTypeahead` and fix duplicate-aria-id bugs in overlay components.

- **`@cascivo/core`:** new `useTypeahead` primitive — type-to-select buffer for
  menus/listboxes. Accumulates printable keypresses, resets after an inactivity
  window, and calls `onMatch(query)` so the consumer focuses the matching item.
  Signal/ref-based, SSR-safe, no `useEffect`.
- **Modal / Tooltip / AlertDialog:** replaced hardcoded static aria ids (Modal,
  AlertDialog) and a `Math.random()` id (Tooltip) with `useId()`. Two of the same
  component on one page no longer emit duplicate ids, so their `aria-labelledby` /
  `aria-describedby` references resolve correctly; Tooltip ids are now stable
  (SSR-safe) and colon-free (valid in the CSS anchor name).
- **Menu:** keyboard navigation moved off per-item `nextElementSibling` walking onto
  panel-level roving focus + `useTypeahead`, so disabled items and separators are
  skipped and Home/End, arrow-wrap, and type-to-select work.
