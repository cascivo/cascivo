import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagsInput } from './tags-input'
import { Field } from '../field/field'

describe('TagsInput', () => {
  it('renders existing tags', () => {
    render(<TagsInput value={['react', 'vue']} onValueChange={() => {}} />)
    expect(screen.getByText('react')).toBeTruthy()
    expect(screen.getByText('vue')).toBeTruthy()
  })

  it('renders an input', () => {
    render(<TagsInput value={[]} onValueChange={() => {}} />)
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('shows placeholder when no tags', () => {
    render(<TagsInput value={[]} onValueChange={() => {}} placeholder="Add tag…" />)
    expect(screen.getByPlaceholderText('Add tag…')).toBeTruthy()
  })

  it('adds tag on Enter', async () => {
    const handler = vi.fn()
    render(<TagsInput value={[]} onValueChange={handler} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    await userEvent.keyboard('{Enter}')
    expect(handler).toHaveBeenCalledWith(['hello'])
  })

  it('adds tag on comma', async () => {
    const handler = vi.fn()
    render(<TagsInput value={[]} onValueChange={handler} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'world,')
    expect(handler).toHaveBeenCalledWith(['world'])
  })

  it('removes last tag on Backspace when input empty', async () => {
    const handler = vi.fn()
    render(<TagsInput value={['a', 'b']} onValueChange={handler} />)
    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.keyboard('{Backspace}')
    expect(handler).toHaveBeenCalledWith(['a'])
  })

  it('renders dismiss buttons for each tag', () => {
    render(<TagsInput value={['react', 'vue']} onValueChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('calls onValueChange when dismiss clicked', async () => {
    const handler = vi.fn()
    render(<TagsInput value={['react']} onValueChange={handler} />)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledWith([])
  })

  it('does not add duplicate tags', async () => {
    const handler = vi.fn()
    render(<TagsInput value={['hello']} onValueChange={handler} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    await userEvent.keyboard('{Enter}')
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not add tags beyond max', async () => {
    const handler = vi.fn()
    render(<TagsInput value={['a', 'b']} onValueChange={handler} max={2} />)
    await userEvent.type(screen.getByRole('textbox'), 'c')
    await userEvent.keyboard('{Enter}')
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not add tag when validate returns false', async () => {
    const handler = vi.fn()
    render(<TagsInput value={[]} onValueChange={handler} validate={(t) => t.length > 3} />)
    await userEvent.type(screen.getByRole('textbox'), 'ab')
    await userEvent.keyboard('{Enter}')
    expect(handler).not.toHaveBeenCalled()
  })

  it('is disabled when disabled prop set', () => {
    render(<TagsInput value={[]} onValueChange={() => {}} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

/**
 * The accessible name must come from the composition the library prescribes.
 *
 * The inner `<input>` carried a hardcoded `aria-label="Tags"`, and because `aria-label`
 * outranks a `<label for>` association it won even inside a `Field` — so a field labelled
 * "Production domains" produced a control named "Tags", with the Field's hint unannounced.
 * A WCAG 1.3.1/4.1.2 failure in a system advertising 2.2 AA (2026-08-22 report item 16).
 */
describe('TagsInput accessible name', () => {
  it('takes its name from a wrapping Field, not the built-in', () => {
    render(
      <Field label="Production domains" hint="One per line">
        <TagsInput value={['acme.com']} onValueChange={() => {}} />
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Production domains' })).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: 'Tags' })).toBeNull()
  })

  it('wires the Field hint into aria-describedby on the focusable control', () => {
    render(
      <Field label="Production domains" hint="One per line">
        <TagsInput value={[]} onValueChange={() => {}} />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Production domains' })
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toContain('One per line')
  })

  it('still has the built-in name when nothing else names it', () => {
    render(<TagsInput value={[]} onValueChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveProperty('ariaLabel')
    expect(screen.getByRole('textbox').getAttribute('aria-label')).toBeTruthy()
  })

  it('accepts ariaLabel and the `label` alias, both beating the built-in', () => {
    const { unmount } = render(
      <TagsInput value={[]} onValueChange={() => {}} ariaLabel="Domains" />,
    )
    expect(screen.getByRole('textbox', { name: 'Domains' })).toBeTruthy()
    unmount()
    render(<TagsInput value={[]} onValueChange={() => {}} label="Aliases" />)
    expect(screen.getByRole('textbox', { name: 'Aliases' })).toBeTruthy()
  })
})
