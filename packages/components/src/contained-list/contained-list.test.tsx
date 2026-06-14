import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ContainedList, ContainedListItem } from './contained-list'

afterEach(cleanup)

describe('ContainedList', () => {
  it('renders the label as a heading and rows as a list', () => {
    const { getByRole, getAllByRole } = render(
      <ContainedList label="Members">
        <ContainedListItem>Ada</ContainedListItem>
        <ContainedListItem>Alan</ContainedListItem>
      </ContainedList>,
    )
    expect(getByRole('heading', { name: 'Members' })).toBeDefined()
    expect(getByRole('list')).toBeDefined()
    expect(getAllByRole('listitem')).toHaveLength(2)
  })

  it('defaults kind to on-page and reflects kind via data attribute', () => {
    const { container, rerender } = render(<ContainedList label="L">x</ContainedList>)
    expect(container.querySelector('[data-kind="on-page"]')).not.toBeNull()
    rerender(
      <ContainedList label="L" kind="disclosed">
        x
      </ContainedList>,
    )
    expect(container.querySelector('[data-kind="disclosed"]')).not.toBeNull()
  })

  it('renders the action slot', () => {
    const { getByText } = render(
      <ContainedList label="L" action={<span>Add</span>}>
        x
      </ContainedList>,
    )
    expect(getByText('Add')).toBeDefined()
  })

  it('ContainedListItem renders as a div by default', () => {
    const { getByText } = render(
      <ContainedList label="L">
        <ContainedListItem>Row</ContainedListItem>
      </ContainedList>,
    )
    expect(getByText('Row').tagName).toBe('DIV')
  })

  it('ContainedListItem asChild renders the slotted element', () => {
    const { getByRole } = render(
      <ContainedList label="L">
        <ContainedListItem asChild>
          <button type="button">Go</button>
        </ContainedListItem>
      </ContainedList>,
    )
    const btn = getByRole('button', { name: 'Go' })
    expect(btn.tagName).toBe('BUTTON')
  })

  it('forwards onClick to the row content', () => {
    let clicked = false
    const { getByText } = render(
      <ContainedList label="L">
        <ContainedListItem onClick={() => (clicked = true)}>Row</ContainedListItem>
      </ContainedList>,
    )
    getByText('Row').click()
    expect(clicked).toBe(true)
  })
})
