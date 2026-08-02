---
'@cascivo/react': minor
---

Converge the accessible-name prop on `ariaLabel`, and give `DataTable` sized columns a
content floor.

Ten components accepted only the DOM spelling `aria-label`, so `label` meant visible text
on some components, an invisible name on others, and was not accepted at all on a third
group. Every one now also accepts `ariaLabel`: `Menubar`, `NavigationMenu`, `TreeView`,
`Swap`, `RadialProgress`, `MenuTrigger`, `SplitView` and `StatsBand` join the three that
already did. Where the name is required (`Menubar`), an XOR union enforces that exactly one
spelling is present, so the accessibility guarantee survives the alias. No existing code
breaks — these are additive.

`DataTable` columns with a `width` no longer shrink below their own longest word, so a
sized column can't render `Buildin` / `g`; `minWidth` is now only for raising the floor
above the content. The scroller reserves its gutter, so a table that overflows says so
rather than appearing to have dropped columns.
