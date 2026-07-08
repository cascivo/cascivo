import type { ComponentChildren } from 'preact'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../../sections/Header'
import { Footer } from '../../sections/Footer'

/** Shared chrome for the standalone /guides/<slug> pages split out of /guides. */
export function GuideLayout({ children }: { children: ComponentChildren }) {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <p className="guides-eyebrow">
            <a href="/guides">← All guides</a>
          </p>
          {children}
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
