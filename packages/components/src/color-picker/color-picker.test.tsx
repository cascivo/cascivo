/**
 * ColorPicker had three tests for four hundred lines of source, which is how the area came
 * to compute in HSL against an HSV gradient without anyone noticing: clicking the visibly
 * pure hue returned white, and the thumb for `#ff0000` sat halfway down the square.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from './color-picker'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** jsdom reports a zero-sized box, so pointer maths needs a real rect. */
function stubAreaRect(size = 200): void {
  Element.prototype.getBoundingClientRect = function (): DOMRect {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: size,
      bottom: size,
      width: size,
      height: size,
      toJSON: () => ({}),
    } as DOMRect
  }
}

const originalRect = Element.prototype.getBoundingClientRect
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

function axis(name: RegExp | string): HTMLInputElement {
  return screen.getByRole('slider', { name }) as HTMLInputElement
}

describe('the picking area', () => {
  it('exposes both axes as real sliders with a value', () => {
    render(<ColorPicker defaultValue="#ff0000" alpha={false} />)
    // The old build had one role="slider" with no aria-valuenow at all, which is invalid.
    expect(axis('Saturation')).toHaveValue('100')
    expect(axis('Brightness')).toHaveValue('100')
    expect(screen.getByRole('group', { name: 'Saturation and brightness' })).toBeInTheDocument()
  })

  it('returns the colour under the pointer, not a different one', () => {
    stubAreaRect(200)
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    const area = screen.getByRole('group', { name: 'Saturation and brightness' })
    // Top-right of the painted gradient is the pure hue. Under the old HSL maths this
    // returned #ffffff.
    fireEvent.pointerDown(area, { clientX: 200, clientY: 0 })
    expect(onValueChange).toHaveBeenCalledWith('#ff0000')
  })

  it('maps the bottom edge to black and the left edge to the neutral ramp', () => {
    stubAreaRect(200)
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    const area = screen.getByRole('group', { name: 'Saturation and brightness' })
    fireEvent.pointerDown(area, { clientX: 120, clientY: 200 })
    expect(onValueChange).toHaveBeenLastCalledWith('#000000')
    fireEvent.pointerDown(area, { clientX: 0, clientY: 0 })
    expect(onValueChange).toHaveBeenLastCalledWith('#ffffff')
  })

  it('places the thumb on the colour it names', () => {
    const { container } = render(<ColorPicker defaultValue="#ff0000" alpha={false} />)
    const thumb = container.querySelector('[class*="thumb"]') as HTMLElement
    // #ff0000 is s=100 v=100, so the thumb belongs at the top-right, not the middle.
    expect(thumb.style.insetInlineStart).toBe('100%')
    expect(thumb.style.insetBlockStart).toBe('0%')
  })

  it('is keyboard-reachable on both axes', () => {
    render(<ColorPicker defaultValue="#ff0000" alpha={false} />)
    // Arrow/Home/End/PageUp/PageDown stepping is the platform's, which is the point of using
    // real range inputs rather than a hand-rolled key switch — and it is also why this is
    // asserted structurally: jsdom implements neither range stepping nor layout, so a
    // `{ArrowLeft}` here moves nothing. `pnpm bare-page:check` drives the real thing.
    for (const name of ['Saturation', 'Brightness']) {
      const input = axis(name)
      expect(input.tagName).toBe('INPUT')
      expect(input.type).toBe('range')
      expect(input).not.toBeDisabled()
      expect(input.min).toBe('0')
      expect(input.max).toBe('100')
    }
  })

  it('commits an axis change to the emitted value', () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    fireEvent.change(axis('Saturation'), { target: { value: '0' } })
    // s=0 v=100 is white whatever the hue.
    expect(onValueChange).toHaveBeenLastCalledWith('#ffffff')
    fireEvent.change(axis('Brightness'), { target: { value: '0' } })
    expect(onValueChange).toHaveBeenLastCalledWith('#000000')
  })

  it('ignores a pointer press on a zero-sized area', () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />)
    const area = screen.getByRole('group', { name: 'Saturation and brightness' })
    fireEvent.pointerDown(area, { clientX: 10, clientY: 10 })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe('hue and alpha sliders', () => {
  it('changes the hue without bleeding saturation away', async () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    fireEvent.change(axis('Hue'), { target: { value: '120' } })
    expect(onValueChange).toHaveBeenLastCalledWith('#00ff00')
    fireEvent.change(axis('Hue'), { target: { value: '240' } })
    // Round-tripping through hex used to erode saturation on every step.
    expect(onValueChange).toHaveBeenLastCalledWith('#0000ff')
  })

  it('shows the alpha slider only when alpha is on', () => {
    const { rerender } = render(<ColorPicker defaultValue="#ff0000" alpha={false} />)
    expect(screen.queryByRole('slider', { name: 'Alpha' })).toBeNull()
    rerender(<ColorPicker defaultValue="#ff0000" alpha />)
    expect(screen.getByRole('slider', { name: 'Alpha' })).toBeInTheDocument()
  })

  it('emits a stable-width value as alpha changes', () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha onValueChange={onValueChange} />)
    fireEvent.change(axis('Alpha'), { target: { value: '50' } })
    expect(onValueChange).toHaveBeenLastCalledWith(expect.stringMatching(/^#ff0000[0-9a-f]{2}$/))
    fireEvent.change(axis('Alpha'), { target: { value: '100' } })
    // The old build dropped the alpha pair at full opacity, so the width changed under the
    // caller's feet.
    expect(onValueChange).toHaveBeenLastCalledWith('#ff0000ff')
  })
})

