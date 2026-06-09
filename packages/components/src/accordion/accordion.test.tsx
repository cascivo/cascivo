import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'

function setup(props?: { type?: 'single' | 'multiple' }) {
  render(
    <Accordion type={props?.type ?? 'single'} defaultValue="one">
      <AccordionItem value="one">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent>First content</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second content</AccordionContent>
      </AccordionItem>
    </Accordion>,
  )
}

describe('Accordion', () => {
  it('opens the default item', () => {
    setup()
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles an item open and closed', async () => {
    setup()
    const first = screen.getByRole('button', { name: 'First' })
    await userEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes the open item when another opens in single mode', async () => {
    setup({ type: 'single' })
    await userEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps multiple items open in multiple mode', async () => {
    setup({ type: 'multiple' })
    await userEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('links trigger and content via aria attributes', () => {
    setup()
    const trigger = screen.getByRole('button', { name: 'First' })
    const content = screen.getByText('First content').closest('[role="region"]')
    expect(trigger.getAttribute('aria-controls')).toBe(content?.getAttribute('id'))
  })
})
