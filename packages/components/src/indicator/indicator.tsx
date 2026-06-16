import styles from './indicator.module.css'

export type IndicatorPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'

export interface IndicatorProps {
  children: React.ReactNode
  overlay: React.ReactNode
  placement?: IndicatorPlacement
  className?: string
}

export function Indicator({ children, overlay, placement = 'top-end', className }: IndicatorProps) {
  return (
    <div
      className={[styles.indicator, className].filter(Boolean).join(' ')}
      data-placement={placement}
    >
      {children}
      <div className={styles.overlay} aria-hidden>
        {overlay}
      </div>
    </div>
  )
}
