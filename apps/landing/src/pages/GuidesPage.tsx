import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { GuidesHero } from './guides/GuidesHero'
import { MigrationGuide } from './guides/MigrationGuide'
import { BrandCustomization } from './guides/BrandCustomization'

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
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
