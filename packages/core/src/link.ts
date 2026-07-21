'use client'
import type { ElementType, MouseEvent, ReactNode } from 'react'

/**
 * The prop bag cascivo's config-driven nav components spread onto the link they
 * render — the exact contract a custom {@link LinkComponent} receives. Map `href`
 * to your router's destination prop (TanStack Router uses `to`) and spread the
 * rest so active-state and accessibility attributes carry over. Because navigation
 * stays a real `<a>`, middle-click / open-in-new-tab keep working — you do not need
 * to intercept `onClick`.
 */
export interface LinkComponentProps {
  /** Destination URL. Undefined for a disabled item. Map to your router's prop. */
  href?: string | undefined
  /** Class names cascivo computes (layout + active-state styling). */
  className?: string | undefined
  /** Rendered link content — cascivo's computed icon + label + trailing nodes. */
  children?: ReactNode
  /**
   * Click handler cascivo attaches. It only calls `preventDefault()` for a disabled
   * item; otherwise it is inert. Spread it onto your router `<Link>` — routers
   * compose their own click handling with a passed-through `onClick`.
   */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  /** `'page'` on the active item (assistive tech + active styling). */
  'aria-current'?: 'page' | undefined
  'aria-label'?: string | undefined
  'aria-disabled'?: boolean | undefined
  /** `'active'` on the current item — a style hook mirroring `aria-current`. */
  'data-state'?: 'active' | undefined
  tabIndex?: number | undefined
  /**
   * Additional computed `data-*` attributes cascivo may attach (e.g. `data-tone`).
   * Spread the whole bag so future attributes carry over without an adapter change.
   */
  [dataAttr: `data-${string}`]: string | undefined
}

/**
 * A component (or intrinsic tag) that renders a navigation link. It receives a
 * {@link LinkComponentProps} bag (an `href` plus anchor passthrough) and must
 * render an actual `<a>` (or equivalent) so the browser and the router see a real
 * link. `'a'` is the default.
 */
export type LinkComponent = ElementType

// A module singleton — rather than React context — so any config-driven nav
// component (SideNav, ShellHeader, Header, Breadcrumb, …) renders through the
// app's router Link with a single one-time `setLinkComponent(...)` call and no
// per-item prop-drilling, mirroring the `setTheme`/i18n singletons and keeping
// `useContext` out per CLAUDE.md. Module scope runs on both server and client, so
// this is SSR-safe.
let linkComponent: LinkComponent = 'a'

/**
 * Register the component cascivo's config-driven nav components (SideNav,
 * ShellHeader, Header, Breadcrumb, Switcher, Dock) use to render links. Call once
 * at app startup. The component receives the full {@link LinkComponentProps} bag —
 * spread it so active-state and a11y attributes carry over, and so middle-click /
 * open-in-new-tab keep working (no `onClick` interception needed). Framework recipes:
 *
 * ```tsx
 * // TanStack Router — its Link takes `to`, so map href → to and spread the rest:
 * import { Link } from '@tanstack/react-router'
 * import type { LinkComponentProps } from '@cascivo/react' // or '@cascivo/core' for copied source
 * setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href} {...rest} />)
 *
 * // Next.js — its Link takes `href` directly:
 * import Link from 'next/link'
 * setLinkComponent(Link)
 * ```
 */
export function setLinkComponent(component: LinkComponent): void {
  linkComponent = component
}

/** The registered link component (defaults to the intrinsic `'a'` tag). */
export function getLinkComponent(): LinkComponent {
  return linkComponent
}
