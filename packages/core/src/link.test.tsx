import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { getLinkComponent, setLinkComponent, type LinkComponentProps } from './link.ts'

describe('link adapter', () => {
  afterEach(() => {
    // Reset the module singleton so tests don't leak the registered component.
    setLinkComponent('a')
  })

  it('defaults to the intrinsic "a" tag', () => {
    expect(getLinkComponent()).toBe('a')
  })

  it('returns the registered component', () => {
    const Link = () => null
    setLinkComponent(Link)
    expect(getLinkComponent()).toBe(Link)
  })

  it('infers LinkComponentProps for an inline adapter (type-level, must compile)', () => {
    // A TanStack-shaped inline adapter: `href` must be inferred (string | undefined)
    // with no annotation — the ergonomic gap the 2026-07-22 adopter hit. If the
    // overload regressed, `href` would be untyped and the `to: string | undefined`
    // assignment below would not compile. We call the adapter directly (no DOM) and
    // assert the value flows through, so the test also fails loudly at runtime.
    const seen: (string | undefined)[] = []
    setLinkComponent(({ href, ...rest }) => {
      const to: string | undefined = href // proves `href` is typed, not `any`
      seen.push(to)
      return <a href={to} {...rest} />
    })
    const adapter = getLinkComponent() as (p: LinkComponentProps) => unknown
    adapter({ href: '/x', children: 'x' })
    expect(seen[0]).toBe('/x')
  })

  it('still accepts a plain component and the "a" tag (overload fallback)', () => {
    setLinkComponent('a')
    expect(getLinkComponent()).toBe('a')
    const Plain = (props: LinkComponentProps) => <a {...props} />
    setLinkComponent(Plain)
    expect(getLinkComponent()).toBe(Plain)
  })

  it('a registered component receives the forwarded anchor props', () => {
    const seen: Record<string, unknown>[] = []
    function StubLink(props: Record<string, unknown>) {
      seen.push(props)
      return <a {...props} />
    }
    setLinkComponent(StubLink)
    const Link = getLinkComponent()
    const { container } = render(
      <Link href="/dashboard" className="nav" aria-current="page" data-state="active">
        Dashboard
      </Link>,
    )
    expect(seen[0]).toMatchObject({
      href: '/dashboard',
      className: 'nav',
      'aria-current': 'page',
      'data-state': 'active',
    })
    const anchor = container.querySelector('a')!
    expect(anchor.getAttribute('href')).toBe('/dashboard')
    expect(anchor.getAttribute('aria-current')).toBe('page')
  })
})