describe('format', () => {
  it('emits hex, rgb or hsl as asked', () => {
    for (const [format, expected] of [
      ['hex', '#00ff00'],
      ['rgb', 'rgb(0 255 0)'],
      ['hsl', 'hsl(120 100% 50%)'],
    ] as const) {
      const onValueChange = vi.fn()
      render(
        <ColorPicker
          defaultValue="#ff0000"
          alpha={false}
          format={format}
          onValueChange={onValueChange}
        />,
      )
      fireEvent.change(axis('Hue'), { target: { value: '120' } })
      expect(onValueChange, format).toHaveBeenLastCalledWith(expected)
      cleanup()
    }
  })

  it('accepts a controlled value in any notation', () => {
    render(<ColorPicker value="rgb(255 0 0)" onValueChange={() => {}} alpha={false} />)
    expect(axis('Saturation')).toHaveValue('100')
    expect(axis('Hue')).toHaveValue('0')
  })
})

describe('the hex field', () => {
  it('does not emit while the value is being typed', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    const field = screen.getByRole('textbox')
    await user.clear(field)
    await user.type(field, '#00ff00')
    // The old build committed every keystroke, and an unparseable prefix fell back to black,
    // so the area thrashed while the user typed.
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('commits on Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    const field = screen.getByRole('textbox')
    await user.clear(field)
    await user.type(field, '#00ff00{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('#00ff00')
  })

  it('commits on blur', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    const field = screen.getByRole('textbox')
    await user.clear(field)
    await user.type(field, '#0000ff')
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith('#0000ff')
  })

  it('rejects an unparseable value instead of falling back to black', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    const field = screen.getByRole('textbox')
    await user.clear(field)
    await user.type(field, 'nonsense{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(field).toHaveValue('#ff0000')
  })

  it('Escape abandons the draft', async () => {
    const user = userEvent.setup()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} />)
    const field = screen.getByRole('textbox')
    await user.clear(field)
    await user.type(field, '#00ff00{Escape}')
    expect(field).toHaveValue('#ff0000')
  })
})

