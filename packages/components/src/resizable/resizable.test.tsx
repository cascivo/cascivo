import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Resizable } from './resizable'

afterEach(cleanup)

function setup(props: Partial<React.ComponentProps<typeof Resizable>> = {}) {
  render(
    <Resizable {...props}>
      <div>Left pane</div>
      <div>Right pane</div>
    </Resizable>,
  )
}

describe('Resizable', () => {
  it('renders a separator handle with valuenow', () => {
    setup()
    const handle = screen.getByRole('separator')
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal')
    expect(handle).toHaveAttribute('aria-valuenow', '50')
    expect(handle).toHaveAttribute('aria-valuemin', '10')
    expect(handle).toHaveAttribute('aria-valuemax', '90')
  })

  it('nudges the ratio with arrow keys', async () => {
    setup()
    const handle = screen.getByRole('separator')
    handle.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(handle).toHaveAttribute('aria-valuenow', '52')
    await userEvent.keyboard('{ArrowLeft}')
    expect(handle).toHaveAttribute('aria-valuenow', '50')
  })

  it('snaps to min and max with Home/End', async () => {
    setup()
    const handle = screen.getByRole('separator')
    handle.focus()
    await userEvent.keyboard('{End}')
    expect(handle).toHaveAttribute('aria-valuenow', '90')
    await userEvent.keyboard('{Home}')
    expect(handle).toHaveAttribute('aria-valuenow', '10')
  })
})
