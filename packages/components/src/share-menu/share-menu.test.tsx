import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareMenu, shareIntentUrl } from './share-menu'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

const content = { url: 'https://a.example/post?id=1', text: 'Read this & that' }
/** Opens the panel the way the browser reports it: a `toggle` event on the popover. */
function openPanel() {
  const trigger = screen.getByRole('button', { name: /^(share|teilen)$/i })
  const panel = document.getElementById(trigger.getAttribute('popovertarget')!)!
  act(() => {
    panel.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }))
  })
  return { trigger, panel }
}

const query = (href: string | null) => Object.fromEntries(new URL(href!).searchParams)

describe('shareIntentUrl', () => {
  it('builds each network’s compose link, encoding text and url', () => {
    expect(query(shareIntentUrl('bluesky', content))).toEqual({
      text: 'Read this & that https://a.example/post?id=1',
    })
    expect(shareIntentUrl('threads', content)).toMatch(
      /^https:\/\/www\.threads\.com\/intent\/post\?/,
    )
    expect(query(shareIntentUrl('threads', content))).toEqual(content)
    expect(query(shareIntentUrl('x', content))).toEqual(content)
    // LinkedIn reads the page; it takes no text.
    expect(query(shareIntentUrl('linkedin', content))).toEqual({ url: content.url })
    expect(query(shareIntentUrl('bluesky', { url: content.url }))).toEqual({ text: content.url })
  })

  it('needs a real server for Mastodon, however it is written', () => {
    for (const server of ['mastodon.social', 'https://mastodon.social/', '@me@mastodon.social']) {
      const href = shareIntentUrl('mastodon', { ...content, server })
      expect(href).toMatch(/^https:\/\/mastodon\.social\/share\?/)
    }
    for (const server of [undefined, '', 'localhost', 'javascript:alert(1)', 'a.example:8080']) {
      expect(
        shareIntentUrl('mastodon', { ...content, ...(server !== undefined && { server }) }),
      ).toBe(null)
    }
  })
})

describe('ShareMenu', () => {
  it('server-renders a popover trigger and plain links, so it works before hydration', () => {
    const html = renderToString(<ShareMenu {...content} />)
    expect(html).toMatch(/popovertarget="[^"]+"/i)
    expect(html).toContain('popover="auto"')
    expect(html).toContain('href="https://bsky.app/intent/compose?')
    // The script-only entries wait for the client.
    expect(html).not.toContain('Copy link')
    expect(html).not.toContain('mastodon.social')
  })

  it('opens new tabs without handing them the opener', () => {
    render(<ShareMenu {...content} items={['bluesky', 'linkedin']} />)
    openPanel()
    const link = screen.getByRole('link', { name: 'Share on Bluesky' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('data-network'))).toEqual([
      'bluesky',
      'linkedin',
    ])
  })

  it('reflects the popover’s toggle in aria-expanded', () => {
    render(<ShareMenu {...content} />)
    expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute('aria-expanded', 'false')
    const { trigger, panel } = openPanel()
    expect(panel).toHaveAttribute('aria-label', 'Share')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('copies the link and confirms it', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<ShareMenu {...content} />)
    openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(writeText).toHaveBeenCalledWith(content.url)
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeTruthy()
  })

  it('offers the system share sheet only where the browser has one', () => {
    render(<ShareMenu {...content} />)
    openPanel()
    expect(screen.queryByRole('button', { name: 'More options…' })).toBeNull()
    cleanup()

    const share = vi.fn(async () => {})
    vi.stubGlobal('navigator', { ...navigator, share })
    render(<ShareMenu {...content} />)
    openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'More options…' }))
    expect(share).toHaveBeenCalledWith(content)
  })

  it('shares to the Mastodon server the person names, and remembers it', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<ShareMenu {...content} items={['mastodon']} />)
    openPanel()
    fireEvent.input(screen.getByLabelText('Your Mastodon server'), {
      target: { value: 'https://fosstodon.org/' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Share on Mastodon' }))
    expect(open).toHaveBeenCalledWith(
      shareIntentUrl('mastodon', { ...content, server: 'fosstodon.org' }),
      '_blank',
      'noopener',
    )
    cleanup()

    render(<ShareMenu {...content} items={['mastodon']} />)
    openPanel()
    expect(screen.getByLabelText('Your Mastodon server')).toHaveValue('https://fosstodon.org/')
    open.mockRestore()
  })

  it('takes per-instance labels', () => {
    render(
      <ShareMenu
        {...content}
        items={['x']}
        labels={{ share: 'Teilen', shareOn: (network) => `Auf ${network} posten` }}
      />,
    )
    openPanel()
    expect(screen.getByRole('button', { name: 'Teilen' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Auf X posten' })).toBeTruthy()
  })
})
