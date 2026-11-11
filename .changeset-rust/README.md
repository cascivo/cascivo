# Rust changesets

Versioning and publishing of the Rust crates (`cascivo-html`, `cascivo-html-cli`) on crates.io
follow the same flow as the npm packages, driven by `scripts/rust-release/cli.ts` because the
`@changesets` CLI only understands npm workspaces. The file format is identical.

- `pnpm changeset:rust` — record a change interactively
- `pnpm changeset:rust add --crate cascivo-html --bump minor --summary "…"` — same, non-interactive (agents)
- `pnpm changeset:rust status` — pending bumps and the versions they produce
- `pnpm changeset:rust version` — apply them (done by the "Version Rust crates" PR in CI)
- `pnpm changeset:rust publish-plan` — crates whose version is not yet on crates.io

A changeset is a markdown file here:

```md
---
'cascivo-html': minor
---

Added `--fetch` image embedding.
```

`config.json` `fixed` groups release together at one shared version, so naming either crate
releases both. A PR that changes `crates/*/src/**` or a non-version line of `crates/*/Cargo.toml`
needs a changeset, or the `no-rust-changeset` label. See `docs/RELEASING.md`.
