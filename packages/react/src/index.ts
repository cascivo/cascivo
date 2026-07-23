/**
 * @cascivo/react — every cascivo component, prebuilt.
 *
 * For users who want to consume cascivo as a normal library instead of
 * copy-pasting source via the CLI.
 *
 * Quickstart:
 * ```sh
 * pnpm add @cascivo/react @preact/signals-react
 * ```
 * ```tsx
 * // @cascivo/themes is installed with @cascivo/react. Once, in your entry file:
 * import '@cascivo/themes/all.css'   // tokens + base + light & dark — REQUIRED for color
 * // No-bundler / single-file alternative (themes already bundled in):
 * //   import '@cascivo/react/styles.css'
 * import { Button, Card } from '@cascivo/react'
 * ```
 * Each component ships its own CSS, pulled in automatically on import and
 * tree-shaken per component by the consumer's bundler; the aggregate
 * '@cascivo/react/styles.css' (which also bundles the light & dark themes) is for
 * no-bundler setups. Skip the theme import and components render grayscale —
 * ThemeProvider warns in dev when that happens.
 *
 * The wider family (separate installs):
 * - `@cascivo/charts` — LineChart, AreaChart, BarChart, Sparkline, 25 chart types
 *   (+ its own styles.css).
 * - `@cascivo/icons` — ~440 tree-shakeable SVG icon components for SideNav items,
 *   IconButton, and Button icons.
 * - `@cascivo/themes` — 12 themes; scope any with `data-theme="…"` on any element.
 *
 * Reactivity: components are signal-driven. In an app without the signals Babel
 * transform, any component reading `signal.value` in render must call `useSignals()`
 * (re-exported from `@cascivo/core`) first.
 *
 * Docs: https://cascivo.com/llms.txt — or fully offline, no website needed:
 *   `npx -y @cascivo/docs` (index; `npx @cascivo/docs <component>` for one doc).
 */
