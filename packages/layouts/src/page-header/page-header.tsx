import { cn } from '@cascivo/core/pure'
import type { ReactNode } from 'react'
import styles from './page-header.module.css'

export interface PageHeaderProps {
  /**
   * The page title, rendered as the `<h1>`.
   *
   * `ReactNode`, not `string`, so a deploy console can put the production domain in the
   * heading as a link and a status badge beside the project name — the canonical shape of a
   * project header. `RECIPE-DASHBOARD.md` tells you not to hand-compose `PageHeader` out of
   * `Heading`/`Text`/`Flex`, so this has to be composable here (2026-08-14 report §7).
   *
   * ```tsx
   * <PageHeader
   *   title={<>acme-web <Badge variant="success">Ready</Badge></>}
   *   description={<>Deployed from <Link asChild><RouterLink to="/c/abc">abc123</RouterLink></Link></>}
   * />
   * ```
   *
   * Keep it short and heading-like: it is an `<h1>`, so anything block-level inside it is
   * invalid HTML and will fight the heading's own typography.
   */
  title: ReactNode
  /** Supporting line under the title, rendered as a `<p>`. Accepts nodes, like `title`. */
  description?: ReactNode
  breadcrumb?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(styles['header'], className)}>
      {breadcrumb && <div className={styles['breadcrumb']}>{breadcrumb}</div>}
      <div className={styles['row']}>
        <h1 className={styles['title']}>{title}</h1>
        {actions && <div className={styles['actions']}>{actions}</div>}
      </div>
      {description && <p className={styles['description']}>{description}</p>}
    </header>
  )
}
