'use client'
import { lazy, Suspense } from 'react'
import type {
  AnchorHTMLAttributes,
  ComponentType,
  LazyExoticComponent,
  MouseEvent,
  ReactNode,
} from 'react'
import { computed, signal, useSignals } from '@cascivo/core'
import type { LinkComponentProps, ReadonlySignal } from '@cascivo/core'
import { compareSpecificity, compilePath, matchPath, normalizePath } from './path'
import type { CompiledPath, PathParams } from './path'

/** What a route component receives. `RouteProps<'/c/:id'>` is `{ params: { id: string } }`. */
export interface RouteProps<P extends string = string> {
  params: PathParams<P>
}

/**
 * A route component with its params erased, so routes with different patterns fit in one
 * array without `any`. Only `route`/`lazyRoute` create one — after checking the component
 * against its own pattern — and only `RouterView` renders one, with params matched by that
 * same pattern.
 */
type ErasedComponent = ComponentType<{ params: never }>

export interface Route {
  readonly path: string
  readonly component: ErasedComponent | LazyExoticComponent<ErasedComponent>
}

/** A route whose component is bundled with the app. */
export function route<P extends string>(path: P, component: ComponentType<RouteProps<P>>): Route {
  return { path, component: component as unknown as ErasedComponent }
}

/**
 * A route whose component is its own chunk, loaded on first visit:
 * `lazyRoute('/settings', () => import('./routes/settings'))`. The module's default export
 * must accept `RouteProps<P>`, so a route file and its pattern cannot disagree on params.
 */
export function lazyRoute<P extends string>(
  path: P,
  load: () => Promise<{ default: ComponentType<RouteProps<P>> }>,
): Route {
  return { path, component: lazy(load) as unknown as LazyExoticComponent<ErasedComponent> }
}

export interface RouteMatch {
  readonly route: Route
  readonly params: Readonly<Record<string, string>>
}

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing one. */
  replace?: boolean
}

export interface RouterOptions {
  routes: readonly Route[]
  /** Rendered by `RouterView` when no route matches. */
  notFound?: Route | undefined
  /**
   * The path prefix the app is served under, e.g. `/demos/chat`. Route patterns, `navigate`
   * and `Link` hrefs stay app-relative; the router adds and strips the prefix.
   */
  base?: string
  /** Wrap navigations in `document.startViewTransition` where supported. Default `true`. */
  viewTransitions?: boolean
}

export interface Router {
  /** The app-relative path, e.g. `/c/42`. */
  readonly pathname: ReadonlySignal<string>
  /** The query string including `?`, or `''`. */
  readonly search: ReadonlySignal<string>
  /** The matched route and its decoded params, or `null` when nothing matches. */
  readonly match: ReadonlySignal<RouteMatch | null>
  readonly notFound: Route | null
  /** Navigate to an app-relative URL (`/c/42`, `/settings?tab=a`, `#top`). */
  navigate(to: string, options?: NavigateOptions): void
  /** The document href for an app-relative URL — the base prefix applied. */
  href(to: string): string
  /**
   * An `<a>` that navigates client-side on a plain left click and leaves modified clicks,
   * `target`, `download` and external URLs to the browser. Pass it to `setLinkComponent`
   * so `SideNav`, `ShellHeader` and `Breadcrumb` route through this router.
   */
  readonly Link: ComponentType<LinkProps>
  /** Removes the `popstate` listener. For tests and hot reload; apps never need it. */
  dispose(): void
}

export type LinkProps = LinkComponentProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkComponentProps>

interface Location {
  pathname: string
  search: string
  hash: string
}

const EXTERNAL = /^([a-z][a-z\d+.-]*:|\/\/)/i

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown }

/**
 * A client-side router whose state is signals: read `router.match.value` anywhere and that
 * component re-renders on navigation — no provider, no context. Browser-only state; on the
 * server it sits at `/`.
 */
