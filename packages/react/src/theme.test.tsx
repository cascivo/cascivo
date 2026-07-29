import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { createRef } from 'react'
import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import {
  applyTheme,
  ThemeProvider,
  setTheme,
  themePreloadScript,
  themeSignal,
  useTheme,
} from './theme'

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

  it('useTheme returns a reactive [string, setter] pair (no signal handling)', () => {
    let seen = ''
    function Readout() {
      const [theme] = useTheme()
      seen = theme
      return <span data-testid="t">{theme}</span>
    }
    render(
      <ThemeProvider defaultTheme="light">
        <Readout />
      </ThemeProvider>,
    )
    // The consumer reads a plain string and re-renders on change with no `.value`.
    act(() => setTheme('pastel'))
    expect(seen).toBe('pastel')
  })

  it('themeSignal exposes the underlying signal for signal-native code', () => {
    render(<ThemeProvider defaultTheme="light" />)
    const sig = themeSignal()
    expect(sig).toBe(themeSignal()) // stable identity
    act(() => setTheme('warm'))
    expect(sig.value).toBe('warm')
  })
})

describe('ThemeProvider dev warning (unstyled: no theme CSS loaded)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  // jsdom resolves no CSS custom properties, so getComputedStyle(...).
  // getPropertyValue('--cascivo-color-accent') is always '' — the "unstyled" case.
  it('warns once, naming the themes import, when no --cascivo-color-* resolves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    try {
      render(<ThemeProvider value="dark-unstyled-test" />)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0]?.[0]).toContain('@cascivo/themes/all.css')
      // Deduped: re-asserting the same theme does not warn again.
      render(<ThemeProvider value="dark-unstyled-test" />)
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      raf.mockRestore()
      warn.mockRestore()
    }
  })

  it('stays silent when the probed token resolves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    const getComputed = vi
      .spyOn(globalThis, 'getComputedStyle')
      .mockReturnValue({ getPropertyValue: () => '#7c3aed' } as unknown as CSSStyleDeclaration)
    try {
      render(<ThemeProvider value="styled-test" />)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      getComputed.mockRestore()
      raf.mockRestore()
      warn.mockRestore()
    }
  })
})

describe('setTheme without a mounted ThemeProvider (C5)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  /** A fresh module instance, so the module-level `providerMounted` flag starts false.
   * It is deliberately module-scoped (the provider is a singleton, not context), so a
   * provider rendered by an earlier describe in this file would otherwise leak in. */
  async function freshTheme() {
    vi.resetModules()
    return await import('./theme')
  }

  it('warns that the signal updated but data-theme was not written', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    try {
      const theme = await freshTheme()
      theme.setTheme('midnight')
      // The signal updates and useTheme() would report it — that is the trap.
      expect(theme.themeSignal().value).toBe('midnight')
      // …but nothing wrote the DOM.
      expect(currentTheme()).toBeNull()
      const message = warn.mock.calls.map((c) => String(c[0])).join('\n')
      expect(message).toContain('no <ThemeProvider> is mounted')
      expect(message).toContain('applyTheme')
    } finally {
      raf.mockRestore()
      warn.mockRestore()
    }
  })

  it('stays silent when a provider is mounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    const getComputed = vi
      .spyOn(globalThis, 'getComputedStyle')
      .mockReturnValue({ getPropertyValue: () => '#7c3aed' } as unknown as CSSStyleDeclaration)
    try {
      const theme = await freshTheme()
      render(<theme.ThemeProvider storageKey={freshKey()} />)
      act(() => {
        theme.setTheme('warm')
      })
      expect(currentTheme()).toBe('warm')
      const message = warn.mock.calls.map((c) => String(c[0])).join('\n')
      expect(message).not.toContain('no <ThemeProvider> is mounted')
    } finally {
      getComputed.mockRestore()
      raf.mockRestore()
      warn.mockRestore()
    }
  })
})

describe('applyTheme (no provider, no React)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('writes data-theme directly and keeps the signal in sync', () => {
    applyTheme('cyberpunk')
    expect(currentTheme()).toBe('cyberpunk')
    expect(themeSignal().value).toBe('cyberpunk')
  })

  it('scopes to a target element when given one', () => {
    const panel = document.createElement('div')
    document.body.appendChild(panel)
    try {
      applyTheme('warm', panel)
      expect(panel.getAttribute('data-theme')).toBe('warm')
      // The document root is untouched — that is the point of a scoped write.
      expect(currentTheme()).toBeNull()
    } finally {
      panel.remove()
    }
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
