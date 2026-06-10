import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from './search'

describe('Search', () => {
  it('renders a searchbox with the default accessible label', () => {
    render(<Search />)
    const input = screen.getByRole('searchbox', { name: 'Search' })
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('placeholder', 'Search')
  })

  it('supports custom label, placeholder and id', () => {
    render(<Search label="Find users" placeholder="Type a name" id="user-search" />)
    const input = screen.getByRole('searchbox', { name: 'Find users' })
    expect(input).toHaveAttribute('id', 'user-search')
    expect(input).toHaveAttribute('placeholder', 'Type a name')
  })

  it('applies size and filled state attributes', () => {
    const { container } = render(<Search size="lg" defaultValue="hi" />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute('data-size', 'lg')
    expect(root).toHaveAttribute('data-state', 'filled')
  })

  it('fires onChange on every keystroke', async () => {
    const onChange = vi.fn()
    render(<Search onChange={onChange} />)
    await userEvent.type(screen.getByRole('searchbox'), 'abc')
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenLastCalledWith('abc')
  })

  it('reflects a controlled value', () => {
    const { rerender } = render(<Search value="foo" onChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('foo')
    rerender(<Search value="bar" onChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('bar')
  })

  it('is disabled when disabled prop is set', () => {
    render(<Search disabled />)
    expect(screen.getByRole('searchbox')).toBeDisabled()
  })

  describe('clear button', () => {
    it('appears only when there is a value', async () => {
      render(<Search />)
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
      await userEvent.type(screen.getByRole('searchbox'), 'a')
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
    })

    it('clears the value, fires callbacks and refocuses the input', async () => {
      const onChange = vi.fn()
      const onSearch = vi.fn()
      render(<Search defaultValue="hello" onChange={onChange} onSearch={onSearch} />)
      await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
      const input = screen.getByRole('searchbox')
      expect(input).toHaveValue('')
      expect(onChange).toHaveBeenCalledWith('')
      expect(onSearch).toHaveBeenCalledWith('')
      expect(input).toHaveFocus()
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    })

    it('uses a custom clear label', () => {
      render(<Search defaultValue="x" clearLabel="Reset" />)
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
    })
  })

  describe('debounced onSearch', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('fires once after the debounce delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onSearch = vi.fn()
      render(<Search onSearch={onSearch} />)
      await user.type(screen.getByRole('searchbox'), 'ab')
      expect(onSearch).not.toHaveBeenCalled()
      vi.advanceTimersByTime(300)
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('ab')
    })

    it('resets the pending timer on each keystroke', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onSearch = vi.fn()
      render(<Search onSearch={onSearch} />)
      const input = screen.getByRole('searchbox')
      await user.type(input, 'a')
      vi.advanceTimersByTime(200)
      await user.type(input, 'b')
      vi.advanceTimersByTime(200)
      expect(onSearch).not.toHaveBeenCalled()
      vi.advanceTimersByTime(100)
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('ab')
    })

    it('respects a custom debounceMs', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onSearch = vi.fn()
      render(<Search onSearch={onSearch} debounceMs={500} />)
      await user.type(screen.getByRole('searchbox'), 'a')
      vi.advanceTimersByTime(300)
      expect(onSearch).not.toHaveBeenCalled()
      vi.advanceTimersByTime(200)
      expect(onSearch).toHaveBeenCalledWith('a')
    })

    it('fires immediately on Enter and cancels the pending timer', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onSearch = vi.fn()
      render(<Search onSearch={onSearch} />)
      await user.type(screen.getByRole('searchbox'), 'ab{Enter}')
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('ab')
      vi.advanceTimersByTime(300)
      expect(onSearch).toHaveBeenCalledTimes(1)
    })

    it('cancels the pending timer when cleared', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onSearch = vi.fn()
      render(<Search onSearch={onSearch} />)
      await user.type(screen.getByRole('searchbox'), 'ab')
      await user.click(screen.getByRole('button', { name: 'Clear search' }))
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('')
      vi.advanceTimersByTime(300)
      expect(onSearch).toHaveBeenCalledTimes(1)
    })

    it('cancels the pending timer on unmount', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onSearch = vi.fn()
      const { unmount } = render(<Search onSearch={onSearch} />)
      await user.type(screen.getByRole('searchbox'), 'ab')
      unmount()
      vi.advanceTimersByTime(300)
      expect(onSearch).not.toHaveBeenCalled()
    })
  })
})
