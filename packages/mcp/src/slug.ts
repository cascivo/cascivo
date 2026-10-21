/**
 * A guide or component slug: lowercase words joined by single hyphens. Slugs arrive from agents
 * (`get_guide`) or from a context bundle that may have been fetched, and become a file path and a
 * URL, so anything else (`../`, `/`, spaces) is refused rather than resolved.
 */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSlug(value: string): boolean {
  return SLUG.test(value)
}
