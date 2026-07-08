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

/**
 * Apply a fully-resolved head (title + description + canonical + og +
 * twitter). Shared by `applyRouteSeo` (hand-authored ROUTE_HEAD lookup) and
 * `applyAccessibilityGuideSeo` (registry-derived, no ROUTE_HEAD entry).
 */
function applyHead(canonical: string, title: string, description: string, ogTitle: string): void {
  if (typeof document === 'undefined') return
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

function applyOgImage(ogImage?: string): void {
  // Falls back to the default so navigating away from a custom-card route
  // restores the shared image rather than leaving it stale.
  const abs = `https://cascivo.com${ogImage ?? '/og.png'}`
  setMeta(
    'meta[property="og:image"]',
    { tag: 'meta', attrName: 'property', key: 'og:image' },
    'content',
    abs,
  )
  setMeta(
    'meta[name="twitter:image"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:image' },
    'content',
    abs,
  )
}

/** Apply the per-route head (title + description + canonical + og + twitter). */
export function applyRouteSeo(path: string, title: string): void {
  if (typeof document === 'undefined') return
  const head = ROUTE_HEAD[path]
  const description = head?.description ?? ROUTE_HEAD['/']?.description ?? ''
  const ogTitle = head?.ogTitle ?? title
  const canonical = canonicalFor(path)

  applyHead(canonical, title, description, ogTitle)
  applyOgImage(head?.ogImage)
}

/**
 * Apply the head for a `/accessibility/<name>` guide page — title/description
 * are derived from the registry, not hand-authored, so there's no ROUTE_HEAD
 * entry to look up (125 of them would bloat that file for no benefit).
 */
export function applyAccessibilityGuideSeo(path: string, title: string, description: string): void {
  if (typeof document === 'undefined') return
  applyHead(canonicalFor(path), title, description, title)
  applyOgImage(undefined)
}

/**
 * Apply the head for a `/blog/<slug>` post or the `/blog` index — title/
 * description come from the post data itself, not ROUTE_HEAD.
 */
export function applyBlogSeo(path: string, title: string, description: string): void {
  if (typeof document === 'undefined') return
  applyHead(canonicalFor(path), title, description, title)
  applyOgImage(undefined)
}

/** Apply the NotFound head: home-ish title but noindex (T3). */
export function applyNotFoundSeo(): void {
  if (typeof document === 'undefined') return
  document.title = 'Not found — cascivo'
  setRobots('noindex, follow')
}