export function createRouter(options: RouterOptions): Router {
  const base = options.base ? normalizePath(options.base).replace(/^\/$/, '') : ''
  const viewTransitions = options.viewTransitions ?? true
  const compiled: { route: Route; path: CompiledPath }[] = options.routes
    .map((r) => ({ route: r, path: compilePath(r.path) }))
    .sort((a, b) => compareSpecificity(a.path, b.path))

  const hasWindow = typeof window !== 'undefined'

  function read(): Location {
    if (!hasWindow) return { pathname: '/', search: '', hash: '' }
    const { pathname, search, hash } = window.location
    const inApp = base && (pathname === base || pathname.startsWith(`${base}/`))
    return { pathname: normalizePath(inApp ? pathname.slice(base.length) : pathname), search, hash }
  }

  const location = signal<Location>(read())
  const pathname = computed(() => location.value.pathname)
  const search = computed(() => location.value.search)
  const match = computed<RouteMatch | null>(() => {
    for (const entry of compiled) {
      const params = matchPath(entry.path, pathname.value)
      if (params) return { route: entry.route, params }
    }
    return null
  })

  function href(to: string): string {
    if (EXTERNAL.test(to) || to.startsWith('#') || to.startsWith('?')) return to
    const cut = to.search(/[?#]/)
    const path = cut === -1 ? to : to.slice(0, cut)
    return `${base}${normalizePath(path)}${cut === -1 ? '' : to.slice(cut)}`
  }

  function update(next: Location): void {
    const doc = hasWindow ? (document as ViewTransitionDocument) : null
    if (viewTransitions && doc?.startViewTransition && doc.visibilityState === 'visible') {
      doc.startViewTransition(() => {
        location.value = next
      })
    } else {
      location.value = next
    }
  }

  function navigate(to: string, navigateOptions: NavigateOptions = {}): void {
    if (!hasWindow) return
    const current = location.value
    const url = new URL(
      href(to),
      `${window.location.origin}${base}${current.pathname}${current.search}`,
    )
    if (url.origin !== window.location.origin) {
      window.location.assign(url.href)
      return
    }
    const target = `${url.pathname}${url.search}${url.hash}`
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (navigateOptions.replace) history.replaceState(null, '', target)
    else if (target !== now) history.pushState(null, '', target)
    else return
    const next = read()
    update(next)
    if (next.hash) {
      requestAnimationFrame(() => document.getElementById(next.hash.slice(1))?.scrollIntoView())
    } else if (!navigateOptions.replace) {
      window.scrollTo(0, 0)
    }
  }

  const onPopState = () => update(read())
  if (hasWindow) window.addEventListener('popstate', onPopState)

  function Link({ href: to, onClick, ...rest }: LinkProps) {
    return (
      <a
        {...rest}
        href={to === undefined ? undefined : href(to)}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented || to === undefined || EXTERNAL.test(to)) return
          if (!isPlainLeftClick(event)) return
          const target = event.currentTarget.getAttribute('target')
          if ((target && target !== '_self') || event.currentTarget.hasAttribute('download')) return
          event.preventDefault()
          navigate(to)
        }}
      />
    )
  }

  return {
    pathname,
    search,
    match,
    notFound: options.notFound ?? null,
    navigate,
    href,
    Link,
    dispose: () => {
      if (hasWindow) window.removeEventListener('popstate', onPopState)
    },
  }
}

export interface RouterViewProps {
  router: Router
  /** Shown while a lazy route's chunk loads. Default: nothing. */
  fallback?: ReactNode
}

/** Renders the matched route (or `notFound`), passing it its decoded params. */
export function RouterView({ router, fallback = null }: RouterViewProps) {
  useSignals()
  const found = router.match.value
  const active = found?.route ?? router.notFound
  if (!active) return null
  // Params were decoded for this route's own pattern, so they are exactly its `PathParams`.
  const Component = active.component as ComponentType<{ params: Readonly<Record<string, string>> }>
  return (
    <Suspense fallback={fallback}>
      <Component key={active.path} params={found?.params ?? {}} />
    </Suspense>
  )
}
