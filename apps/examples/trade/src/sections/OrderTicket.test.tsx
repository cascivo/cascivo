import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToastProvider } from '@cascivo/react'
import { OrderTicket } from './OrderTicket'
import { book, lastPrice, selectedInstrumentId } from '../store/market'
import { cash, orders, positions } from '../store/portfolio'
import { shares, side, orderType } from '../store/ticket'

function setup() {
  selectedInstrumentId.value = 'gti'
  lastPrice.value = 10
  book.value = { bids: [{ price: 10, size: 100 }], asks: [{ price: 10.02, size: 100 }] }
  cash.value = 1000
  positions.value = [{ instrumentId: 'gti', shares: 5, costBasis: 8 }]
  orders.value = []
  side.value = 'buy'
  orderType.value = 'market'
  shares.value = null
}

beforeEach(setup)

describe('OrderTicket', () => {
  it('disables submit until a valid quantity is entered', () => {
    render(
      <ToastProvider>
        <OrderTicket />
      </ToastProvider>,
    )
    expect(screen.getByRole('button', { name: 'Buy' })).toBeDisabled()
  })

  it('reactively reflects quantity changes in the Total (useSignals guard)', async () => {
    render(
      <ToastProvider>
        <OrderTicket />
      </ToastProvider>,
    )
    shares.value = 3
    // 3 × 10.02 + 1 fee = 31.06 → "€31.06"
    await waitFor(() => expect(screen.getByText(/31\.06/)).toBeTruthy())
  })

  it('executes an order on submit and clears the quantity', async () => {
    render(
      <ToastProvider>
        <OrderTicket />
      </ToastProvider>,
    )
    shares.value = 2
    const buy = screen.getByRole('button', { name: 'Buy' })
    await waitFor(() => expect(buy).not.toBeDisabled())
    fireEvent.click(buy)
    expect(orders.value).toHaveLength(1)
    expect(orders.value[0]!.shares).toBe(2)
    expect(shares.value).toBeNull()
  })
})
