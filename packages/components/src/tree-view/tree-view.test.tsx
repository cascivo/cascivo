import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeView, type TreeNode } from './tree-view'

const items: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'index', label: 'index.ts' },
      {
        id: 'components',
        label: 'components',
        children: [{ id: 'button', label: 'button.tsx' }],
      },
    ],
  },
  { id: 'readme', label: 'readme.md' },
]

afterEach(cleanup)

/** Find a treeitem by its own label text (the parent's name concatenates descendants). */
function item(label: string): HTMLElement {
  const el = screen.getByText(label, { selector: '[class*="label"]' }).closest('[role="treeitem"]')
  if (!el) throw new Error(`No treeitem for label ${label}`)
  return el as HTMLElement
}

describe('TreeView', () => {
  it('renders a tree with top-level treeitems', () => {
    render(<TreeView items={items} aria-label="Files" />)
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /src/ })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /readme\.md/ })).toBeInTheDocument()
  })

  it('marks branch nodes with aria-expanded reflecting expanded state', () => {
    render(<TreeView items={items} defaultExpanded={['src']} />)
    expect(item('src')).toHaveAttribute('aria-expanded', 'true')
    // child is visible
    expect(item('index.ts')).toBeInTheDocument()
  })

  it('exposes aria-level / posinset / setsize', () => {
    render(<TreeView items={items} defaultExpanded={['src']} />)
    const src = item('src')
    expect(src).toHaveAttribute('aria-level', '1')
    expect(src).toHaveAttribute('aria-setsize', '2')
    expect(src).toHaveAttribute('aria-posinset', '1')
    expect(item('index.ts')).toHaveAttribute('aria-level', '2')
  })

  it('expands a collapsed branch with ArrowRight', async () => {
    render(<TreeView items={items} />)
    const src = screen.getByRole('treeitem', { name: /src/ })
    expect(src).toHaveAttribute('aria-expanded', 'false')
    src.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(src).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses an expanded branch with ArrowLeft', async () => {
    render(<TreeView items={items} defaultExpanded={['src']} />)
    const src = screen.getByRole('treeitem', { name: /src/ })
    src.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(src).toHaveAttribute('aria-expanded', 'false')
  })

  it('moves focus down and up between visible nodes', async () => {
    render(<TreeView items={items} defaultExpanded={['src']} />)
    const src = item('src')
    src.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(item('index.ts')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(src).toHaveFocus()
  })

  it('selects a node with Enter and reports it', async () => {
    const picks: (string | string[])[] = []
    render(<TreeView items={items} onSelectChange={(s) => picks.push(s)} />)
    const readme = screen.getByRole('treeitem', { name: /readme\.md/ })
    readme.focus()
    await userEvent.keyboard('{Enter}')
    expect(readme).toHaveAttribute('aria-selected', 'true')
    expect(picks).toEqual(['readme'])
  })

  it('supports multi selection', async () => {
    render(<TreeView selectionMode="multi" items={items} defaultExpanded={['src']} />)
    await userEvent.click(item('index.ts'))
    await userEvent.click(item('readme.md'))
    expect(item('index.ts')).toHaveAttribute('aria-selected', 'true')
    expect(item('readme.md')).toHaveAttribute('aria-selected', 'true')
  })

  it('toggles a branch open and closed on click', async () => {
    render(<TreeView items={items} />)
    const src = screen.getByRole('treeitem', { name: /src/ })
    await userEvent.click(within(src).getByText('src'))
    expect(src).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(within(src).getByText('src'))
    expect(src).toHaveAttribute('aria-expanded', 'false')
  })

  it('jumps to a node via typeahead', async () => {
    render(<TreeView items={items} defaultExpanded={['src']} />)
    const src = screen.getByRole('treeitem', { name: /src/ })
    src.focus()
    await userEvent.keyboard('r')
    expect(screen.getByRole('treeitem', { name: /readme\.md/ })).toHaveFocus()
  })
})
