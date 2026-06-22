import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ContextRelated {
  name: string
  relationship: string
  reason: string
}

export interface ContextAntiPattern {
  bad: string
  good: string
  why: string
}

export interface ContextFlexibility {
  area: string
  level: string
  note: string
}

export interface ComponentIntent {
  whenToUse: string[]
  whenNotToUse: string[]
  antiPatterns: ContextAntiPattern[]
  related: ContextRelated[]
  a11yRationale?: string
  flexibility?: ContextFlexibility[]
}

export interface ContextComponent {
  name: string
  category: string
  description: string
  intent: ComponentIntent
  contextUrl: string
  /** Copy-pasteable system-prompt snippet that pins an LLM to this component. */
  aiPrompt?: string
}

export interface ContextBundle {
  generatedAt: string
  tagline: string
  authoringRules: string[]
  tokenCatalogUrl: string
  components: ContextComponent[]
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTEXT_BASE_URL = 'https://cascivo.com'

export async function loadContext(fetchFn?: FetchFn): Promise<ContextBundle> {
  const localPaths = [
    join(HERE, '..', '..', '..', 'apps', 'docs', 'public', 'context.json'),
    join(HERE, 'context.json'),
  ]
  for (const p of localPaths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8')) as ContextBundle
  }
  const url = `${CONTEXT_BASE_URL}/context.json`
  const fn = fetchFn ?? fetch
  const res = await fn(url)
  if (!res.ok) throw new Error(`Failed to fetch context bundle: ${res.status}`)
  return res.json() as Promise<ContextBundle>
}

export async function loadComponentMarkdown(
  name: string,
  fetchFn?: FetchFn,
): Promise<string | null> {
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  const localPaths = [
    join(HERE, '..', '..', '..', 'apps', 'docs', 'public', 'context', `${slug}.md`),
    join(HERE, 'context', `${slug}.md`),
  ]
  for (const p of localPaths) {
    if (existsSync(p)) return readFileSync(p, 'utf8')
  }
  const url = `${CONTEXT_BASE_URL}/context/${slug}.md`
  const fn = fetchFn ?? fetch
  try {
    const res = await fn(url)
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}
