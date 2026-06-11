import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NotificationCenter } from './notification-center'

describe('NotificationCenter', () => {
  it('renders without crashing', () => {
    render(<NotificationCenter />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })
})
