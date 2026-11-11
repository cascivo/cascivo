// cascivo-html chart conformance: the committed Rust output (crates/cascivo-html/tests/charts/*.snap,
// byte-checked by the Rust snapshot test) must match React `renderToStaticMarkup` of the real chart
// components. Compared on the <svg> subtree: element structure, attributes and classes equal,
// numbers within 0.01. Hand-rolled chrome that has no static equivalent (the root's width/height
// sizing attributes, <title>/<desc>) is ignored.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AreaChart } from '../../../packages/charts/src/charts/area-chart/area-chart.tsx'
import { BarChart } from '../../../packages/charts/src/charts/bar-chart/bar-chart.tsx'
import { Gauge } from '../../../packages/charts/src/charts/gauge/gauge.tsx'
import { LineChart } from '../../../packages/charts/src/charts/line-chart/line-chart.tsx'
import { PieChart } from '../../../packages/charts/src/charts/pie-chart/pie-chart.tsx'
import { ScatterChart } from '../../../packages/charts/src/charts/scatter-chart/scatter-chart.tsx'
import { Sparkline } from '../../../packages/charts/src/charts/sparkline/sparkline.tsx'

// The workspace root has no React; load the copy the chart components themselves resolve.
const req = createRequire(resolve(import.meta.dirname, '../../../packages/charts/package.json'))
const { createElement: h } = req('react') as typeof import('react')
const { renderToStaticMarkup } = req('react-dom/server') as typeof import('react-dom/server')

const RUST = resolve(import.meta.dirname, '../../../crates/cascivo-html/tests/charts')
const TOL = 0.01

interface El {
  tag: string
  attrs: [string, string][]
  kids: (El | string)[]
}

function parse(html: string): El {
  const root: El = { tag: '#root', attrs: [], kids: [] }
  const stack = [root]
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const top = stack[stack.length - 1]!
    if (m[5] !== undefined) {
      if (m[5].trim()) top.kids.push(m[5])
      continue
    }
    if (m[1]) {
      stack.pop()
      continue
    }
    const attrs: [string, string][] = [...(m[3] ?? '').matchAll(/([\w:-]+)(?:="([^"]*)")?/g)]
      .map((a) => [a[1]!, a[2] ?? ''] as [string, string])
      .sort((a, b) => a[0].localeCompare(b[0]))
    const el: El = { tag: m[2]!, attrs, kids: [] }
    top.kids.push(el)
    if (!m[4]) stack.push(el)
  }
  return root.kids[0] as El
}

/** Ids come from per-document counters on the Rust side and `useId` in React. */
const normId = (v: string) => v.replace(/_R_[a-z0-9]+_|cv-\d+/g, 'ID')

function clean(el: El, isRoot = false): El {
  return {
    tag: el.tag,
    attrs: el.attrs
      .filter(([k]) => !(isRoot && ['width', 'height', 'preserveAspectRatio', 'style'].includes(k)))
      .map(([k, v]) => [k, normId(v)] as [string, string]),
    kids: el.kids
      .filter((k) => typeof k === 'string' || !['title', 'desc'].includes(k.tag))
      .map((k) => (typeof k === 'string' ? k : clean(k))),
  }
}

function sameValue(a: string, b: string): boolean {
  const num = /-?\d+(?:\.\d+)?/g
  const [pa, pb] = [a.split(num), b.split(num)]
  if (pa.join('\0') !== pb.join('\0')) return false
  const [na, nb] = [a.match(num) ?? [], b.match(num) ?? []]
  return na.length === nb.length && na.every((x, i) => Math.abs(Number(x) - Number(nb[i])) <= TOL)
}

function diff(a: El | string, b: El | string, path: string): string | null {
  if (typeof a === 'string' || typeof b === 'string') {
    return a === b ? null : `${path}: text ${JSON.stringify(a)} != ${JSON.stringify(b)}`
  }
  if (a.tag !== b.tag) return `${path}: <${a.tag}> != <${b.tag}>`
  const keys = (e: El) => e.attrs.map(([k]) => k).join(',')
  if (keys(a) !== keys(b)) return `${path}/${a.tag}: attrs [${keys(a)}] != [${keys(b)}]`
  for (const [i, [k, v]] of a.attrs.entries()) {
    if (!sameValue(v, b.attrs[i]![1])) return `${path}/${a.tag}@${k}: ${v} != ${b.attrs[i]![1]}`
  }
  if (a.kids.length !== b.kids.length) {
    return `${path}/${a.tag}: ${a.kids.length} children != ${b.kids.length}`
  }
  for (const [i, k] of a.kids.entries()) {
    const d = diff(k, b.kids[i]!, `${path}/${a.tag}[${i}]`)
    if (d) return d
  }
  return null
}

const svgOf = (html: string): El => {
  const m = /<svg[\s\S]*<\/svg>/.exec(html)
  if (!m) throw new Error(`no <svg> in ${html.slice(0, 200)}`)
  return clean(parse(m[0]), true)
}

const cat = [
  { x: 'Q1', y: 12 },
  { x: 'Q2', y: 18 },
  { x: 'Q3', y: 9 },
]
const nums = [3, 5, 8, 13].map((y, x) => ({ x, y }))
const x = (d: { x: number | string }) => d.x as never
const y = (d: { y: number }) => d.y

// `any` only because the chart props are generic over the datum; the data here is plain.
const CASES: Record<string, unknown> = {
  bar: h(BarChart as never, {
    series: [{ id: 's1', label: 'Series', data: cat }],
    x,
    y,
    title: 'Revenue',
    width: 400,
    height: 300,
  }),
  line: h(LineChart as never, {
    series: [{ id: 's1', label: 'Series', data: nums }],
    x,
    y,
    title: 'Growth',
    width: 400,
    height: 300,
  }),
  area: h(AreaChart as never, {
    series: [{ id: 's1', label: 'Series', data: nums }],
    x,
    y,
    title: 'Growth',
    width: 400,
    height: 300,
  }),
  pie: h(PieChart, {
    data: [
      { id: '1', label: 'A', value: 40 },
      { id: '2', label: 'B', value: 35 },
      { id: '3', label: 'C', value: 25 },
    ],
    title: 'Share',
    size: 200,
    labels: true,
  }),
  donut: h(PieChart, {
    data: [
      { id: '1', label: 'A', value: 40 },
      { id: '2', label: 'B', value: 35 },
      { id: '3', label: 'C', value: 25 },
    ],
    title: 'Share',
    size: 200,
    donut: true,
    centerValue: '100',
    centerLabel: 'Total',
  }),
  scatter: h(ScatterChart as never, {
    series: [
      {
        id: 's1',
        label: 'Series',
        data: [
          { x: 1, y: 2 },
          { x: 3, y: 5 },
          { x: 4, y: 3 },
        ],
      },
    ],
    title: 'Points',
    width: 400,
    height: 300,
  }),
  spark: h(Sparkline, { data: [3, 5, 8, 13], label: 'Trend' }),
  gauge: h(Gauge, { title: 'CPU', value: 57, unit: '%', width: 240, height: 240 }),
}

describe('cascivo-html charts match React SSR', () => {
  for (const [name, el] of Object.entries(CASES)) {
    it(name, () => {
      const react = svgOf(renderToStaticMarkup(el as never))
      const rust = svgOf(readFileSync(resolve(RUST, `${name}.snap`), 'utf8'))
      expect(diff(rust, react, '')).toBeNull()
    })
  }
})
