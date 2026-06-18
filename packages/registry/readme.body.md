Registry client and type definitions — reads `registry.json` and validates component entries. Used internally by the CLI and MCP server.

## shadcn registry interop

In addition to cascivo's own registry, the build emits a **shadcn-registry-compatible** projection so the shadcn CLI can install a cascivo component directly:

```sh
npx shadcn add https://<host>/r/shadcn/button.json
```

Each `r/shadcn/<name>.json` is a shadcn `registry:component` item with the source files inlined as `content`. This is purely additive — `npx cascivo add` and cascivo's own `registry.json` schema are unchanged.

**CSS-native caveat:** cascivo components are `.tsx` + `.module.css` and rely on the `@cascivo/core` peer plus a `@cascivo/themes` stylesheet import — there is no Tailwind config or `cssVars` block to merge. After adding a component via the shadcn CLI, install `@cascivo/core` and import a theme (e.g. `@cascivo/themes/light.css`).
