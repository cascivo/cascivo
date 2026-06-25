import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { TechDeepDive } from '../sections/TechDeepDive'

export function ModernCssPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <TechDeepDive />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
