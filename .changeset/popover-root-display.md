---
'@cascivo/react': patch
---

Fixed `DataTable` column and filter menus, which kept a layout box while closed. Their class
set `display: flex` on `PopoverContent`'s popover element, and that beats the browser rule
that hides a closed popover. `popover:check` now also follows classes passed to popover-root
components (`PopoverContent`, `HoverCardContent`), so this cannot come back unseen.
