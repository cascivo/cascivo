import { beforeEach, describe, expect, it } from 'vitest'
import { book, lastPrice, selectedInstrumentId } from './market'
import { cash, orders, positions } from './portfolio'
import { canSubmit, fees, orderType, shares, sharesError, side, submit, total } from './ticket'

beforeEach(() => {
  selectedInstrumentId.value = 'gti'
  lastPrice.value = 10
  book.value = { bids: [{ price: 10, size: 100 }], asks: [{ price: 10.02, size: 100 }] }
  cash.value = 1000
  positions.value = [{ instrumentId: 'gti', shares: 5, costBasis: 8 }]
  orders.value = []
  side.value = 'buy'
  orderType.value = 'market'
  shares.value = null
})

describe('order ticket', () => {
  it('charges a flat fee only when shares are entered', () => {
    expect(fees.value).toBe(0)
    shares.value = 10
    expect(fees.value).toBe(1)
  })

  it('computes buy total as shares × ask + fee', () => {
    shares.value = 10
    expect(total.value).toBeCloseTo(10 * 10.02 + 1, 5)
  })

  it('blocks a buy that exceeds available cash', () => {
    cash.value = 50
    shares.value = 10
    expect(sharesError.value).toBe('exceeds-cash')
    expect(canSubmit.value).toBe(false)
  })

  it('blocks selling more shares than are held', () => {
    side.value = 'sell'
    shares.value = 10
    expect(sharesError.value).toBe('exceeds-holdings')
    expect(canSubmit.value).toBe(false)
  })

  it('executes a buy: appends an order, debits cash, resets shares', () => {
    shares.value = 10
    const order = submit()
    expect(order).not.toBeNull()
    expect(order!.status).toBe('executed')
    expect(order!.price).toBeCloseTo(10.02, 5)
    expect(cash.value).toBeCloseTo(1000 - (10 * 10.02 + 1), 5)
    expect(orders.value).toHaveLength(1)
    expect(shares.value).toBeNull()
    expect(positions.value.find((p) => p.instrumentId === 'gti')!.shares).toBe(15)
  })

  it('executes a sell: credits proceeds and reduces the holding', () => {
    side.value = 'sell'
    shares.value = 3
    const order = submit()
    expect(order).not.toBeNull()
    expect(cash.value).toBeCloseTo(1000 + (3 * 10 - 1), 5)
    expect(positions.value.find((p) => p.instrumentId === 'gti')!.shares).toBe(2)
  })
})
