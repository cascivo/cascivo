# Rust + HTML-first stack: results, W4 (landing-page pilot)

Plan: [rust-html-stack-plan.md](rust-html-stack-plan.md). W4 renders the cascivo.com home page
(`/`) with `crates/cascivo-web` as static HTML. All other routes stay on the Preact SPA.
Measured 2026-11-21 in a cloud container with 4 vCPUs, headless Chromium, against `vp preview`
of one build.

## Verdict

**Pass on both kill criteria, with one LCP regression on mobile (see Numbers).**

- Visual parity is reached. Desktop differs by 0.06 % of pixels and mobile by 1.4–1.8 %. The
  mobile difference is a timing artefact of the baseline capture, not a regression (see below).
- Interactive sections need 5 Preact islands. The limit was "more than 5", so this is at the
  limit. Every other section is static HTML.

## What was built

**Build: the SPA is untouched.** The islands and home CSS are a second Vite pass
(`CASCIVO_SITE_PASS=home`) into the same `dist/`. Sharing one Rollup graph with `index.html`
re-chunked the SPA's CSS, which inverted the cascade-layer order site-wide
(`scripts/checks/site-layer-order` caught it). The SPA's output now has the same hashes as
before W4.

**cascivo-web: 9 new modules, about 2.1k lines including tests.**
- `head`: title, description, canonical, robots, Open Graph, Twitter, theme-color and JSON-LD.
- `assets`: copies files and gives them content-hashed names, `/_cw/<stem>.<hash8>.<ext>`.
- `vite`: reads the Vite manifest and the CSS-module class map (`vite()`, `vite_css()`, `m()`).
- `islands`: `island()` attributes and a 0.8 KB inline loader with `load`, `idle` and `visible`
  modes.
- `theme`: the no-flash theme script, with the same behaviour as `index.html` and
  `@cascivo/astro`.
- `images`: build-time resize to `srcset`, with `width`/`height` set and no upscaling.
- `highlight`: a filter whose output is byte-compatible with what `CodeSnippet` renders.
- `data`: JSON or TOML files exposed as template globals.
- `web`: argument parsing and registration.

Configuration is strictly additive: the new `site.toml` tables are `[build] [assets] [images]
[vite] [data]`, and `build.cascivo_css = false` opts out of `cascivo.css`. New dependencies are
`image 0.25` (jpeg, png and webp only) and `serde_json`. cascivo-web has 62 tests.

**apps/site, Vite side.**
- `build.manifest` is on.
- There are 5 island entries in `src/marketing/islands/*.tsx`, each a `mount(el)` that renders
  the existing component.
- `home.css.ts` carries the component CSS modules that the static markup uses.
- `home-global.css` carries the global sheets.
- `dist/.vite/css-modules.json` comes from `css.modules.getJSON`.
- `dist/.vite/web-data.json` holds every derived number and list the home prints (counts,
  benchmark figures, parity, nav, showcase, starters). It is unit-tested against `registry.json`
  and `figures.ts`.

**apps/site/web: the site, 435 lines of templates.**
- One file per section, plus `copy.js`, which copies text for any `[data-copy]` button.
- Hashed class names always go through `m()`, never literals.
- Every derived value goes through `data.web.*`.

**Sections.**

| Section | Port |
|---|---|
| hero (except the live frames), proof, compare, ai, beyond, terminal, quickstart, showcase, cta, footer | Static HTML |
| header | Island `header`, mounted on load. The static fallback is identical to the island's output. |
| hero live Pulse frames | Island `hero-frames` |
| signals demo | Island `signals` |
| theme switcher | Island `themes` |
| app builder | Island `app-builder` |

- `@cascivo/elements` did not fit any of these. It has combobox, date picker and menu. The
  header's Resources dropdown lives inside the header island.
- Search lives inside the header island, as before.
- The proof bar chart is a static SVG computed from the data. Its plot is a nested SVG sized as
  the container width minus the margins, with percentage x geometry. It follows its container
  like the SPA's ResizeObserver layout, and the text stays at 11 px.
- Static markup is DOM-identical to the SPA's rendered DOM, compared with a normalising HTML
  differ. Island fallbacks are full static copies, so there is no layout shift before mount.

## Numbers

Same server, same build. The SPA's own `dist/index.html` was saved before `build:web` replaced
it. Reproduce:

