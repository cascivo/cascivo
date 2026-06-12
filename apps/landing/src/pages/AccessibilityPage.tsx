import { SkipNavLink, SkipNavTarget } from '@cascade-ui/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { AccessibilityHero } from './accessibility/AccessibilityHero'
import { AxeComparison } from './accessibility/AxeComparison'

export function AccessibilityPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <AccessibilityHero />
          <AxeComparison />
          {/* Tasks 4–5 will add: <A11yMatrix /> <PracticesGrid /> <CiGate /> <A11yCta /> */}
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
