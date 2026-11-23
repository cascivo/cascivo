---
'cascivo-web': minor
'cascivo-html': minor
---

cascivo-web strict-CSP output and theming (#305): `[build] inline_styles = false` moves component styles into `cascivo.css` (`data-cv-style` hooks); `[build] external_scripts = true` writes component scripts, `theme_script()` and `islands_script()` to `/cascivo.js`, `/cascivo-theme.js` and `/cascivo-islands.js` (the theme script stays blocking); `[build] hash_assets = true` gives `cascivo.css` and those scripts content-hashed `/_cw/` names; `dark_theme` adds a `prefers-color-scheme: dark` theme to `cascivo.css`; a `[brand]` table (`primary`, `accent`, `radius`, `gap`, `density`, `font`, `mono`) generates token overrides. The starter's 404 page is now `pages/404.md` with the layout. cascivo-html adds `theme_css` and `theme_names`.
