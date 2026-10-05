import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptSuggestions } from './prompt-suggestions'

describe('PromptSuggestions', () => {
  it('renders a named group of buttons named by their prompt', () => {
    render(<PromptSuggestions items={['Draft a note', 'Summarise']} onSelect={() => {}} />)
    const group = screen.getByRole('group', { name: 'Suggested prompts' })
    expect(group.querySelectorAll('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Draft a note' })).toHaveAttribute('type', 'button')
  })

  it('calls onSelect with the chosen prompt', async () => {
    const onSelect = vi.fn()
    render(<PromptSuggestions items={['Draft a note', 'Summarise']} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Summarise' }))
    expect(onSelect).toHaveBeenCalledWith('Summarise')
  })

  it('localises the group name', () => {
    render(<PromptSuggestions items={['A']} onSelect={() => {}} labels={{ group: 'Vorschläge' }} />)
    expect(screen.getByRole('group', { name: 'Vorschläge' })).toBeInTheDocument()
  })
})
