'use client'
import { useControllableSignal, useSignals } from '@cascivo/core'
import styles from './filter.module.css'

export type FilterVariant = 'pill' | 'outline'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterProps {
  options: FilterOption[]
  value?: string[]
  /**
   * Initial selected values for uncontrolled use
   *
   * @defaultValue `[]`
   * @see the component manifest
   */
  defaultValue?: string[]
  /** Called with the selected values whenever the selection changes. */
  onValueChange?: (selected: string[]) => void
  /** @deprecated Use `onValueChange` — it receives the same `string[]`. */
  onChange?: (selected: string[]) => void
  /**
   * Allow multiple items to be selected simultaneously
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  multi?: boolean
  /**
   * Selects the visual style variant.
   *
   * @defaultValue `pill`
   * @see the component manifest
   */
  variant?: FilterVariant
  /**
   * Invisible accessible name. `ariaLabel` is the catalog convention (see the
   * accessible-name table in `docs/AI-RULES.md`); the DOM spelling `aria-label` is accepted
   * too, so either guess compiles. Two spellings of one idea inside a package was a coin
   * flip on every component.
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
  /** DOM-spelled alias of {@link ariaLabel}. */
  'aria-label'?: string
  className?: string
}

export function Filter({
  options,
  value,
  defaultValue = [],
  onValueChange,
  onChange,
  multi = false,
  variant = 'pill',
  className,
  ariaLabel,
  label,
  ...aria
}: FilterProps) {
  useSignals()
  const [selected, setSelected] = useControllableSignal<string[]>({
    value,
    defaultValue,
    onChange: onValueChange ?? onChange,
  })

  function toggle(val: string) {
    const current = selected.value
    let next: string[]
    if (multi) {
      next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
    } else {
      next = current.includes(val) ? [] : [val]
    }
    setSelected(next)
  }

  return (
    <div
      role="group"
      className={[styles['filter'], className].filter(Boolean).join(' ')}
      data-variant={variant}
      aria-label={aria['aria-label'] ?? ariaLabel ?? label}
      {...aria}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={styles['item']}
          data-selected={selected.value.includes(opt.value) || undefined}
          onClick={() => toggle(opt.value)}
          aria-pressed={selected.value.includes(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
