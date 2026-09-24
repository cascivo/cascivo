import { type ComponentType, type ReactNode, type Ref, Suspense, lazy, useRef } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from './sections/Header'
import { PosterHero } from './poster/PosterHero'
import { currentPath } from '../router'
import { applyNotFoundSeo, applyRouteSeo } from './seo'
import { ROUTE_HEAD } from './route-head'
import { DEMOS } from './pages/examples/data'

// Below-the-fold poster sections — split into their own chunks so the initial
// home JS shrinks. The hero stays eager (it is the LCP band).
const PosterReactivity = lazy(() =>
  import('./poster/PosterReactivity').then((m) => ({ default: m.PosterReactivity })),
)
const PosterProof = lazy(() =>
  import('./poster/PosterProof').then((m) => ({ default: m.PosterProof })),
)
const PosterComparison = lazy(() =>
  import('./poster/PosterComparison').then((m) => ({ default: m.PosterComparison })),
)
// The themes section pulls in the nine deferred theme sheets; far below the fold.
const PosterThemes = lazy(() =>
  import('./poster/PosterThemes').then((m) => ({ default: m.PosterThemes })),
)
const PosterAiLayer = lazy(() =>
  import('./poster/PosterAiLayer').then((m) => ({ default: m.PosterAiLayer })),
)
const PosterBreadth = lazy(() =>
  import('./poster/PosterBreadth').then((m) => ({ default: m.PosterBreadth })),
)
const PosterQuickStart = lazy(() =>
  import('./poster/PosterQuickStart').then((m) => ({ default: m.PosterQuickStart })),
)
const PosterShowcase = lazy(() =>
  import('./poster/PosterShowcase').then((m) => ({ default: m.PosterShowcase })),
)
const PosterCta = lazy(() => import('./poster/PosterCta').then((m) => ({ default: m.PosterCta })))
const Footer = lazy(() => import('./sections/Footer').then((m) => ({ default: m.Footer })))

// Non-home routes — loaded on demand, never in the home bundle.
const AccessibilityPage = lazy(() =>
  import('./pages/AccessibilityPage').then((m) => ({ default: m.AccessibilityPage })),
)
const AccessibleComponentPage = lazy(() =>
  import('./pages/AccessibleComponentPage').then((m) => ({ default: m.AccessibleComponentPage })),
)
const PerformancePage = lazy(() =>
  import('./pages/PerformancePage').then((m) => ({ default: m.PerformancePage })),
)
const EnterprisePage = lazy(() =>
  import('./pages/EnterprisePage').then((m) => ({ default: m.EnterprisePage })),
)
const GuidesPage = lazy(() => import('./pages/GuidesPage').then((m) => ({ default: m.GuidesPage })))
const ComingFromShadcnPage = lazy(() =>
  import('./pages/guides/ComingFromShadcnPage').then((m) => ({ default: m.ComingFromShadcnPage })),
)
const CustomizationPage = lazy(() =>
  import('./pages/guides/CustomizationPage').then((m) => ({ default: m.CustomizationPage })),
)
const UseCasesPage = lazy(() =>
  import('./pages/guides/UseCasesPage').then((m) => ({ default: m.UseCasesPage })),
)
const WhenNotToUsePage = lazy(() =>
  import('./pages/guides/WhenNotToUsePage').then((m) => ({ default: m.WhenNotToUsePage })),
)
const AlternativesPage = lazy(() =>
  import('./pages/guides/AlternativesPage').then((m) => ({ default: m.AlternativesPage })),
)
const GuidesFaqPage = lazy(() =>
  import('./pages/guides/GuidesFaqPage').then((m) => ({ default: m.GuidesFaqPage })),
)
const BlogIndexPage = lazy(() =>
  import('./pages/BlogIndexPage').then((m) => ({ default: m.BlogIndexPage })),
)
const BlogPostPage = lazy(() =>
  import('./pages/blog/BlogPostPage').then((m) => ({ default: m.BlogPostPage })),
)
const ModernCssPage = lazy(() =>
  import('./pages/ModernCssPage').then((m) => ({ default: m.ModernCssPage })),
)
const HighlightsPage = lazy(() =>
  import('./pages/HighlightsPage').then((m) => ({ default: m.HighlightsPage })),
)
const ExamplesPage = lazy(() =>
  import('./pages/ExamplesPage').then((m) => ({ default: m.ExamplesPage })),
)
const ShowcasePage = lazy(() =>
  import('./pages/ShowcasePage').then((m) => ({ default: m.ShowcasePage })),
)
const AiPage = lazy(() => import('./pages/AiPage').then((m) => ({ default: m.AiPage })))
const ChartsPage = lazy(() => import('./pages/ChartsPage').then((m) => ({ default: m.ChartsPage })))
const ExampleDetailPage = lazy(() =>
  import('./pages/ExampleDetailPage').then((m) => ({ default: m.ExampleDetailPage })),
)
const OgCard = lazy(() => import('./sections/OgCard').then((m) => ({ default: m.OgCard })))
const CreatePage = lazy(() => import('./pages/CreatePage').then((m) => ({ default: m.CreatePage })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))
const BlocksPage = lazy(() =>
  import('./pages/blocks/BlocksPage').then((m) => ({ default: m.BlocksPage })),
)
const BlockDetailPage = lazy(() =>
  import('./pages/blocks/BlockDetailPage').then((m) => ({ default: m.BlockDetailPage })),
)
const BlockPreviewPage = lazy(() =>
  import('./pages/blocks/BlockPreviewPage').then((m) => ({ default: m.BlockPreviewPage })),
)

