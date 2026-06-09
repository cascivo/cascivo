import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast, dismissAllToasts } from './toast'

afterEach(() => dismissAllToasts())

function Trigger({ duration }: { duration?: number }) {
  const { toast } = useToast()
  return (
    <button
      type="button"
      onClick={() => toast({ title: 'Saved', description: 'Your changes are safe', duration })}
    >
      Notify
    </button>
  )
}

describe('Toast', () => {
  it('shows a toast when triggered', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Your changes are safe')).toBeInTheDocument()
  })

  it('dismisses when the close button is clicked', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
    await screen.findByText('Saved')
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument())
  })

  it('auto-dismisses after the duration', async () => {
    render(
      <ToastProvider>
        <Trigger duration={50} />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
    await screen.findByText('Saved')
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument(), {
      timeout: 2000,
    })
  })

  it('exposes a toast function from the hook', () => {
    let api: ReturnType<typeof useToast> | undefined
    function Probe() {
      api = useToast()
      return null
    }
    render(<Probe />)
    expect(typeof api?.toast).toBe('function')
  })
})
