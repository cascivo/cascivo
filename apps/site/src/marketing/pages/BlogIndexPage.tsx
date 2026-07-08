import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { POSTS } from '../../blog'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { ROUTE_HEAD } from '../route-head'

const HEAD = ROUTE_HEAD['/blog']

export function BlogIndexPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section class="proof-hero" aria-label="Blog">
            <p class="guides-eyebrow">Blog</p>
            <h1>Blog</h1>
            <p class="proof-hero-sub">{HEAD?.description}</p>
            <a href="/blog/feed.xml">RSS feed →</a>
          </section>
          <section class="guides-section">
            <ul class="scenario-grid">
              {POSTS.map((post) => (
                <li key={post.slug} class="scenario-card">
                  <h2 class="scenario-persona">
                    <a href={`/blog/${post.slug}`}>{post.title} →</a>
                  </h2>
                  <p class="scenario-situation">{post.description}</p>
                  <p class="guides-section-sub">
                    <time dateTime={post.datePublished}>{post.datePublished}</time>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
