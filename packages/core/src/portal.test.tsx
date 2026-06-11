import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Portal } from './portal'

describe('Portal', () => {
  it('renders children into document.body', async () => {
    render(<Portal><div data-testid="portal-child">Portal content</div></Portal>)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="portal-child"]')).toBeTruthy()
    })
  })
})
