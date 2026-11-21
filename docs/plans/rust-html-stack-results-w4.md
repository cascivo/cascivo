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
- **Fix, not done:** emit one stylesheet for the home. Rolldown ignored `cssCodeSplit: false` for
  shared sheets. The fix is a concat step in cascivo-web or the merge script.
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
- **Two sources of truth.** The section templates duplicate the poster JSX. Copy edits in
  `poster/*.tsx` must be repeated in `apps/site/web`. Until the SPA home is deleted, a parity
  check in CI (`measure-home` + `compare-home`) would catch drift. Not wired yet.
- **Hard-coded values.**
  - The proof chart's colour mixes and tick step are hard-coded in the template. Their sources
    are `lib-colors.ts` and the charts nice-ticks.
  - The header island fallback contains the SPA's popover anchor name (`--cascivo-popover-P0-0`).
  - Static ids replace `useId` in the proof and themes fallbacks.
- **Image output.** `image` encodes WebP lossless only, so showcase images keep JPEG
  (`format="keep"`).
- **Error messages.** The cascivo-web error for a failed `{% include %}` hides the underlying
  cause. It should be chained.
- **Type check.** `apps/site` `tsc --noEmit` needs the workspace packages built first, as before.
