import { useSignalEffect, useSignals } from '@cascivo/core'
import { getPost } from '../../../blog'
import { canonicalFor } from '../../route-head'
import { applyBlogSeo, applyNotFoundSeo } from '../../seo'
import { NotFound } from '../NotFound'
import { BlogBlocks } from './BlogBlocks'
import { BlogLayout } from './BlogLayout'

/**
 * Owns its own post lookup + head/JSON-LD application (same reason
 * AccessibleComponentPage does: keeps this lazy chunk self-contained rather
 * than threading data through the eager router).
 */
export function BlogPostPage({ slug }: { slug: string }) {
  useSignals()
  const post = getPost(slug)

  useSignalEffect(() => {
    if (typeof document === 'undefined') return
    if (!post) {
      applyNotFoundSeo()
      return
    }
    applyBlogSeo(`/blog/${post.slug}`, post.title, post.description)

    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = 'ld-blog-post'
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.datePublished,
      dateModified: post.dateModified ?? post.datePublished,
      url: canonicalFor(`/blog/${post.slug}`),
      keywords: post.tags.join(', '),
      author: { '@id': 'https://cascivo.com/#org' },
      publisher: { '@id': 'https://cascivo.com/#org' },
      isPartOf: { '@id': 'https://cascivo.com/#site' },
    })
    document.head.appendChild(el)
    return () => el.remove()
  })

  if (!post) return <NotFound />

  return (
    <BlogLayout>
      <article>
        <header>
          <h1>{post.title}</h1>
          <p class="guides-section-sub">
            <time dateTime={post.datePublished}>{post.datePublished}</time>
          </p>
        </header>
        <BlogBlocks blocks={post.blocks} />
      </article>
    </BlogLayout>
  )
}
