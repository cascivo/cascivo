import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies variant data attribute', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'destructive')
  })

  it('applies size data attribute', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg')
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows spinner and disables when loading', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const handler = vi.fn()
    render(
      <Button disabled onClick={handler}>
        Click
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('renders the child element with button styling when asChild', () => {
    render(
      <Button asChild variant="secondary" size="lg">
        <a href="https://example.com">Visit</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Visit' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('data-variant', 'secondary')
    expect(link).toHaveAttribute('data-size', 'lg')
    // no native <button> is rendered in asChild mode
    expect(screen.queryByRole('button')).toBeNull()
  })

  /*
   * The per-variant background knobs.
   *
   * These are asserted against the CSS source rather than a rendered element because jsdom
   * does not apply a CSS Module's cascade — `getComputedStyle` would return the empty string
   * for every one of them and the test would pass no matter what the stylesheet said. The
   * real computed-style leg is `pnpm computed:check`, which runs in a browser.
   *
   * What matters here is the SHAPE: a component token first, its semantic default second.
   * Dropping the fallback would silently unstyle every button in every app that has not set
   * the token — the whole catalog, on upgrade.
   */
  describe('per-variant background tokens', () => {
    // All whitespace stripped: the longer declarations wrap across lines, and a test that
    // depended on where the formatter chose to break them would fail on `vp check --fix`.
    const css = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'button.module.css'),
      'utf8',
    ).replace(/\s+/g, '')

    const PAIRS: [token: string, fallback: string][] = [
      ['--cascivo-button-primary-bg', 'var(--cascivo-color-primary)'],
      ['--cascivo-button-primary-bg-hover', 'var(--cascivo-color-primary-hover)'],
      ['--cascivo-button-primary-bg-active', 'var(--cascivo-color-primary-active)'],
      ['--cascivo-button-secondary-bg', 'var(--cascivo-color-secondary)'],
      ['--cascivo-button-secondary-bg-hover', 'var(--cascivo-color-secondary-hover)'],
      ['--cascivo-button-ghost-bg', 'transparent'],
      ['--cascivo-button-ghost-bg-hover', 'var(--cascivo-color-bg-subtle)'],
      ['--cascivo-button-destructive-bg', 'var(--cascivo-color-destructive)'],
      ['--cascivo-button-destructive-bg-hover', 'var(--cascivo-color-destructive-hover)'],
    ]

    it.each(PAIRS)('%s falls back to its semantic default', (token, fallback) => {
      expect(css).toContain(`var(${token},${fallback})`)
    })

    it('declares every knob in the manifest, so it reaches registry.json and the docs', async () => {
      const { meta } = await import('./button.meta')
      for (const [token] of PAIRS) expect(meta.tokens).toContain(token)
    })

    it('leaves the foreground on the semantic tier', () => {
      // Deliberate and documented: these knobs move the background only. A per-variant
      // foreground is a separate API decision, and a background set without checking the
      // paired `--cascivo-color-*-fg` can fail contrast — the manifest says so too.
      expect(css).toContain('color:var(--cascivo-color-primary-fg)')
      expect(css).not.toMatch(/--cascivo-button-[a-z]+-fg/)
    })
  })
})
