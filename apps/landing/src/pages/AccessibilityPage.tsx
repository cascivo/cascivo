import { SkipNavLink, SkipNavTarget } from '@cascade-ui/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { AccessibilityHero } from './accessibility/AccessibilityHero'
import { AxeComparison } from './accessibility/AxeComparison'
import { A11yMatrix } from './accessibility/A11yMatrix'

export function AccessibilityPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <AccessibilityHero />
          <AxeComparison />
          <A11yMatrix />
          {/* Tasks 5 will add: <PracticesGrid /> <CiGate /> <A11yCta /> */}
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
