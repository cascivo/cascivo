import type { ComponentChildren, JSX } from 'preact'
import { AutoGrid } from '@cascivo/layouts/auto-grid'
import { Masonry } from '@cascivo/layouts/masonry'
import { Section } from '@cascivo/layouts/section'
import { Hero } from '@cascivo/layouts/sections/hero'
import { Cta } from '@cascivo/layouts/sections/cta'
import { FeatureGrid } from '@cascivo/layouts/sections/feature-grid'
import { MediaMasonry } from '@cascivo/layouts/sections/media-masonry'
import { StatsBand } from '@cascivo/layouts/sections/stats-band'
import { PageFooter } from '@cascivo/layouts/sections/page-footer'

const tile = (label: string, h = '4rem') => (
  <div
    style={{
      blockSize: h,
      background: 'var(--cascivo-surface-subtle)',
      border: '1px solid var(--cascivo-color-border)',
      borderRadius: 'var(--cascivo-radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      color: 'var(--cascivo-text-secondary)',
    }}
  >
    {label}
  </div>
)

const frame = (children: ComponentChildren) => (
  <div
    style={{
      border: '1px solid var(--cascivo-color-border)',
      borderRadius: 'var(--cascivo-radius-md)',
      overflow: 'hidden',
      containerType: 'inline-size',
    }}
  >
    {children}
  </div>
)

export const layoutPreviews: Record<string, () => JSX.Element> = {
  'layout/auto-grid': () => (
    <AutoGrid min="8rem" gap={3}>
      {[1, 2, 3, 4, 5, 6].map((n) => tile(`Item ${n}`))}
    </AutoGrid>
  ),

  'layout/masonry': () => (
    <Masonry cols={3} gap={3}>
      {[80, 120, 64, 96, 140, 80].map((h, i) => tile(`Tile ${i + 1}`, `${h}px`))}
    </Masonry>
  ),

  'layout/section': () =>
    frame(
      <Section width="content" gap={4}>
        {tile('Header', '2rem')}
        {tile('Body', '4rem')}
      </Section>,
    ),

  'section/hero': () =>
    frame(
      <Hero
        variant="split"
        eyebrow="v8 — Assembly Included"
        title="Ship the dashboard your ops team deserves"
        description="Cascade gives you charts, layouts, and sections — fully composed, copy-paste ready."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--cascivo-color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--cascivo-radius-sm)',
                cursor: 'pointer',
              }}
            >
              Get started
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--cascivo-color-border)',
                borderRadius: 'var(--cascivo-radius-sm)',
                cursor: 'pointer',
              }}
            >
              View docs
            </button>
          </div>
        }
        media={tile('Media / demo', '12rem')}
      />,
    ),

  'section/cta': () =>
    frame(
      <Cta
        title="Ready to ship?"
        description="Add Cascade to your project in minutes — copy-paste or install via CLI."
        actions={
          <button
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--cascivo-color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--cascivo-radius-sm)',
              cursor: 'pointer',
            }}
          >
            Get started
          </button>
        }
      />,
    ),

  'section/feature-grid': () =>
    frame(
      <FeatureGrid
        title="Built for production"
        items={[
          {
            title: 'Zero config',
            description: 'Copy a component and it works — no providers, no wrappers.',
          },
          {
            title: 'Token-first',
            description: 'Every color and radius is a CSS custom property you own.',
          },
          { title: 'Signal-driven', description: 'Fine-grained reactivity with zero re-renders.' },
          {
            title: 'Accessible',
            description: 'WCAG 2.1 AA, keyboard navigable, logical CSS for RTL.',
          },
        ]}
      />,
    ),

  'section/media-masonry': () =>
    frame(
      <MediaMasonry title="Gallery" cols={3} gap={3}>
        {[96, 140, 80, 120, 64, 110].map((h, i) => tile(`Tile ${i + 1}`, `${h}px`))}
      </MediaMasonry>,
    ),

  'section/stats-band': () =>
    frame(
      <StatsBand
        aria-label="Performance metrics"
        stats={[
          {
            label: 'p99 latency',
            value: '184 ms',
            delta: '-12 ms',
            trend: [210, 205, 198, 192, 184],
          },
          {
            label: 'Error rate',
            value: '0.12%',
            delta: '-0.03%',
            trend: [0.18, 0.16, 0.15, 0.14, 0.12],
          },
          { label: 'Uptime', value: '99.98%', trend: [99.95, 99.97, 99.98, 99.99, 99.98] },
          { label: 'Deploys today', value: '7' },
        ]}
      />,
    ),

  'section/page-footer': () =>
    frame(
      <PageFooter
        brand="Cascade"
        meta="MIT licensed. Built with care."
        groups={[
          {
            title: 'Product',
            links: [
              { label: 'Components', href: '/components' },
              { label: 'Charts', href: '/charts' },
              { label: 'Layouts', href: '/layouts' },
            ],
          },
          {
            title: 'Developers',
            links: [
              { label: 'Docs', href: '/docs' },
              { label: 'GitHub', href: 'https://github.com/urbanisierung/cascivo' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Storybook', href: '/storybook' },
              { label: 'llms.txt', href: '/llms.txt' },
            ],
          },
        ]}
      />,
    ),
}
