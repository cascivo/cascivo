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

// Static pages announce nothing on load: `note` by default, a live region only on request.
const liveRole: ExtraProp = {
  name: 'role',
  type: 'enum',
  values: ['note', 'status', 'alert'],
  summary: 'ARIA role (default note); status or alert make it a live region',
}

// Charts draw inline SVG; only the legend chrome has CSS.
const chart = 'chart-legend'

// Form controls submit with a form: the DOM attributes the React manifests leave to `...props`.
const controlProps = (unit: 'input' | 'textarea' | 'select' | 'checkbox'): ExtraProp[] => [
  { name: 'name', type: 'string', summary: 'Field name sent with the form' },
  { name: 'required', type: 'boolean', summary: 'The browser blocks submit while it is empty' },
  ...(unit === 'input'
    ? ([
        {
          name: 'type',
          type: 'enum',
          values: ['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date'],
          summary: 'Native input type (default text)',
        },
      ] as ExtraProp[])
    : []),
  ...(unit === 'checkbox'
    ? ([
        { name: 'value', type: 'string', summary: 'Value sent when checked (default on)' },
      ] as ExtraProp[])
    : []),
]

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
  // layout primitives (contract E1)
  e('join', { children: 'nodes' }),
  e('button-group', { children: 'nodes' }),
  e('shimmer-text', { children: 'text' }),
  e('visually-hidden', { children: 'text' }),
  e('chat-bubble', { children: 'nodes' }),
  e('stack', { children: 'nodes' }),
  e('aspect-ratio', { children: 'nodes' }),
  e('skip-nav', { children: 'text' }),
  e('typing-indicator'),
  e('ai-disclaimer', { children: 'text' }),
  e('scroll-area', { children: 'nodes' }),
  e('app-shell', { children: 'nodes' }),
  e('large-title-header', { children: 'nodes', args: [a('title', 'str', true)] }),
  e('header', { args: [a('links', 'rows')] }),
  e('dock', { args: [a('items', 'rows', true)] }),
  e('toc', { args: [a('items', 'rows', true)] }),
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
  // display units (contract E1, batch b)
  e('label', {
    children: 'text',
    extraProps: [
      { name: 'htmlFor', type: 'string', summary: 'Id of the form control this label names' },
    ],
  }),
  e('status', { children: 'text' }),
  e('user', { args: [a('name', 'str', true)], css: ['user', 'avatar'] }),
  e('item', { children: 'nodes' }),
  e('button', {
    children: 'text',
    // React reaches a link-styled button through `asChild`; in `.cv` it is one prop.
    extraProps: [
      { name: 'href', type: 'string', summary: 'Render a link (<a href>) styled as a button' },
    ],
  }),
  // feedback
  e('alert', { children: 'text', args: [a('title', 'str')], extraProps: [liveRole] }),
  e('notification', { children: 'text', args: [a('title', 'str')], extraProps: [liveRole] }),
  e('progress-bar', { args: [a('value', 'num', true)] }),
  e('progress-circle', { args: [a('value', 'num', true)] }),
  e('meter', { args: [a('value', 'num', true)] }),
  e('skeleton'),
  e('spinner'),
  e('inline-loading', { css: ['inline-loading', 'spinner'] }),
  e('progress', { args: [a('value', 'num')] }),
  e('progress-indicator', { args: [a('steps', 'rows', true)] }),
  e('radial-progress', { children: 'text', args: [a('value', 'num', true)] }),
  e('context-meter', { args: [a('value', 'num', true), a('max', 'num', true)] }),
  e('icon-button', { children: 'text' }),
  e('switcher', { args: [a('items', 'rows', true)] }),
  // navigation / disclosure
  e('breadcrumb', { args: [a('items', 'rows', true)] }),
  e('steps', { args: [a('items', 'rows', true)] }),
  e('accordion', { children: 'nodes' }),
  e('collapsible', { children: 'nodes', args: [a('title', 'str', true)] }),
  e('tabs', { children: 'nodes' }),
  // overlays: a server-rendered `<cv-dialog>` / `<cv-toaster>`; the shipped script drives them
  e('dialog', {
    children: 'nodes',
    args: [a('title', 'str', true)],
    css: ['modal'],
    synthetic: 'Modal dialog',
    extraProps: [
      {
        name: 'id',
        type: 'string',
        summary: 'Element id a dialog-trigger targets (default generated)',
      },
      { name: 'open', type: 'boolean', summary: 'Start open (modal once the script runs)' },
      {
        name: 'size',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        summary: 'Panel width (default md)',
      },
      { name: 'description', type: 'string', summary: 'Supporting text under the title' },
    ],
  }),
  e('dialog-trigger', {
    children: 'text',
    args: [a('target', 'str', true)],
    css: ['button'],
    synthetic: 'Opens a dialog',
    extraProps: [
      {
        name: 'variant',
        type: 'enum',
        values: ['primary', 'secondary', 'ghost', 'destructive'],
        summary: 'Button style (default primary)',
      },
    ],
  }),
  e('toaster', {
    children: 'nodes',
    css: ['toast'],
    synthetic: 'Toast region',
  }),
  e('toast', {
    children: 'text',
    css: ['toast'],
    synthetic: 'Notification',
    extraProps: [
      {
        name: 'kind',
        type: 'enum',
        values: ['info', 'success', 'warning', 'danger'],
        summary: 'Tone (default info; danger is announced as an alert)',
      },
      {
        name: 'title',
        type: 'string',
        summary: 'Bold first line; the text becomes its description',
      },
    ],
  }),
  // data
  e('data-table', {
    cv: 'table',
    args: [a('rows', 'rows', true)],
    // React's `sort` is a SortState object; in `.cv` it is the switch that adds click-to-sort.
    extraProps: [
      { name: 'sort', type: 'boolean', summary: 'Click a header to sort (inlines a tiny script)' },
    ],
  }),
  // forms (native controls; the contract is the markup, behaviour stays the browser's)
  e('field', {
    children: 'nodes',
    args: [a('label', 'str')],
    css: ['field', 'label'],
  }),
  e('input', { args: [a('label', 'str')], extraProps: controlProps('input') }),
  e('textarea', { args: [a('label', 'str')], extraProps: controlProps('textarea') }),
  e('select', {
    args: [a('options', 'rows', true)],
    extraProps: controlProps('select'),
  }),
  e('checkbox', { args: [a('label', 'str')], extraProps: controlProps('checkbox') }),
  // AI disclosure: handlers (revert, stop, select) and the toggletip need JS, so `.cv` renders
  // only the static, server-rendered state.
  e('ai-badge', { css: ['ai-badge', 'visually-hidden'] }),
  e('ai-status', {
    args: [a('status', 'str', true), a('label', 'str')],
    css: ['ai-status', 'shimmer-text'],
  }),
  e('chain-of-thought', {
    args: [a('items', 'rows', true)],
    css: ['chain-of-thought', 'shimmer-text', 'visually-hidden'],
  }),
  e('reasoning', { children: 'nodes', css: ['reasoning', 'shimmer-text'] }),
  e('sources', { args: [a('items', 'rows', true)] }),
  e('tool-call', {
    args: [a('name', 'str', true), a('status', 'str', true)],
    css: ['tool-call', 'badge'],
    extraProps: [
      { name: 'actions', type: 'string', summary: 'Text shown in the actions row under the call' },
    ],
  }),
  e('prompt-suggestions', { args: [a('items', 'rows', true)] }),
  // pickers
  e('checkbox-card', {
    args: [a('title', 'str', true)],
    extraProps: [
      { name: 'name', type: 'string', summary: 'Field name sent with the form' },
      { name: 'value', type: 'string', summary: 'Value sent when checked (default on)' },
      {
        name: 'required',
        type: 'boolean',
        summary: 'The browser blocks submit until it is checked',
      },
    ],
  }),
  e('radio', {
    args: [a('label', 'str')],
    extraProps: [
      { name: 'checked', type: 'boolean', summary: 'Initially selected' },
      {
        name: 'required',
        type: 'boolean',
        summary: 'The browser blocks submit until one is picked',
      },
    ],
  }),
  // One cv element is the whole group: rows are `value | title | description`.
  e('radio-card', {
    args: [a('items', 'rows', true)],
    extraProps: [
      { name: 'name', type: 'string', summary: 'Field name shared by every card' },
      { name: 'label', type: 'string', summary: 'Accessible name of the group' },
      { name: 'value', type: 'string', summary: 'Value of the initially selected card' },
      { name: 'hideIndicator', type: 'boolean', summary: 'Hide the radio dot on every card' },
    ],
  }),
  e('rating-group', { args: [a('value', 'num', true)] }),
  e('slider', {
    args: [a('label', 'str')],
    extraProps: [{ name: 'name', type: 'string', summary: 'Field name sent with the form' }],
  }),
  e('native-select', {
    args: [a('options', 'rows', true)],
    extraProps: [
      { name: 'name', type: 'string', summary: 'Field name sent with the form' },
      {
        name: 'required',
        type: 'boolean',
        summary: 'The browser blocks submit while none is picked',
      },
    ],
  }),
  e('number-input', { args: [a('label', 'str')] }),
  e('password-input', {
    extraProps: [
      { name: 'name', type: 'string', summary: 'Field name sent with the form' },
      { name: 'required', type: 'boolean', summary: 'The browser blocks submit while it is empty' },
    ],
  }),
  e('search', {}),
  e('contained-list', {
    children: 'nodes',
    args: [a('label', 'str', true)],
    extraProps: [
      { name: 'action', type: 'string', summary: 'Text shown in the header action slot' },
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
