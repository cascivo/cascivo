---
'@cascivo/react': minor
---

Theme: an explicit `defaultTheme` now wins over the visitor's OS `prefers-color-scheme`.

Previously both `ThemeProvider` and `themePreloadScript()` resolved the initial theme as
`persisted > OS preference > defaultTheme`, so a "dark by default" (`defaultTheme="dark"`)
app rendered _light_ for a light-OS visitor, and a custom `defaultTheme="midnight"` was
replaced by `'light'`/`'dark'` from the OS (2026-07-20 adopter report). The precedence is
now **persisted value > `defaultTheme` (if you passed one) > OS `prefers-color-scheme` >
`'light'`**. Omit `defaultTheme` to keep the old OS-following behavior.

`themePreloadScript()`'s JSDoc and the theming docs now spell out that the script sets
`data-theme` before hydration — add `suppressHydrationWarning` to the `<html>` it writes
to, or React 19 logs a hydration mismatch.

Migration: if you passed `defaultTheme` AND relied on the OS overriding it, drop
`defaultTheme` to follow the OS. Apps that passed nothing are unaffected.
