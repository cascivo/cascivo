---
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/flow': patch
'@cascivo/editor': patch
---

Every component now declares `clientJs`, so `registry.json` can answer "does this hydrate?"
for the whole catalog.

96 of 209 manifests (46%) declared nothing — including `DataTable`, `Calendar`, `Form`,
`Toast` and every chart. `client-js-parity.test.ts` only ever validated manifests that _did_
declare the field, so a missing value looked exactly like a value under no rule. Coverage is
now **74 `none` · 72 `enhancement` · 63 `required`**, and
`scripts/checks/client-js-coverage.test.ts` fails on any manifest that omits it.

The labels are derived from what components actually emit. Charts were server-rendered
through `renderToString` — every one emits the SVG _and_ the accessible `<table>` fallback
with real data points, so charts read with JS off (`enhancement`); `Stream` is the exception,
since a live feed frozen at one frame is not the component. Components and blocks were
rendered from their own manifest examples in an SSR harness, recording native inputs, anchors
and JS-only buttons: that is what separates `TimePicker` (native `<input type="time">` →
`enhancement`) from `RatingGroup` (buttons with `role="radio"` → `required`), and `Toc` (real
anchors) from `Pagination` (buttons plus a select that navigate nothing). Each declaration
carries a one-line reason in its manifest.

**The `'enhancement'` vs `'required'` definition is now fixed, and it changed.** The guard
previously described the split as content-based ("is content merely hidden or genuinely
unreachable") while also saying `clientJs` records what a component needs "to be correct".
Those disagree on ~30 components: `Calendar` server-renders a complete 32-button month grid
and cannot pick a date; `Tabs` renders one panel and cannot reach the others. The definition
is now **function-based** — `'required'` whenever the component's primary job needs JS, even
when its markup is all present. If you read `clientJs` to decide what can render from a
Server Component, this is the answer you wanted; the content-based reading would have told
you to ship a dead Calendar.

The `llms/<name>.md` "Client JavaScript" wording was updated to match.
