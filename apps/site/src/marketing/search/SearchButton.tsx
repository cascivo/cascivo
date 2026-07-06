'use client'
import { useSignals } from '@cascivo/core'
import { Kbd } from '@cascivo/components/kbd'

interface SearchButtonProps {
  onClick: () => void
}

// Apple platforms use ⌘K; everything else uses Ctrl+K. Detect once so the
// visible key and the accessible label agree cross-platform.
const isApple =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
const SHORTCUT_LABEL = isApple ? 'Cmd+K' : 'Ctrl+K'
const SHORTCUT_KEYS = isApple ? '⌘K' : 'Ctrl K'

export function SearchButton({ onClick }: SearchButtonProps) {
  useSignals()
  return (
    <button
      type="button"
      className="header-search-btn"
      aria-label={`Search (${SHORTCUT_LABEL})`}
      onClick={onClick}
    >
      <SearchIcon />
      <span className="header-search-shortcut" aria-hidden="true">
        <Kbd size="sm">{SHORTCUT_KEYS}</Kbd>
      </span>
    </button>
  )
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
