import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { GuidesHero } from './guides/GuidesHero'
import { MigrationGuide } from './guides/MigrationGuide'

export function GuidesPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <GuidesHero />
          <MigrationGuide />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
