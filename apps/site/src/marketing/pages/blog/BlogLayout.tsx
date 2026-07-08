import type { ComponentChildren } from 'preact'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../../sections/Header'
import { Footer } from '../../sections/Footer'

/** Shared chrome for /blog and /blog/<slug>. */
export function BlogLayout({ children }: { children: ComponentChildren }) {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <p class="guides-eyebrow">
            <a href="/blog">← Blog</a>
          </p>
          {children}
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
