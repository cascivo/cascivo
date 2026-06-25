// Single source of truth for the /showcase page — real, shipped products built
// with cascivo. Keep the `slug`/`url` list in sync with
// scripts/showcase/capture.mjs (which writes /showcase/<slug>.jpg screenshots).
// Import-free of React so build-time code (sitemap, prerender) can reuse it.

export interface ShowcaseSite {
  slug: string
  url: string
  name: string
  /** Short product category, shown as a chip. */
  category: string
  /** One line for the card. */
  tagline: string
}

export const SHOWCASE: ShowcaseSite[] = [
  {
    slug: 'pagome',
    url: 'https://pagome.com',
    name: 'Pagome',
    category: 'Payments',
    tagline:
      'Generate a SEPA payment request link in seconds — no account, no app, and your IBAN never leaves your device.',
  },
  {
    slug: 'bpmnkit',
    url: 'https://bpmnkit.com',
    name: 'BPMN Kit',
    category: 'Developer tool',
    tagline:
      'A TypeScript SDK for generating production-ready BPMN diagrams in code — built for AI agents and workflow builders.',
  },
  {
    slug: 'weeklyfoo',
    url: 'https://weeklyfoo.directory',
    name: 'Weeklyfoo Directory',
    category: 'Directory',
    tagline:
      'A searchable directory of curated articles, tools, and resources from the Weeklyfoo tech newsletter.',
  },
  {
    slug: 'u11g',
    url: 'https://u11g.com',
    name: 'u11g',
    category: 'Personal site',
    tagline: 'The Modern Mainframe — a functional-brutalist digital garden.',
  },
  {
    slug: 'sharu',
    url: 'https://new.sharu.io',
    name: 'Sharu',
    category: 'Backup & sync',
    tagline:
      'A decentralized, zero-knowledge, local-first backup platform — files are encrypted on your device and synced peer-to-peer across your own machines.',
  },
  {
    slug: 'aime',
    url: 'https://aime.directory',
    name: 'AI & me',
    category: 'Directory',
    tagline:
      'A curated directory of AI tools, MCP servers, jobs, and instructions — structured for both humans and LLMs.',
  },
  {
    slug: 'kaihuman',
    url: 'https://kaihuman.com',
    name: 'kaihuman',
    category: 'Productivity',
    tagline:
      'An operating system for personal improvement — track habits, goals, and knowledge on a local-first, GitHub-backed platform.',
  },
]

/** Host without protocol/trailing slash, for the faux browser URL bar. */
export function displayHost(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
