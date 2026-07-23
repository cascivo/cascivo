---
'@cascivo/react': minor
---

`useTheme()` now returns the theme **name as a plain string**, not a signal.

`const [theme, setTheme] = useTheme()` — `theme` is a `string` you read directly (`theme === 'dark'`), and the component re-renders on change with no signal handling. Previously the first tuple element was a `Signal<string>` whose `.value` you had to read, which repeatedly led React adopters (no signals transform) to mirror the theme in `useState` — the exact anti-pattern cascivo bans.

**Breaking:** if you read `theme.value`, drop the `.value` — `theme` is already the string (TypeScript flags this: `.value` on a `string` is an error). Code that needs the underlying signal (`computed()`, `effect()`, Preact) can get it from the new `themeSignal()` export.

Also: the spacing-scale type used by layout `gap` props is now exported as `SpaceStep` (a single shared declaration), so compiler errors name `SpaceStep` instead of the bundler's `SpaceStep$3`/`$4` aliases.
