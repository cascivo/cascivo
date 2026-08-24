# Cutting 1.0.0 — runbook

**Status:** prepared, not published. Everything in
[`../plans/1-0-0-readiness-analysis.md`](../plans/1-0-0-readiness-analysis.md) except the
stabilization window (B4) and the release itself is on
`claude/ui-library-1-0-0-readiness-h7mait`. This is the remaining sequence.

One thing this branch could **not** do: produce real screen-reader results. Driving NVDA and
VoiceOver needs Windows and macOS runners, so B5's second half is closed by automating the
merge (the nightly now opens a PR with the columns) and by correcting the published wording
in the meantime — not by shipping results. The first green run after this merges will open
that PR; review the logged phrases before merging it.

Nothing here is urgent. The point of 1.0 is to stop things moving, so the one irreversible
step — publishing — comes last and comes after a quiet period, not before one.

---

## Where things stand

| Item | State |
| --- | --- |
| **B1** stability contract | ✅ [`../UPGRADING.md`](../UPGRADING.md#the-stability-contract), published to `cascivo.com/docs/upgrading.md`; `SECURITY.md` support window |
| **B2** deprecated surfaces | ✅ 11 removed; `OverflowMenu` retained with `removeIn: '2.0.0'` |
| **B3** API-surface lock | ✅ `api-surface.json` + `pnpm api:check`, in CI after the build |
| **B4** stabilization window | ⏳ **the only remaining work — see below** |
| **B5** axe PR gate / AT loop | ✅ axe gates PRs (3×220 shards); AT results auto-open a PR |
| **B6** plan-status drift | ✅ 7 statuses corrected, 2 headers added |
| **B7** DOM-breaking work | ✅ deferred to 2.0, recorded in each plan and in the guard allowlist |
| **S1** RTL | ✅ `pnpm rtl:check`, documented in `COMPATIBILITY.md` |
| **S2** pending changesets | ✅ 8 in `.changeset/` — see the two-release note below |
| **S3** version alignment | ✅ decided and recorded |
| **S4** issue #163 | ✅ closed |

---

## B4 — the stabilization window

The reason to wait: `@cascivo/react` shipped 18 minors at roughly a 3-day cadence, and three
of the last six carried a real break (`BadgeShape` → `BadgeVariant` in 0.16, "the rendered DOM
changed" in 0.15, `DataTable` controlled selection reshaped across twelve components in 0.17).
A 1.0 tagged straight onto that cadence is a promise the process has not yet demonstrated it
can keep.

**Hold for four to six weeks.** The bar is not "no commits" — it is **no change that would
need a major**. `pnpm api:check` is the instrument: it fails whenever the built surface leaves
`api-surface.json`, so every surface change during the window is classified deliberately
rather than noticed later. Patches and additive minors are fine and expected; keep releasing
them.

The window ends when the last surface-affecting change is that far behind you. Restart it if a
major-worthy change lands — that is the signal working, not the plan failing.

---

## The two-release shape

The tree currently holds **eight changesets**: five that predate this work (one of which,
`field-composition-and-silent-data-loss`, is a correctness fix) and three written for it, two
of which are `major`.

Cut them as **two releases**, not one:

1. **`0.19.0` — the last 0.x.** Ship the five pre-existing changesets plus
   `api-surface-and-rtl-guards`. Move **both** major changesets —
   `remove-deprecated-surfaces-for-1-0.md` and `one-x-line-alignment.md` — out of
   `.changeset/` first (keep them somewhere; you are putting them straight back), so nothing
   computes a major.

   This gets the correctness fix and the new guards to adopters while they can still take
   them on a `^0.18` range, and it starts the stabilization window on a clean surface.

2. **`1.0.0` — the stability event.** After the window, restore both majors and release.
   `remove-deprecated-surfaces-for-1-0` carries `major` for the whole lockstep family, so
   `changesets` takes those eight from `0.19.x` to `1.0.0` together; `one-x-line-alignment`
   brings `tokens`, `themes`, `icons` and the `cascivo` CLI to `1.0.0` alongside them. Those
   four carry no breaking change — the major is the alignment decision itself.

A 1.0 that also carries feature work is two events in one tag. A 1.0 that carries only the
removals and the contract is reviewable in one sitting, and that is the point.

---

## Cutting it

```sh
# 0. from a clean main, with the window behind you
git switch main && git pull

# 1. everything, cold — this is the run that matters
pnpm ready:ci

# 2. the checks `ready` does not cover (network, minutes, or a packed artifact)
pnpm isolated:check      # packs the tarballs, type-checks them outside the repo
pnpm pack:check          # publint + attw over the packed artifacts
pnpm bare-page:check     # shipped styles.css and nothing else, real hit-testing
pnpm no-js:check         # server HTML, never hydrated, real keyboard
pnpm audit:stories && pnpm docs:coverage && pnpm links:check && pnpm deps:smoke

# 3. version + changelogs (does NOT publish)
pnpm exec changeset version

# 4. read the diff. Confirm:
#    - the eight lockstep packages all read 1.0.0
#    - tokens / themes / icons / cli bumped as intended
#    - the 0.x tooling packages did NOT bump into 1.x
#    - api-surface.json is committed and matches the build
git diff --stat

# 5. commit, push, and let the release workflow publish from main
```

`release.yml` publishes over npm trusted publishing (OIDC, provenance on). There is no
`NPM_TOKEN` to rotate and nothing to paste.

---

## After the tag

- **`verify-site`** runs `deployed-freshness.sh` post-deploy; it asserts npm `latest`, this
  repo's `registry.json` and `cascivo.com` all agree on the new version. Watch that job — it
  is the one that catches a half-propagated release.
- **Announce the removals**, not the number. The eleven removed surfaces are the only thing
  that can break an adopter on the way to `1.0.0`, and every one of them has a named
  replacement taking the identical argument. `breaking-changes.json` regenerates from the
  changesets, so `cascivo doctor --drift` will name them.
- **Update `docs/ROADMAP.md`**, which still describes the project as having "shipped its v1
  scope" in the pre-1.0 sense.
