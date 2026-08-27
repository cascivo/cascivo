import { type ComponentType, Suspense, lazy } from 'react'
import { useSignals } from '@cascivo/core'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from './sections/Header'
import { PosterHero } from './poster/PosterHero'
import { PosterTicker } from './poster/PosterTicker'
import { currentPath } from '../router'
import { applyNotFoundSeo, applyRouteSeo } from './seo'
import { ROUTE_HEAD } from './route-head'
import { DEMOS } from './pages/examples/data'

// Below-the-fold poster sections — split into their own chunks so the initial
// home JS shrinks. The hero and the ticker stay eager (they are the LCP band).
const PosterWedge = lazy(() =>
  import('./poster/PosterWedge').then((m) => ({ default: m.PosterWedge })),
)
const PosterDifferences = lazy(() =>
  import('./poster/PosterDifferences').then((m) => ({ default: m.PosterDifferences })),
)
const PosterReactivity = lazy(() =>
  import('./poster/PosterReactivity').then((m) => ({ default: m.PosterReactivity })),
)
const PosterProof = lazy(() =>
  import('./poster/PosterProof').then((m) => ({ default: m.PosterProof })),
)
const PosterComparison = lazy(() =>
  import('./poster/PosterComparison').then((m) => ({ default: m.PosterComparison })),
)
// The gallery mounts two dozen live components and a chart; the themes section
// pulls in the nine deferred theme sheets. Both are far below the fold.
const PosterGallery = lazy(() =>
  import('./poster/PosterGallery').then((m) => ({ default: m.PosterGallery })),
)
const PosterThemes = lazy(() =>
  import('./poster/PosterThemes').then((m) => ({ default: m.PosterThemes })),
)
const PosterAiLayer = lazy(() =>
  import('./poster/PosterAiLayer').then((m) => ({ default: m.PosterAiLayer })),
)
const PosterQuickStart = lazy(() =>
  import('./poster/PosterQuickStart').then((m) => ({ default: m.PosterQuickStart })),
)
const PosterTemplates = lazy(() =>
  import('./poster/PosterTemplates').then((m) => ({ default: m.PosterTemplates })),
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
function SectionFallback({ tall = false, height }: { tall?: boolean; height?: number }) {
  return (
    <div
      className={tall ? 'lazy-fallback lazy-fallback--tall' : 'lazy-fallback'}
      style={height !== undefined ? { minBlockSize: height } : undefined}
      aria-hidden
    />
  )
}

function HomePage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="pg">
          <PosterHero />
          <PosterTicker />
          <Suspense fallback={<SectionFallback height={420} />}>
            <PosterWedge />
          </Suspense>
          <Suspense fallback={<SectionFallback height={360} />}>
            <PosterDifferences />
          </Suspense>
          <Suspense fallback={<SectionFallback height={480} />}>
            <PosterReactivity />
          </Suspense>
          <Suspense fallback={<SectionFallback height={520} />}>
            <PosterProof />
          </Suspense>
          <Suspense fallback={<SectionFallback height={560} />}>
            <PosterComparison />
          </Suspense>
          <Suspense fallback={<SectionFallback height={640} />}>
            <PosterGallery />
          </Suspense>
          <Suspense fallback={<SectionFallback height={480} />}>
            <PosterThemes />
          </Suspense>
          <Suspense fallback={<SectionFallback height={520} />}>
            <PosterAiLayer />
          </Suspense>
          <Suspense fallback={<SectionFallback height={480} />}>
            <PosterQuickStart />
          </Suspense>
          <Suspense fallback={<SectionFallback height={360} />}>
            <PosterTemplates />
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
