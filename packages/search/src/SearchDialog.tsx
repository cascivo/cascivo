'use client'
import { useComputed, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Modal } from '@cascivo/components/modal'
import { Input } from '@cascivo/components/input'
import type { SearchIndex, SearchItem } from './index'
import './search.css'

export interface SearchDialogProps {
  index: SearchIndex
  open: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}

export function SearchDialog({ index, open, onClose, onNavigate }: SearchDialogProps) {
  useSignals()
  const query = useSignal('')
  const cursor = useSignal(0)
  const results = useComputed<SearchItem[]>(() => index.search(query.value))

  // Reset state whenever the dialog opens.
  useSignalEffect(() => {
    if (open) {
      query.value = ''
      cursor.value = 0
    }
  })

  // Keyboard navigation within the result list.
  useSignalEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        cursor.value = Math.min(cursor.value + 1, results.value.length - 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        cursor.value = Math.max(cursor.value - 1, 0)
      } else if (e.key === 'Enter') {
        const item = results.value[cursor.value]
        if (item) {
          onNavigate(item.href)
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  return (
    <Modal open={open} onClose={onClose} title="Search" className="search-dialog">
      <div className="search-dialog-inner">
        <Input
          autoFocus
          placeholder="Search components, guides…"
          value={query.value}
          onChange={(e) => {
            query.value = e.target.value
            cursor.value = 0
          }}
          className="search-input"
        />
        {results.value.length > 0 && (
          <ul className="search-results" role="listbox">
            {results.value.map((item, i) => (
              <li
                key={item.id}
                role="option"
                aria-selected={i === cursor.value}
                className={`search-result${i === cursor.value ? ' search-result--active' : ''}`}
                onMouseEnter={() => {
                  cursor.value = i
                }}
                onClick={() => {
                  onNavigate(item.href)
                  onClose()
                }}
              >
                <span className="search-result-title">{item.title}</span>
                {item.section && <span className="search-result-section">{item.section}</span>}
                {item.description && <span className="search-result-desc">{item.description}</span>}
                <span className={`search-result-type search-result-type--${item.type}`}>
                  {item.category ?? item.type}
                </span>
              </li>
            ))}
          </ul>
        )}
        {query.value.length >= 2 && results.value.length === 0 && (
          <p className="search-empty">No results for &ldquo;{query.value}&rdquo;</p>
        )}
      </div>
    </Modal>
  )
}
