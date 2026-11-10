import { CV_SPEC } from '../../../../scripts/html-kit/cv-spec.ts'

// Longest unit name first so `cv-data-table-x` strips `data-table`, not `data`.
const UNITS = [...new Set(CV_SPEC.flatMap((e) => e.css))].sort((a, b) => b.length - a.length)

const ID = /cv-\d+|:r[\w]*:|_[Rr]_[\w]*_|«[\w]*»/g

function stripClass(c: string): string {
  for (const u of UNITS) if (c.startsWith(`cv-${u}-`)) return c.slice(u.length + 4)
  return c
}

function normStyle(s: string): string {
  return s
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => d.replace(/\s*:\s*/, ':').replace(/\s+/g, ' '))
    .join(';')
}

function normTag(tag: string, strip: boolean): string {
  const m = /^<\s*([\w-]+)((?:\s[^>]*?)?)(\/?)>$/s.exec(tag)
  if (!m) return tag
  const attrs: string[] = []
  const re = /([^\s=/"'>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  let a: RegExpExecArray | null
  while ((a = re.exec(m[2] ?? ''))) {
    const name = a[1] as string
    let val = a[2] ?? a[3] ?? a[4]
    if (val === undefined || val === '') {
      attrs.push(name)
      continue
    }
    if (name === 'class') {
      val = val
        .split(/\s+/)
        .map((c) => (strip ? stripClass(c) : c))
        .sort()
        .join(' ')
    } else if (name === 'style') val = normStyle(val)
    attrs.push(`${name}="${val}"`)
  }
  attrs.sort()
  return `<${m[1]}${attrs.length ? ' ' : ''}${attrs.join(' ')}>`
}

/** Same DOM, comparable string: attrs sorted, classes unprefixed, ids by first appearance. */
export function normalize(html: string, opts: { rust: boolean }): string {
  // React 19 hoists a preload <link> before any <img src>; Rust emits none (no head to hoist to).
  let s = html.replace(/<!--.*?-->/gs, '').replace(/<link rel="preload"[^>]*>/g, '')
  s = s.replace(/<[^>]+>/g, (t) => (t.startsWith('</') ? t.replace(/\s+/g, '') : normTag(t, opts.rust)))
  s = s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
  const seen = new Map<string, number>()
  return s.replace(ID, (id) => {
    if (!seen.has(id)) seen.set(id, seen.size + 1)
    return `#id${seen.get(id)}`
  })
}
