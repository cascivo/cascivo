'use client'
import {
  cn,
  useControllableSignal,
  useId,
  useSignal,
  useSignals,
  useTypeahead,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import styles from './tree-view.module.css'

export interface TreeNode {
  id: string
  label: ReactNode
  icon?: ReactNode
  children?: TreeNode[]
  /**
   * When true, the node cannot be selected and is skipped by keyboard navigation and
   * type-to-select.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * Plain-text form of `label`, for type-to-select when the label is JSX.
   *
   * Typeahead matched `typeof label === 'string'`, so it silently did nothing for any node
   * rendering an icon beside its text — the common case.
   */
  textValue?: string
}

export interface TreeViewProps {
  items: TreeNode[]
  selectionMode?: 'single' | 'multi'
  selected?: string | string[]
  defaultSelected?: string | string[]
  /**
   * @deprecated Use `onValueChange`. The catalog names a value-carrying handler
   * `onValueChange`; `onSelectChange` appears on this component alone. Still honoured.
   */
  onSelectChange?: (selected: string | string[]) => void
  /** Called with the new selection. */
  onValueChange?: (selected: string | string[]) => void
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  className?: string
  /**
   * Invisible accessible name. The catalog convention (see the item-identity table in
   * `docs/AI-RULES.md`); `aria-label` is accepted as an alias for the DOM spelling.
   */
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
  'aria-label'?: string
}

/** A node paired with its position metadata, in visible (DFS) order — used for keyboard nav. */
interface FlatNode {
  id: string
  level: number
  parentId: string | null
  hasChildren: boolean
  expanded: boolean
}

function flattenVisible(items: TreeNode[], expanded: Set<string>): FlatNode[] {
  const out: FlatNode[] = []
  const walk = (nodes: TreeNode[], level: number, parentId: string | null) => {
    for (const node of nodes) {
      const hasChildren = !!node.children && node.children.length > 0
      const isExpanded = expanded.has(node.id)
      out.push({ id: node.id, level, parentId, hasChildren, expanded: isExpanded })
      if (hasChildren && isExpanded) walk(node.children as TreeNode[], level + 1, node.id)
    }
  }
  walk(items, 1, null)
  return out
}

function toSelectionArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : value === '' ? [] : [value]
}

