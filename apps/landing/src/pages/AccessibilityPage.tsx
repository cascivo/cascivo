import { SkipNavLink, SkipNavTarget } from '@cascade-ui/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { AccessibilityHero } from './accessibility/AccessibilityHero'
import { AxeComparison } from './accessibility/AxeComparison'
import { A11yMatrix } from './accessibility/A11yMatrix'
import { PracticesGrid } from './accessibility/PracticesGrid'
import { CiGate } from './accessibility/CiGate'
import { A11yCta } from './accessibility/A11yCta'

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
          <PracticesGrid />
          <CiGate />
          <A11yCta />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
