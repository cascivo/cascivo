import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { GuidesHero } from './guides/GuidesHero'
import { MigrationGuide } from './guides/MigrationGuide'
import { BrandCustomization } from './guides/BrandCustomization'
import { UseCaseScenarios } from './guides/UseCaseScenarios'
import { WhenNotToUse } from './guides/WhenNotToUse'
import { GuidesFaq } from './guides/GuidesFaq'
import { GuidesCta } from './guides/GuidesCta'
import { Ecosystem } from '../sections/Ecosystem'

export function GuidesPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <GuidesHero />
          <MigrationGuide />
          <BrandCustomization />
          <UseCaseScenarios />
          <Ecosystem />
          <WhenNotToUse />
          <GuidesFaq />
          <GuidesCta />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
