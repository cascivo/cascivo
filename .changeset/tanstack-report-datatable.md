---
'@cascivo/react': patch
---

DataTable: adjacent auto-width columns no longer visually touch. Long unbroken
cell content (commit hashes, branch names) now wraps inside its cell instead of
spilling past the padding into the next column under `table-layout: fixed`
(paginated tables), and the inter-column gutter is exposed as an overridable
`--cascivo-data-table-cell-gap` component token.
