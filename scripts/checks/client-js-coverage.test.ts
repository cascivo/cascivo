/**
 * `clientJs` coverage ratchet.
 *
 * `ComponentMeta.clientJs` is the field an agent or an adopter reads to decide whether a
 * component renders from a Server Component without ever hydrating. It is the whole RSC
 * story in one enum, and `client-js-parity.test.ts` validates it carefully — but only for
 * manifests that actually declare it. On 2026-08-14, 96 of 209 manifests (46%) declared
 * nothing at all, including `data-table`, `calendar`, `form`, `toast` and every chart, and
 * no check noticed. A silent 46% hole in the field that carries the RSC story is not
 * shippable at 1.0 for a system whose thesis is "the manifest is ground truth".
 *
 * Why a ratchet and not a hard requirement: the `'enhancement'` vs `'required'` split is
 * deliberately author judgment — it turns on whether content is merely hidden or genuinely
 * unreachable with JS off, which no static scan can decide (see the parity guard's header).
 * Filling the backlog by inference would put ~90 unverified claims into `registry.json`,
 * which is worse than an honest gap. So:
 *
 *   - a manifest NOT in the list below must declare `clientJs` — new components are
 *     covered from day one, and a manifest that leaves the list can never rejoin it;
 *   - a manifest IN the list that has since declared `clientJs` fails too, so the list
 *     shrinks as the backlog is worked and cannot rot into a permanent exemption.
 *
 * Working the backlog: read the component, decide `'none'` / `'enhancement'` / `'required'`
 * against the definitions in `client-js-parity.test.ts`, add it to the manifest, delete the
 * line here, and run `pnpm regen`.
 *
 * Run: `pnpm meta:check` (or directly via node --test).
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES = join(REPO_ROOT, 'packages')

const DECLARED = /^\s*clientJs:\s*'(none|enhancement|required)'/m

/**
 * Manifests that do not yet declare `clientJs`, as of 2026-08-14. This list may only get
 * shorter. Do not add to it — declare the field instead.
 */
