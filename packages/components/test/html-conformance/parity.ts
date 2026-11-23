import { normalize } from './normalize.ts'

export type Facet = 'tree' | 'role' | 'aria' | 'data' | 'class' | 'attr'

/** Component under parity, keyed by the `.cv` name prefix of each case. */
export const PARITY_COMPONENTS = [
  'accordion',
  'alert',
  'avatar',
  'avatar-group',
  'badge',
  'blockquote',
  'breadcrumb',
  'button',
  'card',
  'code',
  'collapsible',
  'data-list',
  'empty-state',
  'heading',
  'image',
  'kbd',
  'label',
  'link',
  'list',
  'notification',
  'progress-bar',
  'progress-circle',
  'prose',
  'separator',
  'skeleton',
  'spinner',
  'stat',
  'status',
  'steps',
  'structured-list',
  'tabs',
  'join',
  'button-group',
  'visually-hidden',
  'chat-bubble',
  'shimmer-text',
  'stack',
  'aspect-ratio',
  'skip-nav',
  'typing-indicator',
  'ai-disclaimer',
  'header',
  'large-title-header',
  'app-shell',
  'dock',
  'scroll-area',
  'toc',
  'tag',
  'text',
  'timeline',
  'user',
  'item',
  'inline-loading',
  'icon-button',
  'context-meter',
  'progress',
  'progress-indicator',
  'radial-progress',
  'switcher',
  'field',
  'input',
  'select',
  'checkbox',
  'textarea',
  'checkbox-card',
  'radio',
  'radio-card',
  'rating-group',
  'slider',
  'native-select',
  'number-input',
  'password-input',
  'search',
  'contained-list',
  'ai-badge',
  'ai-status',
  'chain-of-thought',
  'reasoning',
  'sources',
  'tool-call',
  'prompt-suggestions',
] as const

export type Fact = { facet: Facet; text: string }

/** Flatten normalised HTML into path-addressed facts so a diff names the exact element. */
export function facts(html: string, rust: boolean): Fact[] {
  const out: Fact[] = []
  const stack: { tag: string; idx: Map<string, number> }[] = [{ tag: '', idx: new Map() }]
  const text = normalize(html, { rust })
  const re = /<(\/?)([\w-]+)((?:\s[^>]*)?)>|([^<]+)/g
  const VOID = new Set(['img', 'hr', 'br', 'input', 'link', 'meta'])
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m[4] !== undefined) {
      const top = stack[stack.length - 1]
      if (top && m[4].trim()) out.push({ facet: 'tree', text: `${path(stack)}#text` })
      continue
    }
    const tag = m[2] as string
    if (m[1]) {
      stack.pop()
      continue
    }
    const parent = stack[stack.length - 1] as (typeof stack)[number]
    const n = (parent.idx.get(tag) ?? 0) + 1
    parent.idx.set(tag, n)
    stack.push({ tag: `${tag}[${n}]`, idx: new Map() })
    const p = path(stack)
    out.push({ facet: 'tree', text: p })
    for (const a of (m[3] ?? '').matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) {
      const name = a[1] as string
      const fact = `${p}@${name}=${a[2] ?? ''}`
      const facet: Facet =
        name === 'role'
          ? 'role'
          : name.startsWith('aria-')
            ? 'aria'
            : name.startsWith('data-')
              ? 'data'
              : name === 'class'
                ? 'class'
                : 'attr'
      out.push({ facet, text: fact })
    }
    if (VOID.has(tag)) stack.pop()
  }
  return out
}

function path(stack: { tag: string }[]): string {
  return stack
    .map((s) => s.tag)
    .filter(Boolean)
    .join('>')
}

export type Drift = { key: string; facet: Facet; side: 'react-only' | 'rust-only' }

export function diff(react: string, rust: string): Drift[] {
  const r = facts(react, false)
  const u = facts(rust, true)
  const rs = new Set(r.map((f) => `${f.facet}|${f.text}`))
  const us = new Set(u.map((f) => `${f.facet}|${f.text}`))
  const out: Drift[] = []
  for (const f of r)
    if (!us.has(`${f.facet}|${f.text}`))
      out.push({ key: f.text, facet: f.facet, side: 'react-only' })
  for (const f of u)
    if (!rs.has(`${f.facet}|${f.text}`))
      out.push({ key: f.text, facet: f.facet, side: 'rust-only' })
  return out
}
