import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { AccessibilityHero } from './accessibility/AccessibilityHero'
import { AxeComparison } from './accessibility/AxeComparison'
import { AtMatrix } from './accessibility/AtMatrix'
import { A11yMatrix } from './accessibility/A11yMatrix'
import { PracticesGrid } from './accessibility/PracticesGrid'
import { CiGate } from './accessibility/CiGate'
import { A11yCta } from './accessibility/A11yCta'
import { AccessibilityStatement } from './accessibility/AccessibilityStatement'

export function AccessibilityPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <AccessibilityHero />
          <AxeComparison />
          <AtMatrix />
          <A11yMatrix />
          <PracticesGrid />
          <CiGate />
          <AccessibilityStatement />
          <A11yCta />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
