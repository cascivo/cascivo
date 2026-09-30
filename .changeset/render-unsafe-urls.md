---
'@cascivo/render': patch
---

`validateView` (and so `<CascivoView>`, which validates before rendering) now refuses a
URL-carrying prop whose scheme could run script: `javascript:`, `vbscript:`, `data:` and any
other scheme except `http`, `https`, `mailto` and `tel`. It checks nested values too, such as
`Header`'s `links[].href`. React 19 already blocks `javascript:` links, but Preact writes them
to the DOM as given, so on Preact a generated or user-published view could carry a link that
runs script when clicked. Relative URLs are unaffected.
