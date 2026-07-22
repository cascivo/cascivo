import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { createRef } from 'react'
import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { ThemeProvider, setTheme, themePreloadScript, useTheme } from './theme'

function currentTheme(): string | null {
  return document.documentElement.getAttribute('data-theme')
}

let keySeq = 0
/** A fresh storageKey per test so the module theme singleton rebuilds (the same
 * mechanism ThemeProvider uses when the key changes). */
function freshKey(): string {
  return `theme-test-${keySeq++}`
}

type MediaMock = (query: string) => Pick<MediaQueryList, 'matches' | 'media'>
function mockMatchMedia(scheme: 'dark' | 'light' | 'none'): void {
  ;(window as unknown as { matchMedia?: MediaMock }).matchMedia = (query: string) => ({
    matches: scheme !== 'none' && query.includes(`prefers-color-scheme: ${scheme}`),
    media: query,
  })
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('applies the default theme to <html> via data-theme', () => {
    render(<ThemeProvider defaultTheme="dark" />)
    expect(currentTheme()).toBe('dark')
  })

  it('setTheme updates the attribute reactively', () => {
    render(<ThemeProvider defaultTheme="light" />)
    act(() => setTheme('warm'))
    expect(currentTheme()).toBe('warm')
  })

  it('persists the choice to localStorage under the given key', () => {
    render(<ThemeProvider storageKey="my-theme" />)
    act(() => setTheme('midnight'))
    const raw = localStorage.getItem('my-theme')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ value: 'midnight' })
  })

  it('mirrors a controlled `value` prop', () => {
    const { rerender } = render(<ThemeProvider value="corporate" />)
    expect(currentTheme()).toBe('corporate')
    rerender(<ThemeProvider value="terminal" />)
    expect(currentTheme()).toBe('terminal')
  })

  it('writes a custom attribute when configured', () => {
    render(<ThemeProvider value="dark" attribute="data-mode" />)
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
  })

  it('useTheme exposes a reactive [signal, setter] pair', () => {
    let seen = ''
    function Readout() {
      const [theme] = useTheme()
      seen = theme.value
      return <span data-testid="t">{theme.value}</span>
    }
    render(
      <ThemeProvider defaultTheme="light">
        <Readout />
      </ThemeProvider>,
    )
    act(() => setTheme('pastel'))
    expect(seen).toBe('pastel')
  })
})

describe('ThemeProvider initial-theme precedence', () => {
  const original = (window as unknown as { matchMedia?: unknown }).matchMedia
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
  afterEach(() => {
    ;(window as unknown as { matchMedia?: unknown }).matchMedia = original
  })

  it('persisted value beats an explicit defaultTheme', () => {
    const key = freshKey()
    localStorage.setItem(key, JSON.stringify({ v: 1, value: 'warm' }))
    mockMatchMedia('dark')
    render(<ThemeProvider storageKey={key} defaultTheme="dark" />)
    expect(currentTheme()).toBe('warm')
  })

  it('an explicit defaultTheme beats OS preference (custom theme kept)', () => {
    mockMatchMedia('dark')
    render(<ThemeProvider storageKey={freshKey()} defaultTheme="midnight" />)
    expect(currentTheme()).toBe('midnight')
  })

  it('follows OS preference when no defaultTheme is given', () => {
    mockMatchMedia('dark')
    render(<ThemeProvider storageKey={freshKey()} />)
    expect(currentTheme()).toBe('dark')
  })

  it('falls back to light with no defaultTheme and no OS signal', () => {
    mockMatchMedia('none')
    render(<ThemeProvider storageKey={freshKey()} />)
    expect(currentTheme()).toBe('light')
  })
})

describe('ThemeProvider SSR (controlled value emits an attribute-setter script)', () => {
  it('renders an inline setter for a controlled value on the server', () => {
    const html = renderToString(<ThemeProvider value="dark">app</ThemeProvider>)
    expect(html).toContain('<script')
    expect(html).toContain('document.documentElement.setAttribute("data-theme","dark")')
    expect(html).toContain('app')
  })

  it('honors a custom attribute in the emitted script', () => {
    const html = renderToString(<ThemeProvider value="dark" attribute="data-mode" />)
    expect(html).toContain('setAttribute("data-mode","dark")')
  })

  it('escapes a hostile value so it cannot break out of the script element', () => {
    const html = renderToString(<ThemeProvider value={'"/><script>alert(1)</script>'} />)
    // No raw closing tag from the injected value; `<` is unicode-escaped.
    expect(html).not.toContain('</script>alert')
    expect(html).toContain('\\u003c')
  })

  it('emits NO script for the uncontrolled (persisted) flow', () => {
    const html = renderToString(<ThemeProvider defaultTheme="dark">app</ThemeProvider>)
    expect(html).not.toContain('<script')
    expect(html).toContain('app')
  })

  it('emits NO script for a target-scoped controlled provider', () => {
    const ref = createRef<HTMLDivElement>()
    const html = renderToString(<ThemeProvider value="dark" target={ref} />)
    expect(html).not.toContain('<script')
  })
})

describe('themePreloadScript', () => {
  it('references the configured key and attribute', () => {
    const script = themePreloadScript({
      storageKey: 'k',
      attribute: 'data-x',
      defaultTheme: 'dark',
    })
    expect(script).toContain('"k"')
    expect(script).toContain('"data-x"')
    expect(script).toContain('"dark"')
    // Reads the persistedSignal envelope shape.
    expect(script).toContain("'value'in e")
  })

  it('defaults to cascivo-theme / data-theme', () => {
    const script = themePreloadScript()
    expect(script).toContain('"cascivo-theme"')
    expect(script).toContain('"data-theme"')
  })

  it('omits the OS check when an explicit defaultTheme is given', () => {
    expect(themePreloadScript({ defaultTheme: 'dark' })).not.toContain('prefers-color-scheme')
  })

  it('includes the OS check when no defaultTheme is given', () => {
    expect(themePreloadScript()).toContain('prefers-color-scheme')
  })

  describe('evaluated in the document', () => {
    const original = (window as unknown as { matchMedia?: unknown }).matchMedia
    beforeEach(() => {
      localStorage.clear()
      document.documentElement.removeAttribute('data-theme')
    })
    afterEach(() => {
      ;(window as unknown as { matchMedia?: unknown }).matchMedia = original
    })
    const run = (script: string): void => {
      new Function(script)()
    }

    it('explicit defaultTheme wins over OS on a fresh visit', () => {
      mockMatchMedia('light')
      run(themePreloadScript({ defaultTheme: 'dark' }))
      expect(currentTheme()).toBe('dark')
    })

    it('follows OS when no defaultTheme and nothing persisted', () => {
      mockMatchMedia('dark')
      run(themePreloadScript())
      expect(currentTheme()).toBe('dark')
    })

    it('persisted envelope wins over everything', () => {
      localStorage.setItem('cascivo-theme', JSON.stringify({ v: 1, value: 'warm' }))
      mockMatchMedia('dark')
      run(themePreloadScript({ defaultTheme: 'dark' }))
      expect(currentTheme()).toBe('warm')
    })
  })
})
