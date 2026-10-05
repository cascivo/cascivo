import { describe, expect, it } from 'vitest'
import { Body, Button, Html, Img, Link, Preview, Text } from '../components/index.ts'
import { renderEmail } from '../render/render.tsx'
import { checkLinks } from './links.ts'

function linkTo(href: string) {
  return checkLinks(`<p><a href="${href}">Go</a></p>`)
}

describe('checkLinks', () => {
  it('passes real https, mailto and tel links', () => {
    expect(linkTo('https://acme.io/start?a=1&amp;b=2')).toEqual([])
    expect(linkTo('mailto:hi@acme.io')).toEqual([])
    expect(linkTo('tel:+4930123456')).toEqual([])
  })

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['#', 'hash'],
    ['/account', 'relative'],
    ['javascript:alert(1)', 'unsafe-scheme'],
    ['java\tscript:alert(1)', 'unsafe-scheme'],
    ['data:text/html,hi', 'unsafe-scheme'],
    ['https://acme.io/{{token}}', 'template-variable'],
    ['https://acme.io/reset/{token}', 'template-variable'],
    ['https://acme.io/?u=*|EMAIL|*', 'template-variable'],
    ['https://acme.io/${id}', 'template-variable'],
    ['https://acme.io/%7B%7Bid%7D%7D', 'template-variable'],
    ['https://example.com/reset', 'placeholder-host'],
    ['https://www.example.org', 'placeholder-host'],
    ['https://shop.invalid/x', 'placeholder-host'],
  ])('blocks %j as %s', (href, problem) => {
    expect(linkTo(href)).toEqual([expect.objectContaining({ level: 'blocked', problem })])
  })

  it.each([
    ['#pricing', 'fragment'],
    ['http://localhost:5173/verify', 'local-host'],
    ['http://127.0.0.1/x', 'local-host'],
    ['https://app.acme.test/x', 'local-host'],
    ['http://acme.io', 'insecure'],
  ])('reports %j as a %s caveat', (href, problem) => {
    expect(linkTo(href)).toEqual([expect.objectContaining({ level: 'caveat', problem })])
  })

  it('does not take percent-encoded text for a merge tag', () => {
    expect(linkTo('https://acme.io/%C3%A9t%C3%A9')).toEqual([])
  })

  it('treats an <a> without href as an anchor, an <img> without src as broken', () => {
    expect(checkLinks('<a name="top"></a>')).toEqual([])
    expect(checkLinks('<img alt="Logo">')).toEqual([
      expect.objectContaining({ problem: 'empty', element: 'img' }),
    ])
  })

  it('checks image sources', () => {
    expect(checkLinks('<img src="https://example.com/logo.png" alt="">')).toEqual([
      expect.objectContaining({ problem: 'placeholder-host', element: 'img' }),
    ])
  })

  it('ignores links inside conditional comments', () => {
    expect(
      checkLinks('<!--[if mso]><v:roundrect href="#"></v:roundrect><a href="#"><![endif]-->'),
    ).toEqual([])
  })

  it('reports leftover lorem ipsum as a caveat', () => {
    expect(checkLinks('<p>Lorem ipsum dolor sit amet</p>')).toEqual([
      expect.objectContaining({ level: 'caveat', problem: 'lorem-ipsum', element: 'text' }),
    ])
  })

  it('lists blocked findings first', () => {
    const levels = checkLinks('<a href="http://acme.io">a</a><a href="#">b</a>').map((f) => f.level)
    expect(levels).toEqual(['blocked', 'caveat'])
  })

  it('finds every URL in a rendered email, decoded', () => {
    const { html } = renderEmail(
      <Html>
        <Body>
          <Preview>Hi</Preview>
          <Text>
            <Link href="https://acme.io/a?x=1&y=2">ok</Link>
          </Text>
          <Button href="https://example.com/start">Start</Button>
          <Img src="http://localhost/logo.png" alt="Logo" width={64} height={64} />
        </Body>
      </Html>,
    )
    expect(checkLinks(html).map((f) => [f.problem, f.value])).toEqual([
      ['placeholder-host', 'https://example.com/start'],
      ['local-host', 'http://localhost/logo.png'],
    ])
  })
})