export function TreeView({
  items,
  selectionMode = 'single',
  selected,
  defaultSelected,
  onSelectChange,
  onValueChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  className,
  'aria-label': ariaLabelDom,
  ariaLabel,
  label,
}: TreeViewProps) {
  useSignals()

  const [expandedSig, setExpanded] = useControllableSignal<string[]>({
    value: expanded,
    defaultValue: defaultExpanded ?? [],
    onChange: onExpandedChange,
  })
  const [selectedSig, setSelected] = useControllableSignal<string | string[]>({
    value: selected,
    defaultValue: defaultSelected ?? (selectionMode === 'multi' ? [] : ''),
    onChange: (next) => {
      onValueChange?.(next)
      onSelectChange?.(next)
    },
  })

  const focusedId = useSignal<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement>())

  const expandedSet = new Set(expandedSig.value)
  const visible = flattenVisible(items, expandedSet)
  const visibleIndex = new Map(visible.map((f, i) => [f.id, i]))
  const selectionArray = toSelectionArray(selectedSig.value)
  const selectionSet = new Set(selectionArray)

  /*
   * The single tabbable item: focused node, else first selected, else first visible node —
   * but each candidate has to still BE visible. `focusedId` was never invalidated when the
   * node it named stopped being visible, so expanding a branch, focusing a child and
   * collapsing the branch again left the tabindex on a hidden node and Tab skipped the whole
   * tree.
   */
  const firstVisible = (...ids: (string | null | undefined)[]): string | null => {
    for (const id of ids) if (id && visibleIndex.has(id)) return id
    return visible[0]?.id ?? null
  }
  const tabbableId = firstVisible(focusedId.value, selectionArray[0])

  const commitExpanded = (next: Set<string>) => setExpanded([...next])

  const expand = (id: string) => {
    if (expandedSet.has(id)) return
    const next = new Set(expandedSet)
    next.add(id)
    commitExpanded(next)
  }

  const collapse = (id: string) => {
    if (!expandedSet.has(id)) return
    const next = new Set(expandedSet)
    next.delete(id)
    commitExpanded(next)
  }

  const focusNode = (id: string) => {
    focusedId.value = id
    itemRefs.current.get(id)?.focus()
  }

  /** The next visible, non-disabled node from `index` in the direction of travel. */
  const step = (index: number, delta: number): FlatNode | undefined => {
    const byId = collectVisibleNodes(items, expandedSet)
    for (let i = index + delta; i >= 0 && i < visible.length; i += delta) {
      const entry = visible[i]
      if (entry && !byId.get(entry.id)?.disabled) return entry
    }
    return undefined
  }

  /** First and last selectable visible nodes, for Home/End. */
  const edge = (from: 'start' | 'end'): FlatNode | undefined =>
    from === 'start' ? step(-1, 1) : step(visible.length, -1)

  const select = (id: string) => {
    if (collectVisibleNodes(items, expandedSet).get(id)?.disabled) return
    if (selectionMode === 'multi') {
      const next = new Set(selectionSet)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setSelected([...next])
    } else {
      setSelected(id)
    }
  }

  /** Text a node can be matched by: an explicit `textValue`, else a string label. */
  const nodeText = (node: TreeNode): string | null => {
    if (node.textValue !== undefined) return node.textValue
    return typeof node.label === 'string' ? node.label : null
  }

  const typeahead = useTypeahead({
    onMatch: (query) => {
      const from = focusedId.peek()
      const index = from !== null ? (visibleIndex.get(from) ?? -1) : -1
      const byId = collectVisibleNodes(items, expandedSet)
      const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)]
      const hit = ordered.find((f) => {
        const node = byId.get(f.id)
        if (!node || node.disabled) return false
        const text = nodeText(node)
        return text !== null && text.toLowerCase().startsWith(query)
      })
      if (hit) focusNode(hit.id)
    },
  })

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>, node: TreeNode) => {
    const index = visibleIndex.get(node.id)
    if (index === undefined) return
    const entry = visible[index] as FlatNode
    const { hasChildren, level, parentId, expanded: isExpanded } = entry

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        const next = step(index, 1)
        if (next) focusNode(next.id)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        const prev = step(index, -1)
        if (prev) focusNode(prev.id)
        break
      }
      case 'ArrowRight': {
        event.preventDefault()
        if (hasChildren && !isExpanded) {
          expand(node.id)
        } else if (hasChildren && isExpanded) {
          const next = visible[index + 1]
          if (next && next.level > level) focusNode(next.id)
        }
        break
      }
      case 'ArrowLeft': {
        event.preventDefault()
        if (hasChildren && isExpanded) {
          collapse(node.id)
        } else if (parentId) {
          focusNode(parentId)
        }
        break
      }
      case 'Home': {
        event.preventDefault()
        const first = edge('start')
        if (first) focusNode(first.id)
        break
      }
      case 'End': {
        event.preventDefault()
        const last = edge('end')
        if (last) focusNode(last.id)
        break
      }
      case '*': {
        // APG: expand every sibling at the current level.
        event.preventDefault()
        const next = new Set(expandedSet)
        for (const f of visible) {
          if (f.level === level && f.parentId === parentId && f.hasChildren) next.add(f.id)
        }
        commitExpanded(next)
        break
      }
      case 'Enter':
      case ' ': {
        event.preventDefault()
        // Click toggled expansion *and* selected; the keys only selected, so a branch node
        // behaved differently depending on how it was activated. APG's default action for a
        // parent node is the toggle.
        if (node.disabled) break
        if (hasChildren) (isExpanded ? collapse : expand)(node.id)
        select(node.id)
        break
      }
      default: {
        // Type-to-select via the shared primitive; the hand-rolled Date.now() buffer it
        // replaces also only matched string labels, so it did nothing for any node with a
        // JSX label.
        typeahead.onKeyDown(event)
        break
      }
    }
  }

  const renderNode = (
    node: TreeNode,
    level: number,
    posInSet: number,
    setSize: number,
  ): ReactNode => {
    const hasChildren = !!node.children && node.children.length > 0
    const isExpanded = expandedSet.has(node.id)
    const isSelected = selectionSet.has(node.id)
    const isTabbable = tabbableId === node.id
    const isDisabled = node.disabled ?? false
    const childCount = node.children?.length ?? 0
    return (
      <TreeItem
        key={node.id}
        node={node}
        level={level}
        posInSet={posInSet}
        setSize={setSize}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isSelected={isSelected}
        isTabbable={isTabbable}
        isDisabled={isDisabled}
        itemRefs={itemRefs}
        onFocusNode={() => (focusedId.value = node.id)}
        onKeyDown={(e) => handleKeyDown(e, node)}
        onActivate={() => {
          if (isDisabled) return
          focusNode(node.id)
          if (hasChildren) (isExpanded ? collapse : expand)(node.id)
          select(node.id)
        }}
      >
        {hasChildren &&
          isExpanded &&
          (node.children as TreeNode[]).map((child, i) =>
            renderNode(child, level + 1, i + 1, childCount),
          )}
      </TreeItem>
    )
  }

  return (
    <ul
      role="tree"
      aria-multiselectable={selectionMode === 'multi' || undefined}
      aria-label={ariaLabel ?? ariaLabelDom ?? label}
      className={cn(styles['tree'], className)}
    >
      {items.map((node, i) => renderNode(node, 1, i + 1, items.length))}
    </ul>
  )
}

