import { ROUTE_HEAD, canonicalFor } from './route-head'

/** Update or create a meta/link tag, matching it by `selector`. */
function setMeta(
  selector: string,
  spec: { tag: 'meta' | 'link'; attrName: 'name' | 'property' | 'rel'; key: string },
  attr: 'content' | 'href',
  value: string,
): void {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(spec.tag)
    el.setAttribute(spec.attrName, spec.key)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function setRobots(content: string): void {
  setMeta(
    'meta[name="robots"]',
    { tag: 'meta', attrName: 'name', key: 'robots' },
    'content',
    content,
  )
}

/** Apply the per-route head (title + description + canonical + og + twitter). */
export function applyRouteSeo(path: string, title: string): void {
  if (typeof document === 'undefined') return
  const head = ROUTE_HEAD[path]
  const description = head?.description ?? ROUTE_HEAD['/']?.description ?? ''
  const ogTitle = head?.ogTitle ?? title
  const canonical = canonicalFor(path)

  document.title = title
  setRobots('index, follow')
  setMeta(
    'meta[name="description"]',
    { tag: 'meta', attrName: 'name', key: 'description' },
    'content',
    description,
  )
  setMeta(
    'link[rel="canonical"]',
    { tag: 'link', attrName: 'rel', key: 'canonical' },
    'href',
    canonical,
  )
  setMeta(
    'meta[property="og:title"]',
    { tag: 'meta', attrName: 'property', key: 'og:title' },
    'content',
    ogTitle,
  )
  setMeta(
    'meta[property="og:description"]',
    { tag: 'meta', attrName: 'property', key: 'og:description' },
    'content',
    description,
  )
  setMeta(
    'meta[property="og:url"]',
    { tag: 'meta', attrName: 'property', key: 'og:url' },
    'content',
    canonical,
  )
  setMeta(
    'meta[name="twitter:title"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:title' },
    'content',
    ogTitle,
  )
  setMeta(
    'meta[name="twitter:description"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:description' },
    'content',
    description,
  )
}

/** Apply the NotFound head: home-ish title but noindex (T3). */
export function applyNotFoundSeo(): void {
  if (typeof document === 'undefined') return
  document.title = 'Not found — cascivo'
  setRobots('noindex, follow')
}
