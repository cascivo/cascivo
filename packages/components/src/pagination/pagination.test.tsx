import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './pagination'

describe('Pagination', () => {
  const baseProps = {
    page: 1,
    pageSize: 25,
    totalItems: 103,
    onPageChange: () => {},
  }

  it('renders a navigation landmark labelled Pagination', () => {
    render(<Pagination {...baseProps} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
  })

  it('shows the item range', () => {
    render(<Pagination {...baseProps} />)
    expect(screen.getByText('1–25 of 103 items')).toBeInTheDocument()
  })

  it('shows the range for a middle page', () => {
    render(<Pagination {...baseProps} page={3} />)
    expect(screen.getByText('51–75 of 103 items')).toBeInTheDocument()
  })

  it('clamps the range on the last page', () => {
    render(<Pagination {...baseProps} page={5} />)
    expect(screen.getByText('101–103 of 103 items')).toBeInTheDocument()
  })

  it('renders a page jumper with one option per page', () => {
    render(<Pagination {...baseProps} page={2} />)
    const jumper = screen.getByRole('combobox', { name: 'Page 2 of 5' })
    expect(jumper).toHaveValue('2')
    expect(jumper.querySelectorAll('option')).toHaveLength(5)
  })

  it('calls onPageChange when a page is selected', async () => {
    const onPageChange = vi.fn()
    render(<Pagination {...baseProps} onPageChange={onPageChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Page 1 of 5' }), '4')
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('disables previous on the first page and next on the last page', () => {
    const { rerender } = render(<Pagination {...baseProps} page={1} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
    rerender(<Pagination {...baseProps} page={5} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('navigates with previous and next buttons', async () => {
    const onPageChange = vi.fn()
    render(<Pagination {...baseProps} page={3} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('omits the page size select unless onPageSizeChange is given', () => {
    render(<Pagination {...baseProps} />)
    expect(screen.queryByRole('combobox', { name: 'Items per page' })).not.toBeInTheDocument()
  })

  it('renders default page size options and reports changes', async () => {
    const onPageSizeChange = vi.fn()
    render(<Pagination {...baseProps} onPageSizeChange={onPageSizeChange} />)
    const sizeSelect = screen.getByRole('combobox', { name: 'Items per page' })
    const values = Array.from(sizeSelect.querySelectorAll('option')).map((o) => o.value)
    expect(values).toEqual(['10', '25', '50', '100'])
    await userEvent.selectOptions(sizeSelect, '50')
    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })

  it('supports custom page size options', () => {
    render(<Pagination {...baseProps} onPageSizeChange={() => {}} pageSizeOptions={[5, 15]} />)
    const sizeSelect = screen.getByRole('combobox', { name: 'Items per page' })
    const values = Array.from(sizeSelect.querySelectorAll('option')).map((o) => o.value)
    expect(values).toEqual(['5', '15'])
  })

  it('handles zero items gracefully', () => {
    render(<Pagination {...baseProps} totalItems={0} />)
    expect(screen.getByText('0–0 of 0 items')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Page 1 of 1' })).toHaveValue('1')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('applies custom labels', () => {
    render(
      <Pagination
        {...baseProps}
        onPageSizeChange={() => {}}
        labels={{
          itemsPerPage: 'Pro Seite',
          pageOf: (page, total) => `Seite ${page} von ${total}`,
          range: (start, end, total) => `${start} bis ${end} von ${total}`,
          previous: 'Zurück',
          next: 'Weiter',
        }}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Pro Seite' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Seite 1 von 5' })).toBeInTheDocument()
    expect(screen.getByText('1 bis 25 von 103')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument()
  })

  it('merges a custom className', () => {
    render(<Pagination {...baseProps} className="custom" />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveClass('custom')
  })
})
