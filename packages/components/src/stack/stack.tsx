import styles from './stack.module.css'

export interface StackProps {
  children: React.ReactNode
  offset?: number
  className?: string
}

export function Stack({ children, offset = 4, className }: StackProps) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <div
      className={[styles.stack, className].filter(Boolean).join(' ')}
      style={{ '--cascivo-stack-offset': `${offset}px` } as React.CSSProperties}
    >
      {items.map((child, i) => (
        <div
          key={i}
          className={styles.layer}
          style={{ '--cascivo-stack-index': i } as React.CSSProperties}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
