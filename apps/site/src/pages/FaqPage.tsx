import { useSignalEffect, useSignals } from '@cascivo/core'
import { FAQ } from '../marketing/pages/guides/data'

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}

export function FaqPage() {
  useSignals()

  // FAQPage structured data, built from the same FAQ the page renders — so the
  // rich result and the visible answers can never disagree. Removed on unmount.
  useSignalEffect(() => {
    if (typeof document === 'undefined') return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = 'ld-faq'
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
    document.head.appendChild(el)
    return () => el.remove()
  })

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">FAQ</div>
        <h1>Frequently asked questions</h1>
        <p class="doc-lede">
          Straight answers on licensing, adoption, frameworks, theming, and how cascivo compares —
          each ending in a next step.
        </p>
      </header>

      {FAQ.map((f) => (
        <section class="doc-section faq-entry" key={f.id} id={f.id}>
          <h2>{f.q}</h2>
          <p>{f.a}</p>
          <a
            class="faq-next"
            href={f.next.href}
            {...(isExternal(f.next.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {f.next.label} →
          </a>
        </section>
      ))}
    </article>
  )
}
