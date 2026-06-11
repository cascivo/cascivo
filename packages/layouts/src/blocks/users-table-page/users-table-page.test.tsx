import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UsersTablePage } from './users-table-page'

describe('UsersTablePage', () => {
  it('renders without crashing', () => {
    render(<UsersTablePage />)
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
  })
})
