# Roadmap

cascivo is a CSS-native, signal-driven, AI-first React design system. This is a
forward-looking view of where the project is headed — not a changelog. For what
has already shipped, see [CHANGELOG.md](CHANGELOG.md).

_Last updated: 2026-07-05._

## Where we are today

- **197 components** across inputs, display, overlay, navigation, layout, feedback,
  plus a **25-type chart family** (`@cascivo/charts`) built from scratch with zero
  runtime dependencies.
- **12 first-party themes**, applied via a single `data-theme` attribute and
  overridable at the token layer.
- **Owned-code distribution** — components are copy-pasted into your project via
  `npx cascivo add`, backed by a **versioned registry** (`registry.json` +
  per-version `r/<name>@<version>.json` artifacts).
- **`cascivo update`** performs a real three-way merge (base → your edits →
  upstream), so you can pull upstream fixes without losing local changes — a
  guarantee an unversioned registry cannot make.
- **AI layer** — every component ships a machine-readable manifest that powers an
  MCP server (`select`, `scaffold`, `validate`), Claude Code skills, and
  `llms.txt`.

## Next (this quarter)

- **Accessibility, on the record.** Promote the axe sweep from nightly to
  PR-blocking once the finding backlog is triaged, and publish a standing
  per-release conformance report (axe + APG keyboard matrix).
- **Assistive-technology pass.** NVDA and VoiceOver now run in CI via guidepup
  over the 12-component plan (`.github/workflows/a11y-at.yml`), publishing a
  screen-reader announcement matrix on the accessibility page. Remaining: land
  the first runs, human-confirm the automated grades, and cover JAWS manually
  (it can't be driven on hosted runners).
- **Theme builder → project handoff.** Let the `/create` theme configurator hand
  its output directly to the CLI, so "design a theme in the browser" ends in an
  installable theme rather than a copy-paste.

- **A routed scaffold.** `cascivo create` now ships the app shell as its own
  `Shell.tsx` with a `children` slot, so adding a router means deleting `App.tsx`
  and `src/sections/` rather than re-deriving the shell. The next step is a
  `--router react-router|tanstack|none` flag so the happy path never generates an
  architecture the adopter immediately guts (2026-08-14 report §1). Deliberately
  deferred: three router templates is three more surfaces to keep green, and the
  shell split plus the published router guide captured most of the value.

## Later (next quarter)

- **Ecosystem growth.** More first-party registries and templates beyond the seed
  set (marketing pack, admin pack, AI-chat pack), plus a "publish your own
  registry" guide around the registry starter. `cascivo add owner/repo/component`
  (GitHub-as-registry) already works today.
- **Versioned docs.** Pin documentation to released versions so upgrade guidance
  stays accurate across majors.
- **Design-tool bridge.** A Figma kit mapped to the same tokens the code reads.
- **Domain-state primitives, maybe.** Every deploy console in this space
  hand-writes the same `deploy state → tone → label` map; `Status` takes a tone,
  not a semantic state (2026-08-14 report §13). Held here rather than built,
  because a `DeploymentStatus` component bakes one vendor's vocabulary into a
  general design system. The cheap 80% already shipped: `Tone` is importable from
  `@cascivo/react/types`, so that map is three typed lines instead of an untyped
  string union.

## How this is decided

Priorities follow the gaps that matter most for adoption: nothing on any public
surface should be false or broken (correctness first), then the first five
minutes of evaluation, then the depth that keeps teams on the library. If you
want to influence direction, open a
[discussion or issue](https://github.com/cascivo/cascivo/issues) — real
integration reports have shaped several of the items above.
