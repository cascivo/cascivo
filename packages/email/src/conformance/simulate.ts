/**
 * Layer 3: approximate what a given client actually renders.
 *
 * This is the piece that stands in for a commercial rendering service, and it is worth
 * being precise about what it does and does not claim.
 *
 * It does **not** emulate a client. It answers one question, which happens to be the
 * question that matters: *does this layout survive when the declarations this client does
 * not support are removed?* A design built on `gap` looks fine in Chromium and collapses in
 * Outlook; strip `gap` and render in Chromium, and the collapse is visible — deterministically,
 * offline, with a committed baseline.
 *
 * The residual is real and named in `docs/specs/email-target.md` §4.2: this cannot reproduce
 * the Word engine's own quirks, only the consequences of its missing features. Outlook
 * Windows is bought down by construction — the primitive set cannot emit what it lacks —
 * rather than by this simulation.
 */
import {
  decodeAttribute,
  encodeAttribute,
  parseDeclarations,
  serializeDeclarations,
} from './css-attr.ts'
import { propertySlug, valueSlugs } from './slugs.ts'
import { verdict, type ClientRef, type Feature } from './support.ts'

/** The clients the preview offers and the visual tests screenshot. */
export const SIMULATED_CLIENTS: readonly ClientRef[] = [
  { family: 'outlook', platform: 'windows', label: 'Outlook (Windows)' },
  { family: 'outlook', platform: 'outlook-com', label: 'Outlook.com' },
  { family: 'gmail', platform: 'desktop-webmail', label: 'Gmail' },
  { family: 'apple-mail', platform: 'macos', label: 'Apple Mail' },
  { family: 'yahoo', platform: 'desktop-webmail', label: 'Yahoo! Mail' },
]

/** Cache verdicts per (client, slug) — a document repeats the same declarations many times. */
function blockedChecker(features: Map<string, Feature>, client: ClientRef) {
  const cache = new Map<string, boolean>()
  return (slug: string): boolean => {
    const hit = cache.get(slug)
    if (hit !== undefined) return hit
    const blocked = verdict(features, slug, [client]).level === 'blocked'
    cache.set(slug, blocked)
    return blocked
  }
}

export interface SimulateOptions {
  /**
   * Also apply the client's known non-CSS transformations.
   *
   * Gmail strips `<style>` blocks in several contexts and drops `position`; Outlook drops
   * SVG entirely. These are behaviours the support matrix does not express as a feature
   * verdict, so they are encoded here by hand and kept few and named.
   */
  quirks?: boolean
}

/**
 * Strip from `html` everything `client` does not support.
 *
 * Declarations whose property or value is `blocked` are removed. Elements that are blocked
 * outright — SVG in every floor client but Apple Mail — are removed with their content, which
 * is what the client does.
 */
export function simulate(
  html: string,
  features: Map<string, Feature>,
  client: ClientRef,
  options: SimulateOptions = {},
): string {
  const isBlocked = blockedChecker(features, client)

  let out = html.replace(/\sstyle="([^"]*)"/gi, (_, raw: string) => {
    const kept = parseDeclarations(decodeAttribute(raw)).filter(({ property, value }) => {
      if (isBlocked(propertySlug(property))) return false
      return !valueSlugs(property, value).some(isBlocked)
    })
    return kept.length ? ` style="${encodeAttribute(serializeDeclarations(kept))}"` : ''
  })

  if (isBlocked('html-svg')) out = out.replace(/<svg\b[\s\S]*?<\/svg>/gi, '')

  if (options.quirks !== false) {
    // Gmail removes the whole <style> block in a forwarded or clipped message.
    if (client.family === 'gmail') out = out.replace(/<style\b[\s\S]*?<\/style>/gi, '')
    // Only Outlook processes its conditional comments; every other client sees a comment.
    if (client.family !== 'outlook' || client.platform !== 'windows') {
      out = out.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    }
  }

  return out
}
