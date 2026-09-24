# Governance, releases and support

What you can rely on when you adopt cascivo, stated as plainly as we can. The API promise
itself — what semver covers and what it does not — is in
[UPGRADING.md](./UPGRADING.md#the-stability-contract); this page covers who makes the calls,
how releases are paced, how long a line is supported, and how you can verify what you install.

## Who maintains it

cascivo has **one maintainer**. Much of the implementation is written by AI coding agents
working under that maintainer's direction, inside the rules in [`CLAUDE.md`](../CLAUDE.md).

That is a real risk for an adopter, so here is what bounds it rather than a reassurance:

- **Every change passes the same gates, whoever wrote it.** `pnpm ready` runs formatting,
  both host-lint configurations, more than a hundred guard scripts, the build, type checks
  and the test suites; CI adds axe on every pull request, a packed-tarball install under
  strict settings, a React Compiler build of an example app, visual regression on every pull
  request that touches a component (all components nightly), and a nightly screen-reader run. An agent cannot merge
  what a human could not.
- **MIT, and the code you copied is yours.** On the copy-paste path the component source lives
  in your repository. If the project stopped tomorrow, those components would keep working and
  you could keep maintaining them — there is no service, licence key or runtime fetch involved.
- **Everything needed to build and publish is in the repository.** Generators, registry,
  documentation site, release workflow: a fork can rebuild and republish all of it.
- **A second maintainer with publish rights is a goal, not yet a fact.** Until there is one,
  this page will keep saying so.

## How decisions are made

Direction follows the published [roadmap](../ROADMAP.md) and the reports adopters file. Open an
[issue or discussion](https://github.com/cascivo/cascivo/issues) to influence it; integration
reports have changed the library more than anything else. Breaking changes are proposed in the
changelog of a minor first (as a deprecation) and only land in a major.

## Release cadence

- **Patches** ship whenever a fix is ready.
- **Minors** are batched: **at most one every two weeks**, so a release is something you can
  read, not a stream to track.
- **Majors** ship only after a **release candidate has been on npm for at least four weeks**,
  and only remove what a previous minor already deprecated (with `removeIn` naming that
  major). A removal that skips the deprecation step is a bug in the release, not a policy
  choice — report it.
- The packages that share `@cascivo/core` always release together at one version; see
  [UPGRADING.md](./UPGRADING.md#the-cascivocore-family-versions-in-lockstep).

Every major and minor is recorded in the machine-readable
[`breaking-changes.json`](https://cascivo.com/breaking-changes.json), and
`cascivo doctor --drift` compares it with your lockfile.

## Support windows

- The **current major** gets bug and security fixes on its latest minor.
- When a new major ships, the **previous major gets security fixes for six months**.
- Older majors, and packages still on `0.x`, get no backports — fixes land on their latest
  version only.

There is no paid support or SLA. Security reports go through [SECURITY.md](../SECURITY.md).

## Verifying what you install

- **npm provenance.** Every package is published from the `release` GitHub Actions workflow
  through npm trusted publishing (OIDC — no long-lived token), with a signed SLSA provenance
  attestation. Check one with `npm view @cascivo/react dist.attestations`, or
  `npm audit signatures` in your own project.
- **SBOMs.** Each release attaches a CycloneDX SBOM of the package's production dependencies to
  its GitHub release.
- **Few runtime dependencies.** The runtime packages depend on each other and on
  `@preact/signals-react`; charts, editor, flow and email have no third-party runtime
  dependencies at all.
- **The registry validates what it installs.** `cascivo add` rejects registry items whose file
  targets would write outside your project.

## Accessibility conformance

Components target WCAG 2.2 AA. axe runs on every pull request, and a nightly run drives NVDA
and VoiceOver over a representative set; the results, including partial passes, are on the
[accessibility page](https://cascivo.com/accessibility). There is **no third-party audit or
VPAT/ACR yet**. If procurement needs one today, cascivo cannot provide it.