/** Flatten the *visible* nodes into an id→node map for typeahead label lookups. */
function collectVisibleNodes(items: TreeNode[], expanded: Set<string>): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>()
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      map.set(node.id, node)
      if (node.children && node.children.length > 0 && expanded.has(node.id)) {
        walk(node.children)
      }
    }
  }
  walk(items)
  return map
}

interface TreeItemProps {
  node: TreeNode
  level: number
  posInSet: number
  setSize: number
  hasChildren: boolean
  isExpanded: boolean
  isSelected: boolean
  isTabbable: boolean
  isDisabled: boolean
  itemRefs: React.MutableRefObject<Map<string, HTMLLIElement>>
  onFocusNode: () => void
  onKeyDown: (event: KeyboardEvent<HTMLLIElement>) => void
  onActivate: () => void
  children?: ReactNode
}

function TreeItem({
  node,
  level,
  posInSet,
  setSize,
  hasChildren,
  isExpanded,
  isSelected,
  isTabbable,
  isDisabled,
  itemRefs,
  onFocusNode,
  onKeyDown,
  onActivate,
  children,
}: TreeItemProps) {
  // Names the item from its own label rather than from everything inside it, which once
  // expanded meant the entire subtree.
  const labelId = useId(`cascivo-tree-${node.id}`)
  return (
    <li
      role="treeitem"
      aria-labelledby={labelId}
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-disabled={isDisabled || undefined}
      data-disabled={isDisabled || undefined}
      tabIndex={isTabbable ? 0 : -1}
      data-selected={isSelected || undefined}
      data-state={hasChildren ? (isExpanded ? 'open' : 'closed') : undefined}
      style={{ '--cascivo-tree-level': level } as CSSProperties}
      className={styles['item']}
      ref={(el) => {
        if (el) itemRefs.current.set(node.id, el)
        else itemRefs.current.delete(node.id)
      }}
      onFocus={(e) => {
        if (e.target === e.currentTarget) onFocusNode()
      }}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        e.stopPropagation()
        onActivate()
      }}
    >
      <span className={styles['row']}>
        {hasChildren ? (
          <span
            className={styles['twisty']}
            aria-hidden="true"
            data-state={isExpanded ? 'open' : 'closed'}
          />
        ) : (
          <span className={styles['twistySpacer']} aria-hidden="true" />
        )}
        {node.icon && (
          <span className={styles['icon']} aria-hidden="true">
            {node.icon}
          </span>
        )}
        <span id={labelId} className={styles['label']}>
          {node.label}
        </span>
      </span>
      {hasChildren && (
        <div
          role="presentation"
          className={styles['groupWrap']}
          data-state={isExpanded ? 'open' : 'closed'}
        >
          <ul role="group" className={styles['group']}>
            {children}
          </ul>
        </div>
      )}
    </li>
  )
}

// Re-export the i18n keys so consumers/tooling can discover the strings this component owns.
export const treeViewMessages = {
  loading: () => t(builtin.treeView.loading),
  expand: () => t(builtin.treeView.expand),
  collapse: () => t(builtin.treeView.collapse),
}
