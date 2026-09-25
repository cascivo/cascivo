---
'@cascivo/react': minor
---

`fromTanStack(columnDefs, data)` turns TanStack Table `ColumnDef[]` into `DataTable` columns and rows (accessorKey, dotted keys, accessorFn, cell functions, size, group columns), and `toSortState` / `toTanStackSorting` convert sort state both ways. The types are structural, so there is no TanStack dependency.