/** Reserved-height placeholder for a lazy section/route (avoids CLS on load). */
function SectionFallback({
  tall = false,
  height,
  // Defaults to `null` rather than staying undefined: `exactOptionalPropertyTypes` rejects
  // an explicit `ref={undefined}` on a DOM element, and `Ref<T>` already admits null.
  elementRef = null,
}: {
  tall?: boolean
  height?: number
  /** Named, not `ref`: preact/compat strips a bare `ref` from a function component. */
  elementRef?: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={elementRef}
      className={tall ? 'lazy-fallback lazy-fallback--tall' : 'lazy-fallback'}
      style={height !== undefined ? { minBlockSize: height } : undefined}
      aria-hidden
    />
  )
}

/**
 * Hold a section's chunk back until its placeholder nears the viewport.
 *
 * `lazy()` on its own defers nothing here: every section below is rendered on mount, so
 * every chunk is requested during initial load and the landing pays for all of them before
 * first paint. This gate makes the import start on intersection instead.
 *
 * Applied to the two expensive sections, both many screens down: the gallery (DataTable,
 * BarChart and a dozen live components) and the themes section (which fetches the nine
 * deferred theme stylesheets on mount).
 */
function WhenNearViewport({ height, children }: { height: number; children: ReactNode }) {
  useSignals()
  const shown = useSignal(false)
  const ref = useRef<HTMLDivElement>(null)

  useSignalEffect(() => {
    const el = ref.current
    if (!el) return
    // No IntersectionObserver (an old browser, or a crawler running a partial DOM): render
    // immediately rather than leaving the section permanently absent.
    if (typeof IntersectionObserver === 'undefined') {
      shown.value = true
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        shown.value = true
        observer.disconnect()
      },
      // Roughly a viewport of lead time, so the chunk is usually resolved before the
      // placeholder is actually on screen and the section does not visibly pop in.
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  })

  return shown.value ? <>{children}</> : <SectionFallback height={height} elementRef={ref} />
}

function HomePage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="pg">
          <PosterHero />
          <Suspense fallback={<SectionFallback height={480} />}>
            <PosterReactivity />
          </Suspense>
          <Suspense fallback={<SectionFallback height={520} />}>
            <PosterProof />
          </Suspense>
          <Suspense fallback={<SectionFallback height={560} />}>
            <PosterComparison />
          </Suspense>
          <WhenNearViewport height={480}>
            <Suspense fallback={<SectionFallback height={480} />}>
              <PosterThemes />
            </Suspense>
          </WhenNearViewport>
          <Suspense fallback={<SectionFallback height={640} />}>
            <PosterAiLayer />
          </Suspense>
          <Suspense fallback={<SectionFallback height={520} />}>
            <PosterBreadth />
          </Suspense>
          <Suspense fallback={<SectionFallback height={480} />}>
            <PosterQuickStart />
          </Suspense>
          <Suspense fallback={<SectionFallback height={520} />}>
            <PosterShowcase />
          </Suspense>
          <Suspense fallback={<SectionFallback height={320} />}>
            <PosterCta />
          </Suspense>
        </main>
      </SkipNavTarget>
      <Suspense fallback={<SectionFallback height={260} />}>
        <Footer />
      </Suspense>
    </>
  )
}

type Route = { Page: ComponentType; title: string }

