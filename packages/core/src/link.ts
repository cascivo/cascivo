'use client'
import type { ElementType } from 'react'

/**
 * A component (or intrinsic tag) that renders a navigation link. It must accept an
 * `href` plus the usual anchor passthrough — `className`, `children`, `onClick`,
 * `aria-*`, `data-*`, `tabIndex` — and render an actual `<a>` (or equivalent) so
 * the browser and the router see a real link. `'a'` is the default.
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
 * Register the component cascivo's config-driven nav components use to render
 * links. Call once at app startup. Framework recipes:
 *
 * ```tsx
 * // TanStack Router — its Link takes `to`, so map href → to:
 * import { Link } from '@tanstack/react-router'
 * setLinkComponent(({ href, ...rest }) => <Link to={href} {...rest} />)
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
