// Marketing site canary (shadcn): one page with a hero, features, pricing, testimonials, an FAQ
// accordion and a footer. Section headings are marketing copy ("Everything you need to ship"),
// with the plain section names only in the header's anchor links.
import { Button } from '@/components/ui/button'
import { Faq } from '@/sections/Faq'
import { Features } from '@/sections/Features'
import { Pricing } from '@/sections/Pricing'
import { Testimonials } from '@/sections/Testimonials'

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#faq', label: 'FAQ' },
]

export function App() {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="font-semibold">Shipyard</span>
        <nav aria-label="Main" className="flex gap-1">
          {NAV.map((item) => (
            <Button key={item.href} variant="ghost" asChild>
              <a href={item.href}>{item.label}</a>
            </Button>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-24 px-6 pb-24">
        <section className="flex flex-col items-center gap-6 pt-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Deploy previews for every pull request
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Shipyard builds, tests and hosts each branch so reviewers can click instead of clone.
          </p>
          <Button size="lg">Start free</Button>
        </section>
        <Features />
        <Pricing />
        <Testimonials />
        <Faq />
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">
          © 2026 Shipyard, Inc. Built for developers who ship.
        </div>
      </footer>
    </div>
  )
}

export default App
