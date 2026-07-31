---
'@cascivo/react': minor
---

Two additive props from the 2026-07-31 incident-console adopter report.

`Timeline` items take an optional `tone` (the catalog-wide `Tone` vocabulary),
independent of `status` and overriding it on the marker. `status` answers "where is
this in the sequence", which is right for a tracker and wrong for the activity feed
the manifest's `whenToUse` lists first: in a feed every entry is equally done, and
what separates them is what produced them. There was no escape hatch — `icon` sets
the marker's contents, not its colour, and `TimelineItem` has no `className` or
`data-*` passthrough — so the adopter hand-rolled the component and lost the
`<ol>`/`<li>` semantics and connector line with it.

`ShellHeader` takes an optional `center` node, rendered between the nav and the
right-hand cluster in a wrapper that takes the header's spare width. This is where a
command-palette trigger belongs; `nav` accepts links only, `actions` accepts icon
buttons only, and `end` sits after the spacer so it can neither centre nor grow. The
only way to reach the position was to select the brand's hashed CSS-module class,
which is the shape that broke when internal nesting last changed.

Both are additive: existing callers are unaffected, `status` keeps its meaning, and
the header keeps its spacer when `center` is absent.
