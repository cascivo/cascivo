// Framework-free: `scripts/fonts/sync-site.ts` and `scripts/checks/font-site-sync.test.ts` load
// this module directly under node. Type-only imports are erased, so they are fine.
import type { FontFile } from '../cascivo-sans/data.ts'

export type FamilyId = 'mono' | 'serif' | 'condensed'

export interface FontFamily {
  id: FamilyId
  /** "Cascivo Mono" — the CSS family name and the page title. */
  name: string
  route: string
  /** Fallback stack after the family name. */
  fallback: string
  tagline: string
  /** One-sentence hero text; also the hub card text. */
  summary: string
  points: readonly string[]
  files: readonly FontFile[]
}

function files(id: FamilyId, Name: string): readonly FontFile[] {
  const build = `fonts/cascivo-${id}/fonts/`
  return [
    {
      name: `Cascivo${Name}-Latin[opsz,wght].woff2`,
      source: `${build}Cascivo${Name}-Latin[opsz,wght].woff2`,
      kind: 'web',
      label: 'Upright — variable WOFF2, Latin',
    },
    {
      name: `Cascivo${Name}[opsz,wght].ttf`,
      source: `${build}Cascivo${Name}[opsz,wght].ttf`,
      kind: 'desktop',
      label: 'Upright — variable TTF, all scripts',
    },
  ]
}

export const FAMILIES: readonly FontFamily[] = [
  {
    id: 'mono',
    name: 'Cascivo Mono',
    route: '/cascivo-mono',
    fallback: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    tagline: 'Code and data',
    summary:
      'A monospaced variable font for code, tables and terminals. Weight 100–900, optical size 8–48, upright only.',
    points: [
      'One advance width at every weight, so columns stay aligned when a line turns bold.',
      'The same weight and optical-size axes as Cascivo Sans, in a single variable file.',
      'Set it site-wide from the “Aa” menu in the header.',
    ],
    files: files('mono', 'Mono'),
  },
  {
    id: 'serif',
    name: 'Cascivo Serif',
    route: '/cascivo-serif',
    fallback: "ui-serif, Georgia, Cambria, 'Times New Roman', serif",
    tagline: 'Reading and headings',
    summary:
      'A slab-bracket serif variable font for long reading and headings. Weight 100–900, optical size 8–48, upright only.',
    points: [
      'Built on the same skeleton and character set as Cascivo Sans, with serifs added by rule.',
      'Optical size opens the letters at small sizes and tightens them for display.',
      'Set it site-wide from the “Aa” menu in the header.',
    ],
    files: files('serif', 'Serif'),
  },
  {
    id: 'condensed',
    name: 'Cascivo Condensed',
    route: '/cascivo-condensed',
    fallback: "'Arial Narrow', ui-sans-serif, system-ui, sans-serif",
    tagline: 'Tight spaces',
    summary:
      'A condensed sans variable font for dense tables, labels and headlines. Weight 100–900, optical size 8–48, upright only.',
    points: [
      'About four fifths of the width of Cascivo Sans at every weight, measured on a–z and A–Z.',
      'Counters stay open at Black and at small optical sizes.',
      'Set it site-wide from the “Aa” menu in the header.',
    ],
    files: files('condensed', 'Condensed'),
  },
]

export function familyById(id: FamilyId): FontFamily {
  const family = FAMILIES.find((f) => f.id === id)
  if (!family) throw new Error(`no font family ${id}`)
  return family
}

export const familyBase = (f: FontFamily): string => `/fonts/cascivo-${f.id}/`

/** Same URL spelling as `@font-face` url() requests — see downloadHref in cascivo-sans/data. */
export function familyHref(f: FontFamily, name: string): string {
  return encodeURI(familyBase(f) + name)
}

export function familyCssFamily(f: FontFamily): string {
  return `'${f.name}', ${f.fallback}`
}

export function familySnippet(f: FontFamily): string {
  const web = f.files.find((file) => file.kind === 'web')
  return `@font-face {
  font-family: '${f.name}';
  src: url('${web?.name ?? ''}') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: '${f.name}', ${f.fallback};
  font-optical-sizing: auto; /* the default: opsz follows font-size in px (8-48) */
}`
}
