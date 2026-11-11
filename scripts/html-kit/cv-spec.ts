/**
 * The cascivo-html v1 component set: cv names, aliases, positional args and CSS units.
 * Source of truth for build-css.ts, gen-rust.ts and (via generated Rust) the `.cv` parser.
 */
export type ArgKind = 'str' | 'num' | 'pairs' | 'nums' | 'rows'
export type CvEntry = {
  /** registry / directory name, e.g. `data-table` */
  component: string
  /** name written in `.cv`, e.g. `table` */
  cv: string
  aliases: string[]
  args: { name: string; kind: ArgKind; required: boolean }[]
  children: 'none' | 'text' | 'nodes'
  /** CSS units inlined when this component is used (its own plus those its markup renders). */
  css: string[]
  /** `.cv`-only props the React manifest cannot express (its type is not a literal union). */
  extraProps?: ExtraProp[]
  /** No React component behind it: the summary lives here and there is no manifest to load. */
  synthetic?: string
}
export type ExtraProp =
  | { name: string; type: 'boolean' | 'string'; summary: string }
  | { name: string; type: 'enum'; values: string[]; summary: string }

const a = (name: string, kind: ArgKind, required = false) => ({ name, kind, required })

const e = (component: string, o: Partial<Omit<CvEntry, 'component'>> = {}): CvEntry => ({
  component,
  cv: o.cv ?? component,
  aliases: o.aliases ?? [],
  args: o.args ?? [],
  children: o.children ?? 'none',
  css: o.css ?? [component],
  ...(o.extraProps ? { extraProps: o.extraProps } : {}),
  ...(o.synthetic ? { synthetic: o.synthetic } : {}),
})

// Shared by `image` and `svg`: embedded assets are sized and fitted the same way.
const assetProps: ExtraProp[] = [
  { name: 'w', type: 'string', summary: 'Width: px number or CSS length' },
  { name: 'h', type: 'string', summary: 'Height: px number or CSS length' },
  { name: 'fit', type: 'enum', values: ['contain', 'cover'], summary: 'How the picture fills w/h' },
]

// Charts draw inline SVG; only the legend chrome has CSS.
const chart = 'chart-legend'

export const CV_SPEC: readonly CvEntry[] = [
  // layout
  e('flex', { children: 'nodes', aliases: ['row', 'col'] }),
  e('grid', { children: 'nodes', args: [a('columns', 'num')] }),
  e('columns', { children: 'nodes', aliases: ['cols'], args: [a('count', 'num')] }),
  e('auto-grid', { children: 'nodes' }),
  e('center', { children: 'nodes' }),
  e('section', { children: 'nodes', args: [a('title', 'str')] }),
  e('page-header', { children: 'nodes', args: [a('title', 'str', true), a('description', 'str')] }),
  e('dashboard-layout', { children: 'nodes' }),
  e('separator'),
  e('spacer'),
  // display
  e('heading', { children: 'text', aliases: ['h1', 'h2', 'h3'] }),
  e('text', { children: 'text', aliases: ['p'] }),
  e('prose', { children: 'nodes' }),
  e('card', { children: 'nodes', args: [a('title', 'str')] }),
  e('stat', { args: [a('label', 'str', true), a('value', 'str', true), a('delta', 'str')] }),
  e('kpi', {
    args: [a('label', 'str', true), a('value', 'str', true), a('delta', 'str')],
    css: ['kpi'],
  }),
  e('badge', { children: 'text' }),
  e('tag', { children: 'text' }),
  e('avatar', { args: [a('name', 'str')] }),
  e('avatar-group', { children: 'nodes', css: ['avatar-group', 'avatar'] }),
  e('image', { args: [a('src', 'str', true), a('alt', 'str')], extraProps: assetProps }),
  e('svg', {
    args: [a('src', 'str', true), a('alt', 'str')],
    css: [],
    extraProps: assetProps,
    synthetic: 'Inline SVG from a file, URL or markup, sanitized; currentColor follows the theme',
  }),
  e('list', { children: 'nodes' }),
  e('data-list', { args: [a('rows', 'rows', true)] }),
  e('structured-list', { args: [a('rows', 'rows', true)] }),
  e('timeline', { args: [a('rows', 'rows', true)] }),
  e('empty-state', { args: [a('title', 'str', true), a('description', 'str')] }),
  e('blockquote', { children: 'text' }),
  e('code', { children: 'text' }),
  e('kbd', { children: 'text' }),
  e('link', { children: 'text', args: [a('href', 'str', true)] }),
  e('button', { children: 'text' }),
  // feedback
  e('alert', { children: 'text', args: [a('title', 'str')] }),
  e('notification', { children: 'text', args: [a('title', 'str')] }),
  e('progress-bar', { args: [a('value', 'num', true)] }),
  e('progress-circle', { args: [a('value', 'num', true)] }),
  e('meter', { args: [a('value', 'num', true)] }),
  e('skeleton'),
  e('spinner'),
  // navigation / disclosure
  e('breadcrumb', { args: [a('items', 'rows', true)] }),
  e('steps', { args: [a('items', 'rows', true)] }),
  e('accordion', { children: 'nodes' }),
  e('collapsible', { children: 'nodes', args: [a('title', 'str', true)] }),
  e('tabs', { children: 'nodes' }),
  // data
  e('data-table', {
    cv: 'table',
    args: [a('rows', 'rows', true)],
    // React's `sort` is a SortState object; in `.cv` it is the switch that adds click-to-sort.
    extraProps: [
      { name: 'sort', type: 'boolean', summary: 'Click a header to sort (inlines a tiny script)' },
    ],
  }),
  // charts
  e('bar-chart', { cv: 'bar', args: [a('data', 'pairs', true)], css: [chart] }),
  e('line-chart', { cv: 'line', args: [a('data', 'nums', true)], css: [chart] }),
  e('area-chart', { cv: 'area', args: [a('data', 'nums', true)], css: [chart] }),
  e('pie-chart', { cv: 'pie', args: [a('data', 'pairs', true)], css: [chart] }),
  e('scatter-chart', { cv: 'scatter', args: [a('data', 'pairs', true)], css: [chart] }),
  e('sparkline', { cv: 'spark', args: [a('data', 'nums', true)], css: [] }),
  e('gauge', { args: [a('value', 'num', true)], css: [] }),
]

const root = new URL('../../packages/', import.meta.url)

/** Source directories (relative to `packages/`) that may hold a unit's files. */
export function unitDirs(unit: string): string[] {
  if (unit === 'chart-legend') return ['charts/src/chrome']
  return [`components/src/${unit}`, `layouts/src/${unit}`, `charts/src/charts/${unit}`]
}

export const packagesRoot = root