// Titles come from ROUTE_HEAD (single source of truth shared with the build-time
// prerender). `/og` is a render target with its own title, not in ROUTE_HEAD.
const ROUTES: Record<string, Route> = {
  '/': { Page: HomePage, title: ROUTE_HEAD['/']?.title ?? 'cascivo' },
  '/accessibility': {
    Page: AccessibilityPage,
    title: ROUTE_HEAD['/accessibility']?.title ?? 'cascivo',
  },
  '/performance': { Page: PerformancePage, title: ROUTE_HEAD['/performance']?.title ?? 'cascivo' },
  '/enterprise': { Page: EnterprisePage, title: ROUTE_HEAD['/enterprise']?.title ?? 'cascivo' },
  '/guides': { Page: GuidesPage, title: ROUTE_HEAD['/guides']?.title ?? 'cascivo' },
  '/blog': { Page: BlogIndexPage, title: ROUTE_HEAD['/blog']?.title ?? 'cascivo' },
  '/guides/coming-from-shadcn': {
    Page: ComingFromShadcnPage,
    title: ROUTE_HEAD['/guides/coming-from-shadcn']?.title ?? 'cascivo',
  },
  '/guides/customization': {
    Page: CustomizationPage,
    title: ROUTE_HEAD['/guides/customization']?.title ?? 'cascivo',
  },
  '/guides/use-cases': {
    Page: UseCasesPage,
    title: ROUTE_HEAD['/guides/use-cases']?.title ?? 'cascivo',
  },
  '/guides/when-not-to-use': {
    Page: WhenNotToUsePage,
    title: ROUTE_HEAD['/guides/when-not-to-use']?.title ?? 'cascivo',
  },
  '/guides/alternatives': {
    Page: AlternativesPage,
    title: ROUTE_HEAD['/guides/alternatives']?.title ?? 'cascivo',
  },
  '/guides/faq': { Page: GuidesFaqPage, title: ROUTE_HEAD['/guides/faq']?.title ?? 'cascivo' },
  '/modern-css': { Page: ModernCssPage, title: ROUTE_HEAD['/modern-css']?.title ?? 'cascivo' },
  '/highlights': { Page: HighlightsPage, title: ROUTE_HEAD['/highlights']?.title ?? 'cascivo' },
  '/examples': { Page: ExamplesPage, title: ROUTE_HEAD['/examples']?.title ?? 'cascivo' },
  '/showcase': { Page: ShowcasePage, title: ROUTE_HEAD['/showcase']?.title ?? 'cascivo' },
  '/ai': { Page: AiPage, title: ROUTE_HEAD['/ai']?.title ?? 'cascivo' },
  '/charts': { Page: ChartsPage, title: ROUTE_HEAD['/charts']?.title ?? 'cascivo' },
  '/og': { Page: OgCard, title: 'cascivo' },
  '/create': {
    Page: CreatePage,
    title: ROUTE_HEAD['/create']?.title ?? 'cascivo',
  },
  '/blocks': {
    Page: BlocksPage,
    title: ROUTE_HEAD['/blocks']?.title ?? 'cascivo',
  },
  // One detail route per demo (/examples/<slug>); titles from ROUTE_HEAD.
  ...Object.fromEntries(
    DEMOS.map((d) => [
      d.detailHref,
      { Page: ExampleDetailPage, title: ROUTE_HEAD[d.detailHref]?.title ?? 'cascivo' },
    ]),
  ),
}

/** The marketing surface — root-level routes; chrome (Header/Footer) is per-page. */
export function MarketingApp() {
  useSignals()
  const pathname = currentPath.value

  // /blocks/preview/:name — bare preview page (no header/footer).
  if (pathname.startsWith('/blocks/preview/')) {
    const blockName = pathname.slice('/blocks/preview/'.length).split('/')[0]
    if (blockName) {
      applyRouteSeo(pathname, `${blockName} preview — cascivo`)
      return (
        <Suspense fallback={null}>
          <BlockPreviewPage name={blockName} />
        </Suspense>
      )
    }
  }

  // /blocks/:name dynamic route.
  if (pathname.startsWith('/blocks/') && pathname !== '/blocks/') {
    const blockName = pathname.slice('/blocks/'.length).split('/')[0]
    if (blockName) {
      applyRouteSeo(pathname, `${blockName} — cascivo`)
      return (
        <Suspense fallback={<SectionFallback tall />}>
          <BlockDetailPage name={blockName} />
        </Suspense>
      )
    }
  }

  // /accessibility/:name — per-component accessibility guide, registry-derived.
  // Deliberately does NOT import `data.ts` here (it pulls in the full 1MB+
  // registry.json) — the lazy AccessibleComponentPage chunk owns the lookup
  // and applies its own head, exactly like DocsApp/ComponentPage do, so the
  // eager marketing bundle never gets the registry attached to it.
  if (pathname.startsWith('/accessibility/') && pathname !== '/accessibility/') {
    const name = decodeURIComponent(pathname.slice('/accessibility/'.length).split('/')[0] ?? '')
    if (name) {
      return (
        <Suspense fallback={<SectionFallback tall />}>
          <AccessibleComponentPage name={name} />
        </Suspense>
      )
    }
  }

  // /blog/:slug — post. Same self-contained-lookup reasoning as /accessibility/:name.
  if (pathname.startsWith('/blog/') && pathname !== '/blog/') {
    const slug = decodeURIComponent(pathname.slice('/blog/'.length).split('/')[0] ?? '')
    if (slug) {
      return (
        <Suspense fallback={<SectionFallback tall />}>
          <BlogPostPage slug={slug} />
        </Suspense>
      )
    }
  }

  const route = ROUTES[pathname]

  if (!route) {
    applyNotFoundSeo()
    return (
      <Suspense fallback={<SectionFallback tall />}>
        <NotFound />
      </Suspense>
    )
  }

  applyRouteSeo(pathname, route.title)

  return (
    <Suspense fallback={<SectionFallback tall />}>
      <route.Page />
    </Suspense>
  )
}
