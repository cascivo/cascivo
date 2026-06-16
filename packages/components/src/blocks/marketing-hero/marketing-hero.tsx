'use client'
import { Badge } from '../../badge/badge'
import { Button } from '../../button/button'
import styles from './marketing-hero.module.css'

const TRUST_BADGES = ['MIT licence', 'Zero dependencies', 'WCAG 2.1 AA']

export function MarketingHero() {
  return (
    <section className={styles.root}>
      <div className={styles.eyebrow}>
        <Badge variant="secondary">New — v29 Blocks</Badge>
      </div>

      <h1 className={styles.heading}>Build beautiful UIs without the boilerplate</h1>

      <p className={styles.subtitle}>
        cascivo is the CSS-native, signal-driven design system for React. Copy production-ready
        components and blocks into your project and own them completely.
      </p>

      <div className={styles.ctaRow}>
        <Button variant="primary" size="lg">
          Get started
        </Button>
        <Button variant="ghost" size="lg">
          View on GitHub
        </Button>
      </div>

      <div className={styles.badgesRow}>
        {TRUST_BADGES.map((label) => (
          <Badge key={label} variant="outline" data-testid="trust-badge">
            {label}
          </Badge>
        ))}
      </div>
    </section>
  )
}
