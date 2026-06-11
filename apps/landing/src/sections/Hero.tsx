import { useEffect, useState } from 'react'
import { Button } from '@cascade-ui/components/button'
import { Input } from '@cascade-ui/components/input'
import { Card, CardContent, CardHeader, CardTitle } from '@cascade-ui/components/card'
import { Badge } from '@cascade-ui/components/badge'

type Theme = 'light' | 'dark' | 'warm'
const THEMES: Theme[] = ['light', 'dark', 'warm']

const SLIDES = ['button', 'input', 'card'] as const
type Slide = (typeof SLIDES)[number]

function SlideView({ slide }: { slide: Slide }) {
  switch (slide) {
    case 'button':
      return (
        <div className="hero-slide-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Saving…</Button>
        </div>
      )
    case 'input':
      return (
        <div className="hero-slide-col">
          <Input label="Email address" placeholder="you@example.com" />
          <Input label="Password" type="password" hint="At least 12 characters" />
        </div>
      )
    case 'card':
      return (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Owned code</CardTitle>
          </CardHeader>
          <CardContent>
            Components are copied into your project. Every line is yours to keep, read, and change.
          </CardContent>
        </Card>
      )
  }
}

export function Hero() {
  const [theme, setTheme] = useState<Theme>('light')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      const advance = () => setIndex((i) => (i + 1) % SLIDES.length)
      // Animate the swap with the View Transitions API where available.
      if (document.startViewTransition) document.startViewTransition(advance)
      else advance()
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const selectTheme = (t: Theme) => {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const slide = SLIDES[index % SLIDES.length] ?? 'button'

  return (
    <header className="hero">
      <Badge variant="outline">v1 — 97+ components</Badge>
      <h1>
        The design system that ships like <em>shadcn</em>, performs like a <em>signal</em>, and
        thinks like an <em>agent</em>.
      </h1>
      <p className="hero-tagline">
        CSS-native styling, fine-grained reactivity, and machine-readable manifests — with zero
        compromise on quality, performance, or developer experience.
      </p>

      <div className="hero-ctas">
        <Button size="lg">Get started</Button>
        <Button size="lg" variant="secondary">
          View on GitHub
        </Button>
      </div>

      <div className="hero-stage-wrap">
        <div className="hero-stage-bar">
          <span className="hero-stage-label">{slide}</span>
          <div className="hero-theme-switcher" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`hero-theme-btn ${theme === t ? 'active' : ''}`}
                onClick={() => selectTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="hero-stage">
          <SlideView slide={slide} />
        </div>
      </div>
    </header>
  )
}
