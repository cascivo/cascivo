/**
 * The sentence a `label` / `ariaLabel` prop's docs must carry, derived from the manifest's
 * structured `nameVisibility` field rather than written by hand.
 *
 * Authors keep writing the description; the generators append this. That is the point: the
 * previous arrangement asked authors to state visibility in prose and asked a guard to read
 * that prose back, and the guard read it wrong — `Switcher` and `CommandMenu` both described
 * an invisible accessible name as "Text label for the control.", which the guard's VISIBLE
 * regex matched on the substring "text label" (2026-08-21 report item 1). Deriving the
 * sentence from the field means a description cannot contradict behaviour on any generated
 * surface, because the authoritative half is machine-written.
 */
export interface NameVisibilityProp {
  name: string
  description?: string | undefined
  nameVisibility?: 'visible' | 'invisible' | undefined
}

const NOTE = {
  visible: 'Rendered on screen.',
  invisible: 'Not rendered — screen readers only.',
} as const

/** The derived sentence for this prop, or `null` when the prop carries no name. */
export function nameVisibilityNote(prop: NameVisibilityProp): string | null {
  if (prop.name !== 'label' && prop.name !== 'ariaLabel') return null
  return prop.nameVisibility ? NOTE[prop.nameVisibility] : null
}

/**
 * The prop's description with the derived sentence appended, skipping the append when the
 * author already wrote the same sentence (so the common case reads as one thought, not two).
 */
export function describeWithVisibility(prop: NameVisibilityProp): string {
  const base = (prop.description ?? '').trim()
  const note = nameVisibilityNote(prop)
  if (!note) return base || '—'
  if (!base) return note
  if (base.includes(note)) return base
  return `${base.replace(/\s*$/, '')}${/[.!?]$/.test(base) ? '' : '.'} ${note}`
}
