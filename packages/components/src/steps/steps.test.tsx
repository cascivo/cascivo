import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Steps } from './steps'

const defaultSteps = [{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]

describe('Steps', () => {
  it('renders the correct number of list items', () => {
    render(<Steps steps={defaultSteps} activeStep={0} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('item at activeStep has data-state="active" and aria-current="step"', () => {
    render(<Steps steps={defaultSteps} activeStep={1} />)
    const items = screen.getAllByRole('listitem')
    expect(items[1]).toHaveAttribute('data-state', 'active')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
  })

  it('items before activeStep have data-state="complete"', () => {
    render(<Steps steps={defaultSteps} activeStep={2} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('data-state', 'complete')
    expect(items[1]).toHaveAttribute('data-state', 'complete')
  })

  it('items after activeStep have data-state="pending"', () => {
    render(<Steps steps={defaultSteps} activeStep={0} />)
    const items = screen.getAllByRole('listitem')
    expect(items[1]).toHaveAttribute('data-state', 'pending')
    expect(items[2]).toHaveAttribute('data-state', 'pending')
  })

  it('explicit step.state overrides the derived state', () => {
    const stepsWithOverride = [
      { label: 'Step 1' },
      { label: 'Step 2', state: 'error' as const },
      { label: 'Step 3' },
    ]
    render(<Steps steps={stepsWithOverride} activeStep={0} />)
    const items = screen.getAllByRole('listitem')
    // step 1 would normally be active (index 0), but step 2 has explicit 'error'
    expect(items[1]).toHaveAttribute('data-state', 'error')
  })

  it('renders data-state="error" when step.state is "error"', () => {
    const stepsWithError = [
      { label: 'Upload' },
      { label: 'Validate', state: 'error' as const },
      { label: 'Process' },
    ]
    render(<Steps steps={stepsWithError} activeStep={1} />)
    const items = screen.getAllByRole('listitem')
    expect(items[1]).toHaveAttribute('data-state', 'error')
  })

  it('active item does not have aria-current when it is not active', () => {
    render(<Steps steps={defaultSteps} activeStep={0} />)
    const items = screen.getAllByRole('listitem')
    expect(items[1]).not.toHaveAttribute('aria-current')
    expect(items[2]).not.toHaveAttribute('aria-current')
  })
})
