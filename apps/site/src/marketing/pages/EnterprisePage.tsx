import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { EnterprisePitch } from '../sections/EnterprisePitch'

export function EnterprisePage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <EnterprisePitch />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
