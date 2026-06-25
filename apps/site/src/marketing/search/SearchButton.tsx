'use client'
import { useSignals } from '@cascivo/core'
import { Kbd } from '@cascivo/components/kbd'

interface SearchButtonProps {
  onClick: () => void
}

export function SearchButton({ onClick }: SearchButtonProps) {
  useSignals()
  return (
    <button
      type="button"
      className="header-search-btn"
      aria-label="Search (Ctrl+K)"
      onClick={onClick}
    >
      <SearchIcon />
      <span className="header-search-shortcut" aria-hidden="true">
        <Kbd size="sm">⌘K</Kbd>
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
