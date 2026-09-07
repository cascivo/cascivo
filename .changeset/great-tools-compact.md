---
'cascivo': patch
'@cascivo/mcp': patch
'@cascivo/registry': patch
'@cascivo/vite-plugin': patch
---

The four packages that build with `vp pack` are minified too. These were not merely
whitespace-heavy like the rest — they were never minified at all, shipping full identifiers
and every comment, so they had the most to give:

```
cascivo              36.0 → 25.0 KB gzip   (-31%)
@cascivo/mcp         19.3 → 13.7           (-29%)
@cascivo/registry     6.5 →  4.1           (-37%)
@cascivo/vite-plugin  1.8 →  0.6           (-64%)
```

That is 20.2 KB more, and 49 KB gzip off the published surface across the whole sweep.

`vp pack` ignores `rollupOptions`, so these take the `--minify` flag in their build script
rather than the shared rolldown option the other packages use. `scripts/build/minify.ts`
documents both halves — a package that moves between the two build paths loses this silently
otherwise.

None of the four is browser payload, so this is install size rather than runtime cost. The
reason to do it anyway is that the debuggability argument for leaving them readable does not
hold: all four already publish sourcemaps with `sourcesContent` embedded, so a stack trace
out of the minified CLI still resolves to the original TypeScript.

Exercised after the change, not just built: `cascivo --help`, the MCP server answering
`initialize` and `tools/list` over stdio (23 tools), both packages keeping their shebang and
executable bit, and the `cold-adopter`, `npm-bootstrap`, `deps:smoke`, `scaffold-contract`
and `pack:check` gates that run the packed CLI for real.
