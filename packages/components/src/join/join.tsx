import styles from './join.module.css'

export type JoinOrientation = 'horizontal' | 'vertical'

export interface JoinProps {
  children: React.ReactNode
  /**
   * Layout orientation of the component.
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
