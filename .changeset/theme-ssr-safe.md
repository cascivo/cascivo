---
'@cascivo/core': minor
'@cascivo/react': patch
'@cascivo/mcp': patch
---

The theme runtime is now safe under SSR, hydration and soft navigation.

- **Behaviour change:** during SSR and the hydration render, `useTheme()` returns the constant
  `'light'`. It moves to the persisted or controlled value in the render right after hydration
  (as `next-themes` does). Before, it returned the persisted client value during hydration, so
  any page whose visitor had picked another theme failed hydration with React #418. The
  `data-theme` attribute is still right on first paint, because `themePreloadScript()` and the
  controlled `ThemeProvider` script set it. This is a regression for controlled SSR: a Next.js
  `<ThemeProvider value="dark">` with a component that prints `useTheme()[0]` now renders `light`
  until hydration. Express theme-dependent visuals in CSS (`[data-theme='dark'] &`).
- On the server, `ThemeProvider` no longer writes the module theme store, so a `value` from one
  request no longer leaks into the next.
- `themePreloadScript({ reapplyOn })` re-runs the script on the named document events. Pass
  `'astro:after-swap'` so Astro's `<ClientRouter>` keeps the theme across soft navigations.
  Without the option the script is byte-identical to before.
- `themePreloadScript` is also exported from `@cascivo/core/pure`.
- `useToast().toast()` called during a server render is now a no-op instead of queueing a toast
  for the next visitor.
