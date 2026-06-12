import { SkipNavLink, SkipNavTarget } from '@cascade-ui/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { AccessibilityHero } from './accessibility/AccessibilityHero'

export function AccessibilityPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <AccessibilityHero />
          {/* Tasks 3–5 will add: <AxeComparison /> <A11yMatrix /> <PracticesGrid /> <CiGate /> <A11yCta /> */}
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
