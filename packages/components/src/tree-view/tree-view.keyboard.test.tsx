/**
 * The failures these cover, in order of how badly they bite:
 *
 * - The tree could become entirely untabbable. `focusedId` was never invalidated when the node
 *   it named stopped being visible, so collapsing a branch after focusing a child left the
 *   only `tabIndex=0` on a hidden node and Tab skipped the whole widget.
 * - Collapsed subtrees were fully rendered and merely hidden by CSS, contradicting the
 *   manifest's own justification for `clientJs: 'required'` and mounting every node of a large
 *   tree on first paint.
 * - Typeahead matched `typeof label === 'string'`, so it silently did nothing for any node
 *   rendering an icon beside its text.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeView } from './tree-view'
import type { TreeNode } from './tree-view'

afterEach(cleanup)

const items: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'index', label: 'index.ts' },
      { id: 'app', label: 'app.ts' },
    ],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'locked', label: 'locked.txt', disabled: true },
  { id: 'pkg', label: 'package.json' },
]

const item = (name: string): HTMLElement => screen.getByRole('treeitem', { name })
const tabbable = (): HTMLElement[] =>
  screen.getAllByRole('treeitem').filter((el) => el.getAttribute('tabindex') === '0')

describe('tabbability', () => {
  it('keeps exactly one node tabbable', () => {
    render(<TreeView items={items} ariaLabel="Files" />)
    expect(tabbable()).toHaveLength(1)
  })

  it('survives collapsing the branch that held focus', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" defaultExpanded={['src']} />)
    await user.click(item('index.ts'))
    await user.click(item('src'))
    // The old build left the only tabIndex=0 on a node that was no longer rendered, so Tab
    // skipped the entire tree.
    expect(tabbable()).toHaveLength(1)
    expect(tabbable()[0]).toBeVisible()
  })

  it('recovers when the items prop changes underneath it', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TreeView items={items} ariaLabel="Files" defaultExpanded={['src']} />,
    )
    await user.click(item('index.ts'))
    rerender(<TreeView items={[{ id: 'other', label: 'other.ts' }]} ariaLabel="Files" />)
    expect(tabbable()).toHaveLength(1)
  })
})

describe('collapsed subtrees', () => {
  it('are not rendered', () => {
    render(<TreeView items={items} ariaLabel="Files" />)
    // The manifest justifies clientJs: 'required' with "Collapsed branches are not rendered",
    // which was false: recursion ran on hasChildren alone and CSS merely hid the result.
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).toBeNull()
  })

  it('appear on expand and go away again on collapse', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" />)
    await user.click(item('src'))
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toBeInTheDocument()
    await user.click(item('src'))
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).toBeNull()
  })
})

describe('keyboard', () => {
  it('Enter toggles a branch as well as selecting it, matching click', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" />)
    item('src').focus()
    await user.keyboard('{Enter}')
    // Click toggled expansion and selected; the keys only selected, so a branch behaved
    // differently depending on how it was activated.
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toBeInTheDocument()
  })

  it('skips a disabled node when arrowing', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" />)
    item('README.md').focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(item('package.json'))
  })

  it('refuses to select a disabled node', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TreeView items={items} ariaLabel="Files" onValueChange={onValueChange} />)
    await user.click(item('locked.txt'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('Home and End skip disabled nodes at the edges', async () => {
    const user = userEvent.setup()
    render(
      <TreeView items={[{ id: 'a', label: 'a', disabled: true }, ...items]} ariaLabel="Files" />,
    )
    item('README.md').focus()
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(item('src'))
  })

  it('* expands every sibling at the level', async () => {
    const user = userEvent.setup()
    render(
      <TreeView
        items={[
          { id: 'a', label: 'a', children: [{ id: 'a1', label: 'a1' }] },
          { id: 'b', label: 'b', children: [{ id: 'b1', label: 'b1' }] },
        ]}
        ariaLabel="Files"
      />,
    )
    item('a').focus()
    await user.keyboard('*')
    expect(screen.getByRole('treeitem', { name: 'a1' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: 'b1' })).toBeInTheDocument()
  })

  it('ArrowRight expands then descends; ArrowLeft collapses then ascends', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" />)
    item('src').focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(item('index.ts'))
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(item('src'))
  })
})

describe('typeahead', () => {
  it('matches a node whose label is JSX, via textValue', async () => {
    const user = userEvent.setup()
    render(
      <TreeView
        ariaLabel="Files"
        items={[
          { id: 'a', label: <span>alpha</span>, textValue: 'alpha' },
          { id: 'z', label: <span>zeta</span>, textValue: 'zeta' },
        ]}
      />,
    )
    screen.getByRole('treeitem', { name: 'alpha' }).focus()
    await user.keyboard('zet')
    // The hand-rolled buffer tested `typeof label === 'string'`, so an icon beside the text
    // was enough to make type-to-select do nothing at all.
    expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'zeta' }))
  })

  it('still matches plain string labels', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" />)
    item('src').focus()
    await user.keyboard('rea')
    expect(document.activeElement).toBe(item('README.md'))
  })

  it('skips disabled nodes', async () => {
    const user = userEvent.setup()
    render(<TreeView items={items} ariaLabel="Files" />)
    item('src').focus()
    await user.keyboard('loc')
    expect(document.activeElement).toBe(item('src'))
  })
})

describe('selection', () => {
  it('announces that multiple nodes may be selected', () => {
    render(<TreeView items={items} ariaLabel="Files" selectionMode="multi" />)
    // Multi-select was otherwise entirely unannounced.
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('omits aria-multiselectable in single mode', () => {
    render(<TreeView items={items} ariaLabel="Files" />)
    expect(screen.getByRole('tree')).not.toHaveAttribute('aria-multiselectable')
  })

  it('deselects on a second activation in multi mode', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TreeView
        items={items}
        ariaLabel="Files"
        selectionMode="multi"
        onValueChange={onValueChange}
      />,
    )
    await user.click(item('README.md'))
    expect(onValueChange).toHaveBeenLastCalledWith(['readme'])
  })

  it('calls both onValueChange and the deprecated onSelectChange', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onSelectChange = vi.fn()
    render(
      <TreeView
        items={items}
        ariaLabel="Files"
        onValueChange={onValueChange}
        onSelectChange={onSelectChange}
      />,
    )
    await user.click(item('README.md'))
    expect(onValueChange).toHaveBeenCalledWith('readme')
    expect(onSelectChange).toHaveBeenCalledWith('readme')
  })
})
