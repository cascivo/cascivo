import type { ViewConfig } from '@cascivo/render'
import { validateView } from '@cascivo/render/validate'

/**
 * A published page: a title and a view. Shared by the Worker (which stores pages) and the
 * app (which builds and shows them). A view is data, not code — it can only arrange cascivo
 * components the manifests describe — so publishing one needs no sandbox and no deploy.
 */
export interface PageInput {
  title: string
  view: ViewConfig
}

export interface PageSummary {
  slug: string
  title: string
  createdAt: string
}

export interface Page extends PageInput, PageSummary {}

/** Largest view accepted, in characters of its JSON. */
export const MAX_VIEW_LENGTH = 32_000

const SLUG = /^[a-z0-9]{10}$/

export function isSlug(value: string): boolean {
  return SLUG.test(value)
}

/**
 * Checks a page against the component manifests (`validateView`: known components and
 * props, and no URL that could run script). The Worker runs it before storing a page, and
 * `<CascivoView>` runs the same check again before rendering one.
 */
export function parsePageInput(raw: unknown): PageInput {
  if (typeof raw !== 'object' || raw === null) throw new Error('Expected { title, view }')
  const { title, view } = raw as Record<string, unknown>
  if (typeof title !== 'string' || title.trim() === '' || title.length > 80) {
    throw new Error('title: 1–80 characters')
  }
  if (JSON.stringify(view ?? null).length > MAX_VIEW_LENGTH) {
    throw new Error(`view: at most ${MAX_VIEW_LENGTH} characters of JSON`)
  }
  const result = validateView(view)
  if (!result.valid) {
    throw new Error(result.errors.map((e) => `${e.path}: ${e.message}`).join('\n'))
  }
  // validateView has checked the whole shape, so the cast states a proven fact.
  return { title: title.trim(), view: view as ViewConfig }
}

export function parsePageSummary(raw: unknown): PageSummary {
  if (typeof raw === 'object' && raw !== null) {
    const { slug, title, createdAt } = raw as Record<string, unknown>
    if (
      typeof slug === 'string' &&
      isSlug(slug) &&
      typeof title === 'string' &&
      typeof createdAt === 'string'
    ) {
      return { slug, title, createdAt }
    }
  }
  throw new Error('Malformed page')
}

export function parsePage(raw: unknown): Page {
  const summary = parsePageSummary(raw)
  const { view } = raw as Record<string, unknown>
  return { ...summary, ...parsePageInput({ title: summary.title, view }) }
}
