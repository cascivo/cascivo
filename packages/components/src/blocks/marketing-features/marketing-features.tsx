'use client'
import styles from './marketing-features.module.css'

type Feature = { icon: string; title: string; description: string }

const FEATURES: Feature[] = [
  {
    icon: '⚡',
    title: 'Signal-driven',
    description:
      'Preact Signals power every component. No useState, no re-renders, zero unnecessary DOM updates.',
  },
  {
    icon: '🎨',
    title: 'CSS-native',
    description:
      'Modern CSS only — @layer, @container, :has(), custom properties. No Tailwind, no CSS-in-JS.',
  },
  {
    icon: '♿',
    title: 'WCAG 2.1 AA',
    description:
      'Every component ships with correct ARIA roles, keyboard navigation, and focus management.',
  },
  {
    icon: '📋',
    title: 'Copy-paste model',
    description:
      'Components live in your project. You own the code. No vendor lock-in, no version surprises.',
  },
  {
    icon: '🤖',
    title: 'AI-first',
    description:
      'Machine-readable component manifests, MCP server, and Claude Code skills included out of the box.',
  },
  {
    icon: '🌗',
    title: 'Beautiful themes',
    description:
      'Light, dark, and warm themes ship as pure CSS. Scope any theme to any container with data-theme.',
  },
]

export function MarketingFeatures() {
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Everything you need</h2>
        <p className={styles.subtitle}>
          cascivo is designed for developers who care about quality, performance, and
          maintainability.
        </p>
      </div>

      <div className={styles.grid}>
        {FEATURES.map((f) => (
          <article key={f.title} className={styles.cell} data-testid="feature-cell">
            <div className={styles.cellIcon} aria-hidden="true">
              {f.icon}
            </div>
            <h3 className={styles.cellTitle}>{f.title}</h3>
            <p className={styles.cellDescription}>{f.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
