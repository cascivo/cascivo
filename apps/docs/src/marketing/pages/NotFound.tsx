import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'

export function NotFound() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section className="proof-hero">
            <h1>Page not found</h1>
            <p>
              The page you’re looking for doesn’t exist. It may have moved, or the link may be
              broken.
            </p>
            <p>
              <a className="btn btn-primary" href="/">
                Back to home
              </a>{' '}
              <a className="btn btn-ghost" href="/guides">
                Browse the guides
              </a>
            </p>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
