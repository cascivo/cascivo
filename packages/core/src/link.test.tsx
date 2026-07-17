import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { getLinkComponent, setLinkComponent } from './link.ts'

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
