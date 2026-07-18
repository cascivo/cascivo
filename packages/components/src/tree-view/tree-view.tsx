'use client'
import { cn, useControllableSignal, useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import styles from './tree-view.module.css'

export interface TreeNode {
  id: string
  label: ReactNode
  icon?: ReactNode
  children?: TreeNode[]
}

export interface TreeViewProps {
  items: TreeNode[]
  selectionMode?: 'single' | 'multi'
  selected?: string | string[]
  defaultSelected?: string | string[]
  onSelectChange?: (selected: string | string[]) => void
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  className?: string
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
  expanded,
  defaultExpanded,
  onExpandedChange,
  className,
  'aria-label': ariaLabel,
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
    onChange: onSelectChange,
  })

  const focusedId = useSignal<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement>())

  const expandedSet = new Set(expandedSig.value)
  const visible = flattenVisible(items, expandedSet)
  const visibleIndex = new Map(visible.map((f, i) => [f.id, i]))
  const selectionArray = toSelectionArray(selectedSig.value)
  const selectionSet = new Set(selectionArray)

  // The single tabbable item: focused node, else first selected, else first visible node.
  const tabbableId = focusedId.value ?? selectionArray[0] ?? visible[0]?.id ?? null

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

  const select = (id: string) => {
    if (selectionMode === 'multi') {
      const next = new Set(selectionSet)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setSelected([...next])
    } else {
      setSelected(id)
    }
  }

  const typeahead = useRef({ buffer: '', at: 0 })

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>, node: TreeNode) => {
    const index = visibleIndex.get(node.id)
    if (index === undefined) return
    const entry = visible[index] as FlatNode
    const { hasChildren, level, parentId, expanded: isExpanded } = entry

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        const next = visible[index + 1]
        if (next) focusNode(next.id)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        const prev = visible[index - 1]
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
        if (visible[0]) focusNode(visible[0].id)
        break
      }
      case 'End': {
        event.preventDefault()
        const last = visible[visible.length - 1]
        if (last) focusNode(last.id)
        break
      }
      case 'Enter':
      case ' ': {
        event.preventDefault()
        select(node.id)
        break
      }
      default: {
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const ta = typeahead.current
          const now = Date.now()
          ta.buffer = now - ta.at > 500 ? event.key : ta.buffer + event.key
          ta.at = now
          const needle = ta.buffer.toLowerCase()
          const matches = (n: TreeNode): boolean =>
            typeof n.label === 'string' && n.label.toLowerCase().startsWith(needle)
          // Search visible nodes after the current one, then wrap.
          const visibleNodeById = collectVisibleNodes(items, expandedSet)
          const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)]
          const hit = ordered.find((f) => {
            const n = visibleNodeById.get(f.id)
            return n ? matches(n) : false
          })
          if (hit) focusNode(hit.id)
        }
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
        itemRefs={itemRefs}
        onFocusNode={() => (focusedId.value = node.id)}
        onKeyDown={(e) => handleKeyDown(e, node)}
        onActivate={() => {
          focusNode(node.id)
          if (hasChildren) (isExpanded ? collapse : expand)(node.id)
          select(node.id)
        }}
      >
        {hasChildren &&
          (node.children as TreeNode[]).map((child, i) =>
            renderNode(child, level + 1, i + 1, childCount),
          )}
      </TreeItem>
    )
  }

  return (
    <ul role="tree" aria-label={ariaLabel} className={cn(styles['tree'], className)}>
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
  itemRefs,
  onFocusNode,
  onKeyDown,
  onActivate,
  children,
}: TreeItemProps) {
  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
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
        <span className={styles['label']}>{node.label}</span>
      </span>
      {hasChildren && (
        <div className={styles['groupWrap']} data-state={isExpanded ? 'open' : 'closed'}>
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
