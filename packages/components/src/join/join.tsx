import styles from './join.module.css'

export type JoinOrientation = 'horizontal' | 'vertical'

export interface JoinProps {
  children: React.ReactNode
  /**
   * Axis the joined children flow along: `horizontal` for a row, `vertical` for a column.
   * Inner corners are squared off either way.
   *
   * @defaultValue `horizontal`
   * @see the component manifest
   */
  orientation?: JoinOrientation
  className?: string
}

export function Join({ children, orientation = 'horizontal', className }: JoinProps) {
  return (
    <div
      className={[styles.join, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
    >
      {children}
    </div>
  )
}