```sh
vp run @cascivo/site#build
cp apps/site/dist/index.html /tmp/spa.html
pnpm --filter @cascivo/site build:web
(cd apps/site && vp preview --port 4173) &
HOME_HTML=/tmp/spa.html node apps/site/scripts/measure-home.mjs http://127.0.0.1:4173 base
node apps/site/scripts/measure-home.mjs http://127.0.0.1:4173 web
node apps/site/scripts/compare-home.mjs base web cmp
```

Add `THROTTLE=1` to the measure runs to get the LCP rows.

| Metric (gzip) | SPA home | cascivo-web home | Change |
|---|---|---|---|
| JS before scrolling | 71.8 KB (22 files) | **30.8 KB** (10) | −57 % |
| JS after a full scroll | 82.8 KB (32) | **47.0 KB** (16) | −43 % |
| CSS before scrolling | 25.8 KB (5 files) | 29.6 KB (9) | +15 % (header island and component sheets are render-blocking) |
| CSS after a full scroll | 37.7 KB | 37.3 KB | about the same |
| HTML document | 2.3 KB (prerendered shell) | 16.5 KB (whole page) | +14 KB |
| LCP, desktop 1280, throttled, median of 6 | 1,756 ms | **1,552 ms** | −12 % |
| LCP, mobile 390, throttled, median of 6 | **784 ms** | 900 ms | +15 % |
| LCP, unthrottled | 130–250 ms | 140–240 ms | noise |
| cascivo-web build of `/` | n/a | 0.8–1.0 s | almost all of it is resizing 4 showcase JPEGs to 2 widths |

- Throttled means 150 ms RTT, 1.6 Mbps down and 4× CPU, via CDP. Lighthouse is not installed in
  the container.
- **Mobile LCP is the one regression.** On mobile the SPA's LCP element is its prerendered
  static body, which paints after one stylesheet. The static home blocks on 9 stylesheets:
  - the global sheet,
  - 5 component-module sheets,
  - the header island's sheet.

  `vp preview` speaks HTTP/1.1 with 6 connections per host, so under 150 ms RTT the extra sheets
  cost a round trip. Cloudflare serves HTTP/2, so they would multiplex. That is not measured here.
- **Fix: done in W6**, see "W6 follow-up" below.
- Below-the-fold islands load their sheets with a non-blocking media swap. Putting them in the
  `<head>` cost about 100 ms more on mobile.

**Visual parity.** Full-page screenshots at 1280×800 and 390×844 in `poster` and `poster-dark`,
with reduced motion. A pixel differs when any RGB channel differs by more than 24. Run-to-run
noise of the baseline is 0.00 %.

| Screenshot | Pixels that differ | Height |
|---|---|---|
| desktop poster | 0.06 % | 10,926 = 10,926 |
| desktop poster-dark | 0.06 % | equal |
| mobile poster | 1.80 % | 22,642 = 22,642 |
| mobile poster-dark | 1.39 % | equal |

Where the differences come from:
- **Desktop:** chart anti-aliasing. The SVG geometry differs at sub-pixel level.
- **Mobile:** almost all of it is the showcase band. The SPA's lazy-loaded screenshots had not
  loaded when the baseline was captured, so they show as hatching. The static page shows the
  images.

The parity threshold is **≤ 0.1 % on desktop**. On mobile it is **≤ 0.1 % outside the showcase
band**; both pass.

## Integration with the Cloudflare build (documented, not deployed)

1. `vp run @cascivo/site#build` runs the SPA pass as today, then the home pass.
2. `pnpm --filter @cascivo/site build:web` runs
   `cargo run --release -p cascivo-web -- build web --out dist-web`, then
   `scripts/merge-web-home.mjs`.
3. The merge step replaces only `dist/index.html` and adds `dist/_cw/**`.
4. It also fails the build if any island chunk lost its `default` export.

In `.github/workflows/cf-pages.yml` this step runs only when the repository variable
`CASCIVO_WEB_HOME` is `'1'`. Until that is set, deploys are unchanged.

`public/_headers` marks `/_cw/*` as immutable.

**Routing.** Cloudflare Pages serves `dist/404.html` for unknown paths. That file is the SPA
shell, not `index.html`. So swapping `index.html` changes only `/`. Every other route is either
prerendered (`dist/<route>/index.html`) or the 404 shell, as before. Links from the static home
are plain `<a>`, so they load pages normally. Client-side navigation back to `/` inside the SPA
still renders the Preact home.

## Open issues

- **Rust in the build image.** The CI build of the site now needs Rust. `ubuntu-latest` has it,
  and the first build compiles cascivo-web in about 45 s. Caching `target/` or downloading a
  release binary would remove that.
