---
'cascivo': patch
---

`cascivo create --framework astro` now pins `@astrojs/react` `^7.1.0` next to `astro` `^7`. The
previous `^5` pairing installed two Vite majors and printed 21 esbuild deprecation warnings on
every build.
