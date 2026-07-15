import { describe, expect, it, beforeEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { ThemeProvider, setTheme, themePreloadScript, useTheme } from './theme'

function currentTheme(): string | null {
  return document.documentElement.getAttribute('data-theme')
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
})
