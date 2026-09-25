import { chartCount, themeCount } from './figures'

interface Tile {
  title: string
  body: string
  tag: string
  href: string
}

// Eight tiles, each ending in a mono receipt link to the page that proves it. This band
// replaced four full sections (email, machine mode, templates, the five differences):
// each still has its own page, and the landing only needs to show that it exists.
const TILES: Tile[] = [
  {
    title: 'Charts',
    body: `${chartCount} chart types with no dependencies. Keyboard-navigable points and a hidden data table for screen readers.`,
    tag: '@cascivo/charts',
    href: '/charts',
  },
  {
    title: 'Email',
    body: `Transactional mail in the same ${themeCount} themes, resolved to plain sRGB and checked against the Can I email matrix.`,
    tag: '@cascivo/email',
    href: '/docs/email',
  },
  {
    title: 'Flow and editor',
    body: 'Node graphs with pan, zoom and a minimap, and a code editor built on a native textarea. Same tokens, same themes.',
    tag: 'flow · editor',
    href: '/docs/flow',
  },
  {
    title: 'Uses the browser',
    body: 'Menus and dialogs sit on native <dialog> and the Popover API — no positioning library, no JavaScript focus trap.',
    tag: 'platform css',
    href: '/modern-css',
  },
  {
    title: 'Upgrades you keep',
    body: 'cascivo update merges upstream fixes into the code you edited. doctor --drift reports what changed under you.',
    tag: 'cascivo update',
    href: '/docs/upgrading',
  },
  {
    title: 'Works with the shadcn CLI',
    body: 'Every component is also published in the shadcn registry format, so npx shadcn add can install it.',
    tag: 'registry interop',
    href: '/docs/parity',
  },
  {
    title: 'Machine mode',
    body: 'Render any view as Markdown, so an agent reads what a user sees — charts included, through their data tables.',
    tag: 'machine mode',
    href: '/docs/machine-mode.md',
  },
  {
    title: 'Tokens in the open format',
    body: 'Every token also ships as W3C DTCG JSON with a theme resolver, plus a DESIGN.md, so design tools and agents read the same values.',
    tag: '@cascivo/tokens/dtcg',
    href: '/docs/tokens',
  },
]

export function PosterBreadth() {
  return (
    <section className="pg-section" id="beyond" aria-label="Beyond components">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">More than components</h2>
        <p className="pg-eyebrow">07 / beyond components</p>
      </div>
      <div className="pg-tiles pg-tiles--4">
        {TILES.map((t, i) => (
          <div key={t.title} className="pg-pad pg-diff">
            <p className="pg-diff-num">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="pg-display pg-display--tile">{t.title}</h3>
            <p className="pg-body">{t.body}</p>
            <a className="pg-diff-tag" href={t.href}>
              {t.tag}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
