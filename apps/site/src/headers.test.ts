import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ROUTE_HEAD } from './marketing/route-head'

const HEADERS = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')

/** `_headers` rules as Cloudflare Pages reads them: an unindented path, then indented headers. */
function parseRules(text: string): { path: string; headers: string[] }[] {
  const rules: { path: string; headers: string[] }[] = []
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    if (/^\s/.test(line)) rules.at(-1)?.headers.push(line.trim().toLowerCase())
    else rules.push({ path: line.trim(), headers: [] })
  }
  return rules
}

/** Pages matching: `*` is a greedy splat (it may be empty), `:name` one path segment. */
function matches(pattern: string, path: string): boolean {
  const source = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:[A-Za-z]\w*/g, '[^/]+'))
    .join('.*')
  return new RegExp(`^${source}$`).test(path)
}

describe('public/_headers', () => {
  // /fonts/* (the font files, cached a day) also matched the /fonts page itself (dist/fonts/
  // index.html, served at /fonts/): its HTML stayed cached a day while each deploy deleted the
  // hashed chunks it named, so landing -> Fonts loaded a blank page until the cache expired.
  it('never gives an HTML route a Cache-Control rule', () => {
    const rules = parseRules(HEADERS).filter((r) =>
      r.headers.some((h) => h.startsWith('cache-control:')),
    )
    const routes = Object.keys(ROUTE_HEAD).filter((r) => r !== '/')
    expect(routes).toContain('/fonts')
    const hits = routes.flatMap((route) =>
      [route, `${route}/`].flatMap((path) =>
        rules.filter((r) => matches(r.path, path)).map((r) => `${path} <- ${r.path}`),
      ),
    )
    expect(hits).toEqual([])
  })

  it('still caches the files in every public/fonts directory', () => {
    const dirs = readdirSync(new URL('../public/fonts', import.meta.url), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    expect(dirs).toContain('cascivo-sans')
    const cached = (path: string) =>
      parseRules(HEADERS).some(
        (r) => matches(r.path, path) && r.headers.some((h) => h.startsWith('cache-control:')),
      )
    expect(dirs.filter((dir) => !cached(`/fonts/${dir}/x.woff2`))).toEqual([])
  })
})
