import { Suspense, lazy } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascivo/components/tabs'
import { ThemeDemo } from './ThemeDemo'

// Non-default tabs are split into their own chunk so the eager home bundle only
// carries the default (Themes) tab — the heavy chart/relay demos stay on
// /examples; these tabs are lightweight static teasers that deep-link there.
const ChartsTeaser = lazy(() =>
  import('./ShowcaseTeasers').then((m) => ({ default: m.ChartsTeaser })),
)
const RelayTeaser = lazy(() =>
  import('./ShowcaseTeasers').then((m) => ({ default: m.RelayTeaser })),
)

function TeaserFallback() {
  return <div className="showcase-teaser-fallback" aria-hidden />
}

export function Showcase() {
  return (
    <section className="showcase section" id="showcase" aria-label="Live showcase" data-reveal="">
      <h2>One library. Every surface.</h2>
      <p className="section-sub">
        Beautiful by default, restyled in a token swap, and ready for real apps and data viz. Switch
        tabs to see the same components do different jobs.
      </p>
      <Tabs defaultValue="themes" className="showcase-tabs">
        <TabsList aria-label="Showcase views">
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="app">Real app</TabsTrigger>
        </TabsList>
        <TabsContent value="themes">
          <ThemeDemo />
        </TabsContent>
        <TabsContent value="charts">
          <Suspense fallback={<TeaserFallback />}>
            <ChartsTeaser />
          </Suspense>
        </TabsContent>
        <TabsContent value="app">
          <Suspense fallback={<TeaserFallback />}>
            <RelayTeaser />
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  )
}
