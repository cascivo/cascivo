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

  it('accepts nodes in title and description, not just strings', () => {
    // The deploy-console shape: a status badge beside the project name and a link in the
    // supporting line. `breadcrumb`/`actions` were always ReactNode while these two were
    // `string`, and the recipe forbids hand-composing PageHeader — so there was no
    // sanctioned way to get a link into a page title (2026-08-14 report §7).
    render(
      <PageHeader
        title={
          <>
            acme-web <span>Ready</span>
          </>
        }
        description={<a href="/c/abc123">abc123</a>}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('acme-web Ready')
    expect(screen.getByRole('link', { name: 'abc123' })).toBeInTheDocument()
  })
})
