---
'@cascivo/react': patch
---

`@cascivo/react/styles.css` no longer ships CSS comments: 60.0 → 48.3 KB gzip (398 → 359 KB raw), with no rule changed. The token and theme sources it inlines carried 10.5 KB gzip of explanatory prose, and every component sheet still had a bundler marker. Apps that import components through a bundler were never affected; this is the single-file `<link>` / CDN path.
