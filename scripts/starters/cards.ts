/**
 * The landing page's "Deploy one now" cards, one per committed starter, written to
 * apps/site/src/marketing/starter-cards.json by `pnpm starters:cards` (part of `pnpm regen`,
 * so the CI drift job keeps it current).
 *
 * A card whose starter waits for a pending changeset says "after the next release". The
 * Version Packages PR consumes that changeset and runs `pnpm regen`, so the card becomes
 * deployable in the same commit that bumps the versions the starter installs.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deployUrl, EXAMPLE_STARTERS } from './examples.ts'
import { REPO_ROOT, STARTERS } from './starters.ts'

export const CARDS_FILE = join(REPO_ROOT, 'apps/site/src/marketing/starter-cards.json')

export interface StarterCardData {
  name: string
  title: string
  summary: string
  deployUrl: string
  /** False while the release the starter's pinned versions need is still pending. */
  deployable: boolean
}

/** A card's `waitsFor` changeset still pending, i.e. not yet consumed by a release. */
export function isPending(changeset: string): boolean {
  return existsSync(join(REPO_ROOT, '.changeset', changeset))
}

export function starterCards(): StarterCardData[] {
  return [...STARTERS, ...EXAMPLE_STARTERS].map(({ name, card }) => ({
    name,
    title: card.title,
    summary: card.summary,
    deployUrl: deployUrl(name),
    deployable: card.waitsFor === undefined || !isPending(card.waitsFor),
  }))
}

export function cardsJson(): string {
  return JSON.stringify(starterCards(), null, 2) + '\n'
}

// `node scripts/starters/cards.ts` writes the file.
if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(CARDS_FILE, cardsJson())
}
