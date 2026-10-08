Browse the cascivo components a project copied: every example in each component's manifest,
in all twelve themes and at every breakpoint, with its props and the tokens it reads. No stories
to write.

```sh
npx @cascivo/workbench          # scans src/
npx @cascivo/workbench app/ui   # or the directory you name
```

> Not on npm yet. Inside this repo, run it from a project that has the themes installed:
> `cd apps/examples/react-vite && node ../../../packages/workbench/bin/cascivo-workbench.mjs ../../../packages/components/src`.

## Entries

- **Components.** `cascivo add` copies each component's manifest (`<name>.meta.ts`) next to its
  source. Each example in `meta.examples` becomes one entry. An example that uses state from
  the host app (`isOpen`, `rows`) fails inside its own entry and says what it needs.
- **Previews.** Any `*.preview.tsx` file renders its default export with its `previewProps`
  export, the convention `@cascivo/email-preview` uses. Use one for a page or for your own
  component.

Every entry has a URL (`#component/<path>/<n>`, `#preview/<path>`).

## Panels

- **Theme** and **width** switch the stage. The widths are cascivo's breakpoint scale.
- **Code**, **Props** and **Tokens** read the manifest. Tokens show their values resolved on
  the stage in the current theme.
- **Copy as agent context** copies the component's props and the current example as Markdown,
  the context an agent needs to use it.

## Options

| Option           | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| `--style <file>` | A stylesheet your app loads (a reset, fonts). Repeatable. |
| `--port <n>`     | Port to listen on (default 4191, or the next free one).   |
| `--host [addr]`  | Listen on a network address, not only localhost.          |
| `--open`         | Open a browser when the server is ready.                  |

The workbench loads `@cascivo/tokens` and `@cascivo/themes/all.css` from your project, which
`npx cascivo init` installs.
