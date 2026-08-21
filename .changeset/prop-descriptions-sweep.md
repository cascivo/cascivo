---
'@cascivo/react': patch
'@cascivo/charts': patch
---

Rewrote 44 prop descriptions that restated the prop name and said nothing else.

Six boilerplate sentences — "Layout orientation of the component.", "Selects the visual style
variant.", "Placement relative to the trigger.", "Position of the component.", "The HTML
element to render as.", "Edge the component is anchored to." — were the entire published
documentation for 38 props, and each is a sentence a reader could have written from the prop
name alone. They shipped in the manifests, `registry.json`, `llms.txt`, the docs site and the
`.d.ts`.

`Separator.orientation` now says a `horizontal` separator draws a full-width line;
`BarChart.orientation` says `vertical` grows bars upward from categories on the x-axis and
`horizontal` grows them rightward (the better choice for long labels); `Resizable` says which
way you drag. `Badge`, `Tag` and `Notification` keep — and now spell out — their alias
mapping onto the canonical `Tone` vocabulary; `Alert` and `Toast` say plainly that theirs is
a private union and the canonical `danger`/`neutral` spellings are not accepted.

No API change; documentation only.