- **Static ids.** Static ids replace `useId` in the proof and themes fallbacks.
- **Image output.** `image` encodes WebP lossless only, so showcase images keep JPEG
  (`format="keep"`).
- **Error messages.** The cascivo-web error for a failed `{% include %}` hides the underlying
  cause. It should be chained.
- **Type check.** `apps/site` `tsc --noEmit` needs the workspace packages built first, as before.

## W6 follow-up

**1. One render-blocking stylesheet.** cascivo-web has a new template function,
`css_bundle(hrefs, name="bundle")`. It reads the listed Vite CSS files from the manifest's dist
directory and writes one `/_cw/<name>.<hash8>.css`. Rules:
- Files keep the order given (`vite_css` gives dependencies first), each file once.
- Top-level `@layer a, b;` statements are hoisted to the top of the bundle, deduplicated, in
  first-seen order. That is the order separate sheets would have applied, so the cascade is
  unchanged. Layer blocks and `@layer` inside `@media` or strings are left alone.
- A relative `url()` fails the build, because it would resolve against `/_cw/` after the move.
- It is unit-tested (hoisting, strings and comments, dist dir, relative urls) and integration-tested
  on the `web` fixture (one hashed file, order, one layer statement).

`apps/site/web/layouts/home.html` bundles the render-blocking set. The home now has one blocking
stylesheet instead of 9 (the below-the-fold island sheets still load without blocking).
`home-perf.css` also adds `content-visibility: auto` to the bands after the first two, only in the
static pass. Without it first paint waited about 0.5 s on style and layout of the whole page.

Mobile 390, throttled as above, final LCP, 9 runs each, **served with gzip**
(`apps/site/scripts/serve-gz.mjs`, same HTML routing for all three):

| Variant | Median | Range |
|---|---|---|
| SPA home | 808 ms | 752–960 |
| cascivo-web, 9 sheets (no bundle) | 708 ms | 604–752 |
| cascivo-web, bundled | **692 ms** | 632–756 |

The goal (mobile LCP ≤ SPA) is met: −14 % against the SPA. Two caveats from the measuring:
- **`vp preview` does not compress**, so the W4 numbers were measuring about 168 KB of raw CSS per
  page, at a throttle that CDP applies per request. On that server splitting the CSS into
  parallel requests looks faster than bundling (about 650 ms against about 1,000 ms), which is
  an artefact of the setup. With gzip the bundle is on par with or slightly ahead of the split
  version, and that is closer to Cloudflare. Bundling's gain over split sheets is small here
  (within run-to-run noise); the gain over the SPA comes mostly from `content-visibility`.
- The comparison of 692 ms with W4's 900 ms is not valid: different server. Use the table above.

**2. Flaky `tests/dev.rs`.** It asserts only that an edit becomes visible without a rebuild, with
a 30 s liveness bound. The latency is reported by `apps/bench/static-compare/measure.mjs`
(22 / 39 ms median / max in W3) and is not gated in CI.

**3. Copy drift.** Chosen: a deterministic test (`src/marketing/web-copy.test.ts`), not a shared
data file. It parses each poster `.tsx` with the TypeScript compiler, takes the JSX text runs and
`aria-label`/`alt`/`title` strings that read as prose (4+ words, mostly plain words), and requires
each to appear in the section templates that port it (entities decoded, whitespace folded). Why not
shared data: the copy is spread over 13 components and mixed into markup with inline `<code>` and
links, so moving it means rewriting every component and template, in a design the SPA home will
delete. The test costs 80 lines, touches nothing else, and a mutation check showed it fails on a
one-word edit in `cta.html`. Its limit: it checks that JSX copy exists in the template, not the
reverse, and skips text that only exists in data (counts, figures), which `web-data.test.ts`
covers. PosterColocation (only on `/modern-css`), PosterLiveStrip (needs a Worker URL) and
island-only files are not mapped.

**4. Hard-coded values.** `webData` now emits `chart.fills` (from `lib-colors.ts`),
`chart.ticks` (the charts engine's `niceTicks`, the same function and default count as
`BarChart`) and `header.popoverAnchor`. The proof and header templates read them. Tests compare
each with its source.

**5. Runner label.** `macos-15-intel` is a valid GitHub-hosted Intel macOS label (listed in the
GitHub-hosted runners reference, free for public repositories, no deprecation notice; the
runner-images README lists it for macOS 15 x64). `macos-13` and `macos-14` are retired. No change.
