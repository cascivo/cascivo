import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createLocale } from '@cascivo/i18n'
import { CommandMenu, type CommandGroup } from './command-menu'

const onSelect = vi.fn()

const groups: CommandGroup[] = [
  {
    heading: 'Pages',
    items: [
      { id: 'home', label: 'Go home', keywords: ['start'], onSelect },
      { id: 'docs', label: 'Open docs', onSelect },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { id: 'theme', label: 'Toggle theme', shortcut: ['⌘', 'T'], onSelect, disabled: false },
    ],
  },
]

// jsdom doesn't fully support showModal — add a no-op if missing
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false
      this.dispatchEvent(new Event('close'))
    }
  }
})

describe('CommandMenu', () => {
  it('is closed by default; open renders dialog with all groups and headings', () => {
    const { rerender } = render(<CommandMenu open={false} onOpenChange={vi.fn()} groups={groups} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    rerender(<CommandMenu open={true} onOpenChange={vi.fn()} groups={groups} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Pages')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('typing filters: query "home" shows "Go home", hides "Open docs"', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={groups} />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'home')
    expect(screen.getByText('Go home')).toBeInTheDocument()
    expect(screen.queryByText('Open docs')).not.toBeInTheDocument()
  })

  it('keyword match: query "start" still shows "Go home"', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={groups} />)
    await user.type(screen.getByRole('combobox'), 'start')
    expect(screen.getByText('Go home')).toBeInTheDocument()
  })

  it('fuzzy subsequence: query "gh" matches "Go home"', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={groups} />)
    await user.type(screen.getByRole('combobox'), 'gh')
    expect(screen.getByText('Go home')).toBeInTheDocument()
  })

  it('empty query restores all items; no-match query renders empty text', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={groups} />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'zzzzz')
    expect(screen.queryByText('Go home')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    await user.clear(input)
    expect(screen.getByText('Go home')).toBeInTheDocument()
  })

  it('ArrowDown/Up move aria-activedescendant; Enter calls onSelect and requests close', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    onSelect.mockReset()
    render(<CommandMenu open={true} onOpenChange={onOpenChange} groups={groups} />)
    const input = screen.getByRole('combobox')
    await user.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBeTruthy()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('Escape calls onOpenChange(false)', async () => {
    const onOpenChange = vi.fn()
    render(<CommandMenu open={true} onOpenChange={onOpenChange} groups={groups} />)
    const dialog = document.querySelector('dialog')!
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('global hotkey Cmd+K toggles via onOpenChange', () => {
    const onOpenChange = vi.fn()
    render(<CommandMenu open={false} onOpenChange={onOpenChange} groups={groups} />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onOpenChange).toHaveBeenCalled()
  })

  it('hotkey={false} disables the global Cmd+K listener', () => {
    const onOpenChange = vi.fn()
    render(<CommandMenu open={false} onOpenChange={onOpenChange} groups={groups} hotkey={false} />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('locale: de builtin placeholder/empty after store.set("de")', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    await store.set('de')
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={[]} />)
    expect(screen.getByRole('combobox').getAttribute('placeholder')).toBe(
      'Befehl oder Suche eingeben…',
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    await store.set('en')
  })
})

describe('CommandMenu nested pages', () => {
  const onSelect = vi.fn()
  const pageGroups: CommandGroup[] = [
    {
      heading: 'Navigation',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          page: {
            placeholder: 'Settings…',
            groups: [
              {
                heading: 'Settings',
                items: [
                  { id: 'theme-setting', label: 'Change theme', onSelect },
                  { id: 'lang-setting', label: 'Change language', onSelect },
                ],
              },
            ],
          },
        },
        { id: 'home', label: 'Go home', onSelect },
      ],
    },
  ]

  it('selecting an item with page pushes the page and swaps placeholder', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={pageGroups} />)
    await user.click(screen.getByText('Settings'))
    expect(screen.getByPlaceholderText('Settings…')).toBeInTheDocument()
    expect(screen.getByText('Change theme')).toBeInTheDocument()
  })

  it('Backspace on empty query pops back to previous page', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={pageGroups} />)
    await user.click(screen.getByText('Settings'))
    expect(screen.getByText('Change theme')).toBeInTheDocument()
    // focus the input and press Backspace on empty query
    screen.getByRole('combobox').focus()
    await user.keyboard('{Backspace}')
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.queryByText('Change theme')).not.toBeInTheDocument()
  })

  it('loading prop renders loading row instead of empty state', () => {
    render(<CommandMenu open={true} onOpenChange={vi.fn()} groups={[]} loading={true} />)
    // container has role="status"; spinner inside also has role="status" — use getAllByRole
    const statuses = screen.getAllByRole('status')
    const container = statuses.find((el) => el.textContent?.includes('Loading'))
    expect(container).toBeTruthy()
  })

  it('onQueryChange fires per keystroke', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    render(
      <CommandMenu
        open={true}
        onOpenChange={vi.fn()}
        groups={pageGroups}
        onQueryChange={onQueryChange}
      />,
    )
    await user.type(screen.getByRole('combobox'), 'go')
    expect(onQueryChange).toHaveBeenCalledTimes(2)
    expect(onQueryChange).toHaveBeenLastCalledWith('go')
  })
})
