import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageWithBreadcrumb } from './page-with-breadcrumb'

describe('PageWithBreadcrumb', () => {
  it('renders without crashing', () => {
    render(<PageWithBreadcrumb />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
