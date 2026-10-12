---
'@cascivo/app': patch
'@cascivo/docs': patch
'@cascivo/docspack': patch
---

The bundled `registry.json` copy reports the current registry version (it still said 1.8.0).
The `@cascivo/app` type build retries `vp pack`'s intermittent abort however the abort is
reported, so a release build no longer fails on it; the published types are unchanged.
