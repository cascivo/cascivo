'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import { AutoGrid } from '../../auto-grid/auto-grid'
import styles from './page-footer.module.css'

export interface FooterLink {
  label: ReactNode
  href: string
}

export interface FooterGroup {
  title: ReactNode
  links: FooterLink[]
}

export interface PageFooterProps extends HTMLAttributes<HTMLElement> {
  groups: FooterGroup[]
  brand?: ReactNode
  meta?: ReactNode
}

export function PageFooter({ groups, brand, meta, className, ...props }: PageFooterProps) {
  return (
    <footer className={cn(styles['page-footer'], className)} {...props}>
      <div className={styles['inner']}>
        <nav aria-label="Footer">
          <AutoGrid min="10rem" gap={6}>
            {groups.map((group, i) => (
              <div key={i} className={styles['group']}>
                <p className={styles['group-title']}>{group.title}</p>
                <ul className={styles['link-list']}>
                  {group.links.map((link, j) => (
                    <li key={j}>
                      <a href={link.href} className={styles['link']}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </AutoGrid>
        </nav>
        {(brand || meta) && (
          <div className={styles['bottom']}>
            {brand && <div className={styles['brand']}>{brand}</div>}
            {meta && <div className={styles['meta']}>{meta}</div>}
          </div>
        )}
      </div>
    </footer>
  )
}
