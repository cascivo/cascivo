'use client'
import { Link } from '../../link/link'
import { Separator } from '../../separator/separator'
import styles from './site-footer.module.css'

type Column = { title: string; links: { label: string; href: string }[] }

const COLUMNS: Column[] = [
  {
    title: 'Product',
    links: [
      { label: 'Components', href: '#' },
      { label: 'Themes', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Storybook', href: '#' },
      { label: 'GitHub', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
]

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles['root']}>
      <div className={styles['top']}>
        <div className={styles['brand']}>
          <span className={styles['logo']}>cascivo</span>
          <p className={styles['tagline']}>
            The CSS-native, signal-driven, AI-first design system.
          </p>
        </div>
        <nav className={styles['columns']} aria-label="Footer">
          {COLUMNS.map((column) => (
            <div key={column.title} className={styles['column']}>
              <h3 className={styles['columnTitle']}>{column.title}</h3>
              <ul className={styles['links']}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <Separator />
      <div className={styles['bottom']}>
        <span className={styles['copyright']}>© {year} cascivo. All rights reserved.</span>
        <div className={styles['legal']}>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
