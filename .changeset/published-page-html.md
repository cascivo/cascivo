---
'@cascivo/app': minor
'cascivo': minor
---

Published pages render on the server.

- In a `cascivo create --example publish` app, the Worker answers `/p/<slug>` with the app's
  index.html carrying the page:
  - A title, a description and Open Graph tags, so a shared link previews properly.
  - The rendered page in a `<noscript>`, styled by the same stylesheets. The Worker finds them
    in the build manifest, for readers without JavaScript.
  - An unknown slug still gets the app, which says so.
- With the export example too, `og:image` is a 1200 × 630 preview. Browser Run renders it once
  and D1 keeps it.
- `exportPage` takes `fullPage: false`, to capture only the viewport: a fixed-size image.
