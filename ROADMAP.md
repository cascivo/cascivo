# Roadmap

cascivo is a CSS-native, signal-driven, AI-first React design system. This is a
forward-looking view of where the project is headed — not a changelog. For what
has already shipped, see [CHANGELOG.md](CHANGELOG.md).

_Last updated: 2026-07-05._

## Where we are today

- **192 components** across inputs, display, overlay, navigation, layout, feedback,
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

## Later (next quarter)

- **Ecosystem growth.** More first-party registries and templates beyond the seed
  set (marketing pack, admin pack, AI-chat pack), plus a "publish your own
  registry" guide around the registry starter. `cascivo add owner/repo/component`
  (GitHub-as-registry) already works today.
- **Versioned docs.** Pin documentation to released versions so upgrade guidance
  stays accurate across majors.
- **Design-tool bridge.** A Figma kit mapped to the same tokens the code reads.

## How this is decided

Priorities follow the gaps that matter most for adoption: nothing on any public
surface should be false or broken (correctness first), then the first five
minutes of evaluation, then the depth that keeps teams on the library. If you
want to influence direction, open a
[discussion or issue](https://github.com/cascivo/cascivo/issues) — real
integration reports have shaped several of the items above.
