# Rust changesets

Versioning and publishing of the Rust crates (`cascivo-html`, `cascivo-html-cli`, `cascivo-web`) on crates.io
follow the same flow as the npm packages, driven by `scripts/rust-release/cli.ts` because the
`@changesets` CLI only understands npm workspaces. The file format is identical.

- `pnpm changeset:rust` — record a change interactively
- `pnpm changeset:rust add --crate cascivo-html --bump minor --summary "…"` — same, non-interactive (agents)
- `pnpm changeset:rust status` — pending bumps and the versions they produce
- `pnpm changeset:rust version` — apply them (done by the "Version Rust crates" PR in CI)
- `pnpm changeset:rust publish-plan` — crates whose version is not yet on crates.io (0.0.0 skipped)
- `pnpm changeset:rust binaries` — released crates with a `[[bin]]` target, for the prebuilt-binary job

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

`cascivo-web` is not in the fixed group: it versions on its own. While its `Cargo.toml` says
`version = "0.0.0"` it is an unreleased placeholder: `publish-plan` and `binaries` skip it, so
merging to `main` never publishes it. Its first changeset (minor gives `0.1.0`) goes through the
normal Version PR, and merging that PR is the release decision. Only the crates.io name has to
exist for trusted publishing, so the very first publish of a brand-new crate is manual (see
`docs/RELEASING.md`).
