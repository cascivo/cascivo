import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'

afterEach(cleanup)

/**
 * `<summary>` is not exposed as `role="button"` by jsdom and carries no `aria-expanded`
 * attribute — the expanded state is native. So every assertion here reads `details.open`
 * rather than the ARIA shape the old button-based implementation asserted.
 */
function itemFor(label: string): HTMLDetailsElement {
  const details = screen.getByText(label).closest('details')
  if (!details) throw new Error(`no <details> ancestor for "${label}"`)
  return details as HTMLDetailsElement
}

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
    expect(itemFor('First').open).toBe(true)
    expect(itemFor('Second').open).toBe(false)
  })

  it('toggles an item open and closed', async () => {
    setup()
    await userEvent.click(screen.getByText('First'))
    expect(itemFor('First').open).toBe(false)
    await userEvent.click(screen.getByText('First'))
    expect(itemFor('First').open).toBe(true)
  })

  it('closes the open item when another opens in single mode', async () => {
    setup({ type: 'single' })
    await userEvent.click(screen.getByText('Second'))
    expect(itemFor('Second').open).toBe(true)
    expect(itemFor('First').open).toBe(false)
  })

  it('keeps multiple items open in multiple mode', async () => {
    setup({ type: 'multiple' })
    await userEvent.click(screen.getByText('Second'))
    expect(itemFor('First').open).toBe(true)
    expect(itemFor('Second').open).toBe(true)
  })

  it('links trigger and content via aria attributes', () => {
    setup()
    const summary = screen.getByText('First').closest('summary')
    const content = screen.getByText('First content').closest('[role="region"]')
    expect(summary?.getAttribute('aria-controls')).toBe(content?.getAttribute('id'))
    expect(content?.getAttribute('aria-labelledby')).toBe(summary?.getAttribute('id'))
  })

  it('keeps each trigger a heading so heading navigation still works', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument()
  })

  it('groups items with a shared name in single mode only', () => {
    setup({ type: 'single' })
    const groupName = itemFor('First').getAttribute('name')
    expect(groupName).toBeTruthy()
    expect(itemFor('Second').getAttribute('name')).toBe(groupName)
    cleanup()
    setup({ type: 'multiple' })
    expect(itemFor('First').getAttribute('name')).toBeNull()
  })

  it('renders the open panel server-side, with no JavaScript', () => {
    const html = renderToStaticMarkup(
      <Accordion type="single" defaultValue="one">
        <AccordionItem value="one">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    expect(html).toContain('<details')
    expect(html).toContain('open')
    expect(html).toContain('First content')
  })

  it('a controlled item survives a second toggle', async () => {
    // The parent pins `value`, so the item must return to open after every user toggle.
    render(
      <Accordion type="single" value="one" onValueChange={() => {}}>
        <AccordionItem value="one">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    await userEvent.click(screen.getByText('First'))
    expect(itemFor('First').open).toBe(true)
    await userEvent.click(screen.getByText('First'))
    expect(itemFor('First').open).toBe(true)
  })
})
