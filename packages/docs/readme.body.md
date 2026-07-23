The complete cascivo documentation, shipped as an npm package so an AI agent or a
human can read it **fully offline — no website needed**. Every generated doc
surface (`llms.txt`, `llms-full.txt`, per-component references, the concept
guides, `registry.json`, and the token/icon catalogs) travels inside this one
package.

## Why this exists

cascivo has no training-data footprint yet, and adopters repeatedly report that
`npmjs.com` returns HTTP 403 to non-browser fetches and `cascivo.com` isn't always
crawlable, proxied, or reachable. But the npm **registry** — the thing that
installed your packages — always is. So the docs ride that same channel.

## Use it — no install

```sh
npx -y @cascivo/docs                 # print llms.txt (the index — lists every doc)
npx -y @cascivo/docs button          # print one component's reference
npx -y @cascivo/docs area-chart      # nested docs resolve by name too
npx -y @cascivo/docs guide theming   # print a concept guide
npx -y @cascivo/docs --full          # print llms-full.txt (the whole library, one file)
npx -y @cascivo/docs --list          # list every available doc path
npx -y @cascivo/docs --dir           # print the content dir so you can grep it directly
```

`npx` runs it from cache without touching your project's `package.json` — used,
never installed.

### No npm at all?

Pull the tarball straight from the registry and read the files:

```sh
npm pack @cascivo/docs
# or
curl -L https://registry.npmjs.org/@cascivo/docs/-/docs-<version>.tgz | tar xz
# → package/content/llms-full.txt, package/content/llms/<name>.md, …
```

### Installed (offline-first repos / tooling)

```sh
pnpm add -D @cascivo/docs
```

Then resolve any file through the exports map — e.g.
`require.resolve('@cascivo/docs/llms-full.txt')`,
`@cascivo/docs/llms/button.md`, `@cascivo/docs/guides/getting-started.md`,
`@cascivo/docs/registry.json`.

## What's inside `content/`

- `llms.txt` / `llms-full.txt` — the index and the entire library in one file.
- `llms/<name>.md` — per-component reference (props, examples, a11y). Nested by
  family (`llms/chart/area-chart.md`, `llms/layout/…`).
- `context/<name>.md` + `context.json` — intent/anti-patterns for agents.
- `guides/<slug>.md` — the concept guides (getting-started, theming, tokens,
  troubleshooting, migrating-from-shadcn, …).
- `registry.json`, `tokens.catalog.json`, `icons.catalog.json`,
  `breaking-changes.json`, `marketplace.json` — the machine-readable indexes.
- `versions.json` — the published version of every cascivo package at build time,
  so you can confirm these docs match your installed set.

Everything here is generated from the same sources the docs site serves and is
republished with every release, so the registry copy never lags the packages.
