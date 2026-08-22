'use client'
import { cn, createMachine, useMachine, useSignals } from '@cascivo/core'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import styles from './toggle.module.css'

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it (a heading in a settings row, a table column header) and `label` would render
   * that text a second time.
   *
   * `label` on this component is **visible** — it is painted next to the control. The catalog
   * splits that way deliberately, but `IconButton.label` and `Sparkline.label` are invisible
   * names, so an adopter arriving with that prior writes `label` here and gets the text twice
   * (2026-08-22 report item 13). Both props are now listed side by side, each saying which it
   * is, which is the only thing that interrupts a confident wrong guess.
   *
   * The raw DOM `aria-label` is still accepted and wins over this.
   */
  ariaLabel?: string
  checked?: boolean
  /**
   * Whether the control is checked on first render (uncontrolled).
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  defaultChecked?: boolean
  /** Called with the new checked state when the switch is toggled. */
  onValueChange?: (checked: boolean) => void
  /** @deprecated Use `onValueChange` — it receives the same `checked` boolean. */
  onChange?: (checked: boolean) => void
  /**
   * Renders a **visible** text label beside the switch that also becomes its
   * accessible name. When a visible heading already labels the control, omit
   * `label` (it would duplicate that text) and pass `aria-label` instead —
   * `aria-label` is forwarded to the underlying button.
   */
  label?: string
  size?: 'sm' | 'md'
}

/**
 * `forwardRef` so `ref` reaches the underlying `<button>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10). `forwardRef` rather than a
 * bare `ref?: Ref<T>` prop keeps the `react >= 18` peer floor honest, since ref-as-prop does
 * not work there.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    checked,
    defaultChecked = false,
    onValueChange,
    onChange,
    label,
    size = 'md',
    className,
    disabled,
    ariaLabel,
    ...props
  },
  ref,
) {
  useSignals()
  const machine = createMachine({
    initial: defaultChecked ? ('on' as const) : ('off' as const),
    states: {
      off: { on: { TOGGLE: 'on' } },
      on: { on: { TOGGLE: 'off' } },
    },
  })
  const [state, send] = useMachine(machine)

  const isControlled = checked !== undefined
  const isOn = isControlled ? checked : state.value === 'on'

  const handleClick = () => {
    if (!isControlled) send('TOGGLE')
    ;(onValueChange ?? onChange)?.(!isOn)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      data-state={isOn ? 'on' : 'off'}
      data-size={size}
      disabled={disabled}
      className={cn(styles['toggle'], className)}
      onClick={handleClick}
      ref={ref as never}
      {...props}
      aria-label={props['aria-label'] ?? ariaLabel}
    >
      <span className={styles['track']} aria-hidden="true">
        <span className={styles['thumb']} />
      </span>
      {label && <span className={styles['label']}>{label}</span>}
    </button>
  )
})
