---
'@cascivo/eslint-config': minor
---

Enables `cascivo/prop-vocabulary` at `warn`, via the new `@cascivo/eslint-plugin`.

The rule answers a wrong prop guess with the prop that exists. TypeScript already rejects
`<Text tone="subtle">`; its message names the mistake and not the fix, so the adopter goes
looking for the docs — the dependency a 2026-08-21 report named as the system's real weak
spot ("the docs are doing work the API should eventually do itself"). The rule says:

```
`Text` has no `tone` prop — it is `muted`. `tone` is the catalog's SEVERITY vocabulary
(Status, Badge, Timeline, SideNav). Text emphasis is the boolean `muted`.
```

It also autofixes `gap="4"` → `gap={4}`, rewrites a foreign import name to the cascivo
component (`Dialog` → `Modal`), and flags `const { theme } = useTheme()` (a tuple) and
`<Flex justify=…>` with no `direction` (`Flex` is vertical by default).

`warn`, never `error`: a lint error over a naming opinion is a reason to delete the config,
which would take `react-hooks/immutability` with it. Spread `cascivoPropVocabulary` yourself,
or take all three fragments via the default export.