describe('presets', () => {
  const presets = ['#ff0000', '#00ff00', '#0000ff']

  it('renders a correctly named group', () => {
    render(<ColorPicker defaultValue="#ff0000" presets={presets} />)
    // The old build labelled this group "Saturation and lightness".
    expect(screen.getByRole('group', { name: 'Preset colors' })).toBeInTheDocument()
  })

  it('selects a preset on click', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ColorPicker
        defaultValue="#ff0000"
        alpha={false}
        presets={presets}
        onValueChange={onValueChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: '#00ff00' }))
    expect(onValueChange).toHaveBeenCalledWith('#00ff00')
  })

  it('marks the selected preset regardless of notation', () => {
    render(<ColorPicker value="#F00" onValueChange={() => {}} alpha={false} presets={presets} />)
    // String equality used to miss #F00 against a selected #ff0000.
    expect(screen.getByRole('button', { name: '#ff0000' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('moves focus between swatches with the arrows rather than changing the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" presets={presets} onValueChange={onValueChange} />)
    const group = screen.getByRole('group', { name: 'Preset colors' })
    const first = within(group).getByRole('button', { name: '#ff0000' })
    first.focus()
    await user.keyboard('{ArrowRight}')
    expect(within(group).getByRole('button', { name: '#00ff00' })).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('renders nothing when no presets are given', () => {
    render(<ColorPicker defaultValue="#ff0000" />)
    expect(screen.queryByRole('group', { name: 'Preset colors' })).toBeNull()
  })
})

describe('eyedropper', () => {
  it('is absent when the browser does not support it', () => {
    render(<ColorPicker defaultValue="#ff0000" />)
    expect(screen.queryByRole('button', { name: /Pick a color/ })).toBeNull()
  })

  it('applies the picked colour', async () => {
    const open = vi.fn().mockResolvedValue({ sRGBHex: '#00ff00' })
    vi.stubGlobal(
      'EyeDropper',
      class {
        open = open
      },
    )
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" alpha={false} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: /Pick a color/ }))
    expect(open).toHaveBeenCalled()
    expect(onValueChange).toHaveBeenCalledWith('#00ff00')
  })

  it('survives the user dismissing the picker', async () => {
    vi.stubGlobal(
      'EyeDropper',
      class {
        open = vi.fn().mockRejectedValue(new Error('AbortError'))
      },
    )
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: /Pick a color/ }))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe('form, disabled and naming', () => {
  it('emits a hidden input carrying the value', () => {
    const { container } = render(<ColorPicker defaultValue="#ff0000" alpha={false} name="brand" />)
    expect(container.querySelector('input[type="hidden"][name="brand"]')).toHaveValue('#ff0000')
  })

  it('disables every control', () => {
    render(<ColorPicker defaultValue="#ff0000" presets={['#00ff00']} disabled />)
    expect(axis('Saturation')).toBeDisabled()
    expect(axis('Hue')).toBeDisabled()
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: '#00ff00' })).toBeDisabled()
  })

  it('lets a Field name the text input and suppresses its own fallback', () => {
    render(
      <>
        <span id="outside">Brand colour</span>
        <ColorPicker defaultValue="#ff0000" aria-labelledby="outside" />
      </>,
    )
    const field = screen.getByRole('textbox')
    expect(field).toHaveAttribute('aria-labelledby', 'outside')
    expect(field).not.toHaveAttribute('aria-label')
  })

  it('announces the current colour in a live region mounted up front', () => {
    render(<ColorPicker defaultValue="#ff0000" alpha={false} />)
    const live = screen
      .getAllByRole('status', { hidden: true })
      .find((el) => el.getAttribute('aria-live') === 'polite')
    expect(live).toHaveTextContent('#ff0000')
  })

  it('applies the size attribute', () => {
    const { container } = render(<ColorPicker defaultValue="#ff0000" size="lg" />)
    expect(container.querySelector('[data-size="lg"]')).toBeInTheDocument()
  })
})
