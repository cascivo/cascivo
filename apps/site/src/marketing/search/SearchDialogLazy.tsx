import { SearchDialog } from '@cascivo/search/SearchDialog'
import { landingIndex } from './buildIndex'

interface SearchDialogLazyProps {
  open: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}

/**
 * Bundles the search index together with the dialog so neither weighs on the
 * home entry chunk. `landingIndex` is built from registry.json (~130 KB gzip);
 * importing it here — behind the same lazy boundary as the dialog — keeps the
 * whole registry out of the initial home payload. It loads only when the user
 * first opens search (Cmd/Ctrl+K or the search button).
 */
export function SearchDialogLazy(props: SearchDialogLazyProps) {
  return <SearchDialog index={landingIndex} {...props} />
}
