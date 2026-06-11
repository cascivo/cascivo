import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PageHeader } from './page-header'

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="My Page" />)
    expect(screen.getByText('My Page')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<PageHeader title="T" description="A description" />)
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('renders actions', () => {
    render(<PageHeader title="T" actions={<button>Save</button>} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('renders breadcrumb', () => {
    render(<PageHeader title="T" breadcrumb={<span>Home</span>} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
