import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import type { Heading } from '@docspack/sheaf'
import { DocsArticle, DocsPager, DocsToc, findPage } from '@docspack/sheaf-react'
import '@docspack/sheaf-react/styles.css'
import { graph, loadGuide } from 'virtual:cascivo-guides'
import { DocsNotFound } from './DocsNotFound'

const BASE = '/docs/guides'

/** /docs/guides — every curated guide, in reading order. */
export function GuidesIndexPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Guides</div>
        <h1>Guides</h1>
        <p class="doc-lede">
          Setup, theming, framework integration and recipes. Each guide is also published as
          Markdown for agents, at <code>/docs/&lt;guide&gt;.md</code>, from the same source.
        </p>
      </header>
      <ul class="guide-index">
        {graph.pages.map((page) => (
          <li key={page.slug}>
            <a href={`${BASE}/${page.slug}`}>{page.title}</a>
            {page.summary && <p class="muted">{page.summary}</p>}
          </li>
        ))}
      </ul>
    </article>
  )
}

/**
 * /docs/guides/<slug> — one guide, rendered at build time by Sheaf (apps/site/guides.ts).
 * Keyed by slug in DocsApp, so each guide mounts fresh and loads its own HTML once.
 */
export function GuidePage({ slug }: { slug: string }) {
  useSignals()
  const loaded = useSignal<{ html: string; headings: readonly Heading[] } | null>(null)
  const error = useSignal<string | null>(null)
  const page = findPage(graph, slug)

  useSignalEffect(() => {
    loadGuide(slug)
      .then((guide) => {
        if (guide) loaded.value = guide
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
  })

  if (!page) return <DocsNotFound />
  const guide = loaded.value
  const full = guide ? { ...page, headings: guide.headings } : page

  return (
    <div class="guide-layout">
      <div class="guide-main">
        {guide ? (
          <DocsArticle page={full} html={guide.html} />
        ) : (
          <article class="doc-page">
            <h1>{page.title}</h1>
            <p class="muted">
              {error.value ? `Could not load this guide: ${error.value}` : page.summary}
            </p>
          </article>
        )}
        <DocsPager graph={graph} currentSlug={slug} basePath={BASE} />
        <p class="muted guide-source">
          For agents: <a href={`/docs/${slug}.md`}>{`/docs/${slug}.md`}</a>
        </p>
      </div>
      {guide && (
        <aside class="guide-toc">
          <DocsToc page={full} />
        </aside>
      )}
    </div>
  )
}
