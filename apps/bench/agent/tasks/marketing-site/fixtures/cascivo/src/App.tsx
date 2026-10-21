// Marketing site canary (cascivo): one page with a hero, features, pricing, testimonials, an FAQ
// of disclosures and a footer, linked from the header by in-page anchors.
import { Button, Flex, Link, Text } from '@cascivo/react'
import '@cascivo/themes/light.css'
import { Faq } from './sections/Faq'
import { Features } from './sections/Features'
import { Pricing } from './sections/Pricing'
import { Testimonials } from './sections/Testimonials'

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Customers' },
  { href: '#faq', label: 'FAQ' },
]

export default function App() {
  return (
    <>
      <header>
        <Flex direction="horizontal" justify="between" align="center" gap={4}>
          <Text weight="semibold">Shipyard</Text>
          <nav aria-label="Main">
            <Flex direction="horizontal" gap={4}>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </Flex>
          </nav>
        </Flex>
      </header>
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <Faq />
      </main>
      <footer>
        <Text muted>© 2026 Shipyard, Inc. Built for developers who ship.</Text>
      </footer>
    </>
  )
}

function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <Flex gap={4} align="center">
        <h1 id="hero-title">Deploy previews for every pull request</h1>
        <Text>
          Shipyard builds, tests and hosts each branch so reviewers can click instead of clone.
        </Text>
        <Button>Start free</Button>
      </Flex>
    </section>
  )
}