export * from '../../components/src/button/button'
export * from '../../components/src/input/input'
export * from '../../components/src/card/card'
export * from '../../components/src/badge/badge'
export * from '../../components/src/modal/modal'
export * from '../../components/src/spinner/spinner'
export * from '../../components/src/separator/separator'
export * from '../../components/src/alert/alert'
export * from '../../components/src/avatar/avatar'
export * from '../../components/src/avatar-group/avatar-group'
export * from '../../components/src/user/user'
export * from '../../components/src/image/image'
export * from '../../components/src/textarea/textarea'
export * from '../../components/src/select/select'
export * from '../../components/src/checkbox/checkbox'
export * from '../../components/src/radio/radio'
export * from '../../components/src/toggle/toggle'
export * from '../../components/src/slider/slider'
export * from '../../components/src/tooltip/tooltip'
export * from '../../components/src/dropdown/dropdown'
export * from '../../components/src/toast/toast'
export * from '../../components/src/tabs/tabs'
export * from '../../components/src/accordion/accordion'
export * from '../../components/src/action-sheet/action-sheet'
export * from '../../components/src/kbd/kbd'
export * from '../../components/src/link/link'
export * from '../../components/src/breadcrumb/breadcrumb'
export * from '../../components/src/toc/toc'
export { useTocFromRegion } from '../../components/src/toc/use-toc-from-region'
export type { UseTocFromRegionOptions } from '../../components/src/toc/use-toc-from-region'
export * from '../../components/src/header/header'
export * from '../../components/src/side-nav/side-nav'
export * from '../../components/src/pagination/pagination'
export * from '../../components/src/progress-indicator/progress-indicator'
export * from '../../components/src/tag/tag'
export * from '../../components/src/skeleton/skeleton'
export * from '../../components/src/progress-bar/progress-bar'
export * from '../../components/src/empty-state/empty-state'
export * from '../../components/src/fab/fab'
export * from '../../components/src/overflow-menu/overflow-menu'
export * from '../../components/src/search/search'
export * from '../../components/src/number-input/number-input'
export * from '../../components/src/data-table/data-table'
export * from '../../components/src/command-menu/command-menu'
export * from '../../components/src/form/form'
export * from '../../components/src/combobox/combobox'
export * from '../../components/src/date-picker/date-picker'
export * from '../../components/src/file-uploader/file-uploader'
export * from '../../components/src/time-picker/time-picker'
export * from '../../components/src/popover/popover'
export { usePopover } from '../../components/src/popover/use-popover'
export type { UsePopoverOptions, UsePopoverReturn } from '../../components/src/popover/use-popover'
export * from '../../components/src/menu/menu'
export * from '../../components/src/alert-dialog/alert-dialog'
export * from '../../components/src/sheet/sheet'
export * from '../../components/src/bottom-sheet/bottom-sheet'
export * from '../../components/src/context-menu/context-menu'
export * from '../../components/src/comparison/comparison'
export * from '../../components/src/hover-card/hover-card'
export { ErrorBoundary, SuspenseBoundary, Portal, FocusScope } from '@cascivo/core'
// Router-link integration: config-driven navs (SideNav, ShellHeader, Breadcrumb, …)
// render links through the component registered here. Re-exported from @cascivo/react
// so prebuilt-package (Path B) users need not add @cascivo/core as a direct dep (it is
// only a transitive dep, so `import … from '@cascivo/core'` is a phantom-dependency
// error under pnpm). Copied-source (Path A) projects can import it from either package.
export {
  setLinkComponent,
  getLinkComponent,
  type LinkComponent,
  type LinkComponentProps,
} from '@cascivo/core'
export * from '../../components/src/password-input/password-input'
export * from '../../components/src/multi-select/multi-select'
export * from '../../components/src/tags-input/tags-input'
export * from '../../components/src/otp-input/otp-input'
export * from '../../components/src/segmented-control/segmented-control'
// input-group also exports a small ButtonGroup helper; the dedicated button-group component (below)
// owns that name in @cascivo/react, so re-export input-group's public surface selectively.
export { InputGroup, InputGroupAddon } from '../../components/src/input-group/input-group'
export type {
  InputGroupProps,
  InputGroupAddonProps,
} from '../../components/src/input-group/input-group'
export * from '../../components/src/rating-group/rating-group'
export * from '../../components/src/editable/editable'
export * from '../../components/src/radio-card/radio-card'
export * from '../../components/src/shell-header/shell-header'
export * from '../../components/src/header-panel/header-panel'
export * from '../../components/src/switcher/switcher'
export * from '../../components/src/checkbox-card/checkbox-card'
export * from '../../components/src/copy-button/copy-button'
export * from '../../components/src/stat/stat'
export * from '../../components/src/status/status'
export * from '../../components/src/visually-hidden/visually-hidden'
export * from '../../components/src/skip-nav/skip-nav'
export * from '../../components/src/progress/progress'
export * from '../../components/src/progress-circle/progress-circle'
export * from '../../components/src/heading/heading'
export * from '../../components/src/text/text'
export * from '../../components/src/code/code'
export * from '../../components/src/blockquote/blockquote'
export * from '../../components/src/list/list'
export * from '../../components/src/log-viewer/log-viewer'
export * from '../../components/src/prose/prose'
export * from '../../components/src/pull-to-refresh/pull-to-refresh'
export * from '../../components/src/qr-code/qr-code'
export * from '../../components/src/relative-time/relative-time'
// v18 Tier-1 parity components
export * from '../../components/src/label/label'
export * from '../../components/src/field/field'
export * from '../../components/src/filter/filter'
export * from '../../components/src/icon-button/icon-button'
export * from '../../components/src/button-group/button-group'
export * from '../../components/src/toggle-group/toggle-group'
export * from '../../components/src/inline-loading/inline-loading'
export * from '../../components/src/notification/notification'
export * from '../../components/src/scroll-area/scroll-area'
export * from '../../components/src/collapsible/collapsible'
export * from '../../components/src/aspect-ratio/aspect-ratio'
// v18 Tier-2 parity components
export * from '../../components/src/menu-button/menu-button'
export * from '../../components/src/toggletip/toggletip'
export * from '../../components/src/menubar/menubar'
export * from '../../components/src/navigation-menu/navigation-menu'
export * from '../../components/src/tree-view/tree-view'
export * from '../../components/src/structured-list/structured-list'
export * from '../../components/src/contained-list/contained-list'
export * from '../../components/src/data-list/data-list'
export * from '../../components/src/timeline/timeline'
export * from '../../components/src/item/item'
export * from '../../components/src/calendar/calendar'
export * from '../../components/src/date-range-picker/date-range-picker'
export * from '../../components/src/color-picker/color-picker'
export * from '../../components/src/carousel/carousel'
export * from '../../components/src/resizable/resizable'
export * from '../../components/src/dock/dock'
export * from '../../components/src/drawer/drawer'
export * from '../../components/src/native-select/native-select'
export * from '../../components/src/code-snippet/code-snippet'
export * from '../../components/src/steps/steps'
export * from '../../components/src/tile/tile'
// v31 T4 layout primitives
export * from '../../components/src/indicator/indicator'
export * from '../../components/src/join/join'
export * from '../../components/src/stack/stack'
// v37 T5 — app shell layout (sticky header + full-height nav + single scroll container)
export * from '../../components/src/app-shell/app-shell'
// v31 T5 interaction patterns
export * from '../../components/src/chat-bubble/chat-bubble'
export * from '../../components/src/radial-progress/radial-progress'
export * from '../../components/src/swap/swap'
export * from '../../components/src/swipe-item/swipe-item'
// layout primitives from @cascivo/layouts (see docs/plans/layout-state-audit-vendor-plan.md).
// These import only @cascivo/core, so exporting them here creates no dependency cycle.
export * from '../../layouts/src/grid/grid' // Grid, GridItem, Responsive<T>
export * from '../../layouts/src/flex/flex' // Flex (gap-based flex container)
export * from '../../layouts/src/columns/columns' // Columns
export * from '../../layouts/src/center/center' // Center
export * from '../../layouts/src/spacer/spacer' // Spacer
export * from '../../layouts/src/auto-grid/auto-grid' // AutoGrid
// The spacing-scale type shared by every layout primitive's `gap`/spacing props
// lives in @cascivo/core (a direct dependency of this package). Importing it there
// — `import type { SpaceStep } from '@cascivo/core'` — keeps it a single external
// binding, so the layout Props reference a clean `SpaceStep` in the published
// types (never the dts bundler's deduped `SpaceStep$N`) and `gap={7}` errors name
// it plainly. Not re-exported here: a separate re-export makes the bundler mint a
// second `SpaceStep$1` binding for the same external type.
// Reusable, SSR-safe theme runtime (ThemeProvider / useTheme / setTheme /
// themePreloadScript / themeSignal). Packages the data-theme wiring apps
// otherwise hand-roll.
export {
  ThemeProvider,
  useTheme,
  themeSignal,
  setTheme,
  themePreloadScript,
  type ThemeProviderProps,
} from './theme'