const UNDECLARED_BACKLOG: string[] = [
  'packages/charts/src/charts/area-chart/area-chart.meta.ts',
  'packages/charts/src/charts/bar-chart/bar-chart.meta.ts',
  'packages/charts/src/charts/boxplot/boxplot.meta.ts',
  'packages/charts/src/charts/bubble-chart/bubble-chart.meta.ts',
  'packages/charts/src/charts/bullet/bullet.meta.ts',
  'packages/charts/src/charts/calendar/calendar.meta.ts',
  'packages/charts/src/charts/candlestick/candlestick.meta.ts',
  'packages/charts/src/charts/combo-chart/combo-chart.meta.ts',
  'packages/charts/src/charts/funnel/funnel.meta.ts',
  'packages/charts/src/charts/gauge/gauge.meta.ts',
  'packages/charts/src/charts/heatmap/heatmap.meta.ts',
  'packages/charts/src/charts/histogram/histogram.meta.ts',
  'packages/charts/src/charts/line-chart/line-chart.meta.ts',
  'packages/charts/src/charts/pie-chart/pie-chart.meta.ts',
  'packages/charts/src/charts/polar/polar.meta.ts',
  'packages/charts/src/charts/radar/radar.meta.ts',
  'packages/charts/src/charts/radial-bar/radial-bar.meta.ts',
  'packages/charts/src/charts/sankey/sankey.meta.ts',
  'packages/charts/src/charts/scatter-chart/scatter-chart.meta.ts',
  'packages/charts/src/charts/stream/stream.meta.ts',
  'packages/charts/src/charts/sunburst/sunburst.meta.ts',
  'packages/charts/src/charts/treemap/treemap.meta.ts',
  'packages/components/src/alert/alert.meta.ts',
  'packages/components/src/app-shell/app-shell.meta.ts',
  'packages/components/src/avatar/avatar.meta.ts',
  'packages/components/src/blocks/app-shell/app-shell.meta.ts',
  'packages/components/src/blocks/auth-login/auth-login.meta.ts',
  'packages/components/src/blocks/auth-signup/auth-signup.meta.ts',
  'packages/components/src/blocks/dashboard-overview/dashboard-overview.meta.ts',
  'packages/components/src/blocks/dashboard-table/dashboard-table.meta.ts',
  'packages/components/src/blocks/marketing-features/marketing-features.meta.ts',
  'packages/components/src/blocks/settings-profile/settings-profile.meta.ts',
  'packages/components/src/button-group/button-group.meta.ts',
  'packages/components/src/calendar/calendar.meta.ts',
  'packages/components/src/carousel/carousel.meta.ts',
  'packages/components/src/checkbox-card/checkbox-card.meta.ts',
  'packages/components/src/code-snippet/code-snippet.meta.ts',
  'packages/components/src/color-picker/color-picker.meta.ts',
  'packages/components/src/comparison/comparison.meta.ts',
  'packages/components/src/contained-list/contained-list.meta.ts',
  'packages/components/src/copy-button/copy-button.meta.ts',
  'packages/components/src/data-table/data-table.meta.ts',
  'packages/components/src/dock/dock.meta.ts',
  'packages/components/src/editable/editable.meta.ts',
  'packages/components/src/file-uploader/file-uploader.meta.ts',
  'packages/components/src/filter/filter.meta.ts',
  'packages/components/src/form/form.meta.ts',
  'packages/components/src/image/image.meta.ts',
  'packages/components/src/log-viewer/log-viewer.meta.ts',
  'packages/components/src/navigation-menu/navigation-menu.meta.ts',
  'packages/components/src/notification/notification.meta.ts',
  'packages/components/src/otp-input/otp-input.meta.ts',
  'packages/components/src/overflow-menu/overflow-menu.meta.ts',
  'packages/components/src/pagination/pagination.meta.ts',
  'packages/components/src/pull-to-refresh/pull-to-refresh.meta.ts',
  'packages/components/src/radio-card/radio-card.meta.ts',
  'packages/components/src/rating-group/rating-group.meta.ts',
  'packages/components/src/relative-time/relative-time.meta.ts',
  'packages/components/src/resizable/resizable.meta.ts',
  'packages/components/src/scroll-area/scroll-area.meta.ts',
  'packages/components/src/segmented-control/segmented-control.meta.ts',
  'packages/components/src/steps/steps.meta.ts',
  'packages/components/src/structured-list/structured-list.meta.ts',
  'packages/components/src/swipe-item/swipe-item.meta.ts',
  'packages/components/src/tabs/tabs.meta.ts',
  'packages/components/src/tag/tag.meta.ts',
  'packages/components/src/tags-input/tags-input.meta.ts',
  'packages/components/src/tile/tile.meta.ts',
  'packages/components/src/time-picker/time-picker.meta.ts',
  'packages/components/src/toast/toast.meta.ts',
  'packages/components/src/toc/toc.meta.ts',
  'packages/components/src/toggle-group/toggle-group.meta.ts',
  'packages/components/src/toggletip/toggletip.meta.ts',
  'packages/components/src/tree-view/tree-view.meta.ts',
  'packages/editor/src/editor/highlight/highlight.meta.ts',
  'packages/flow/src/core/flow-canvas/flow-canvas.meta.ts',
  'packages/flow/src/flows/flow-controls/flow-controls.meta.ts',
  'packages/flow/src/flows/flow-edge/flow-edge.meta.ts',
  'packages/flow/src/flows/flow-minimap/flow-minimap.meta.ts',
  'packages/flow/src/flows/flow-node/flow-node.meta.ts',
  'packages/flow/src/flows/flow-story/flow-story.meta.ts',
  'packages/flow/src/flows/flow/flow.meta.ts',
  'packages/layouts/src/app-shell/app-shell.meta.ts',
  'packages/layouts/src/blocks/console-app/console-app.meta.ts',
  'packages/layouts/src/blocks/empty-dashboard/empty-dashboard.meta.ts',
  'packages/layouts/src/blocks/login-page/login-page.meta.ts',
  'packages/layouts/src/blocks/notification-center/notification-center.meta.ts',
  'packages/layouts/src/blocks/settings-form-page/settings-form-page.meta.ts',
  'packages/layouts/src/blocks/users-table-page/users-table-page.meta.ts',
  'packages/layouts/src/split-view/split-view.meta.ts',
]

/** Recursively collect `*.meta.ts` manifests, skipping build output. */
function collectMetas(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectMetas(full))
    else if (entry.name.endsWith('.meta.ts')) out.push(full)
  }
  return out
}

describe('clientJs coverage', () => {
  const manifests = collectMetas(PACKAGES).map((path) => ({
    path: path.slice(REPO_ROOT.length + 1),
    declared: DECLARED.test(readFileSync(path, 'utf8')),
  }))

  it('finds the full catalog (guards against a silent skip)', () => {
    assert.ok(manifests.length > 200, `expected the whole catalog, got ${manifests.length}`)
  })

  it('every manifest outside the backlog declares clientJs', () => {
    const backlog = new Set(UNDECLARED_BACKLOG)
    const missing = manifests.filter((m) => !m.declared && !backlog.has(m.path)).map((m) => m.path)
    assert.deepEqual(
      missing,
      [],
      'These manifests do not declare `clientJs`, so registry.json cannot tell an adopter ' +
        'or an agent whether the component hydrates. Pick `none` / `enhancement` / ' +
        '`required` per the definitions in client-js-parity.test.ts:\n  ' +
        missing.join('\n  '),
    )
  })

  it('the backlog only shrinks', () => {
    const declaredNow = new Set(manifests.filter((m) => m.declared).map((m) => m.path))
    const known = new Set(manifests.map((m) => m.path))
    const stale = UNDECLARED_BACKLOG.filter((p) => declaredNow.has(p) || !known.has(p))
    assert.deepEqual(
      stale,
      [],
      'These are listed as not-yet-declared but now declare `clientJs` (or no longer exist). ' +
        'Delete them from UNDECLARED_BACKLOG — a list that outlives its entries turns into a ' +
        'permanent exemption:\n  ' +
        stale.join('\n  '),
    )
  })
})
