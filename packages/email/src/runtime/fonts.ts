/**
 * Font stacks that survive an email client.
 *
 * `--cascivo-font-sans` starts with `ui-sans-serif, system-ui` — CSS-wide keywords that
 * resolve to a real face in a browser and to nothing in Outlook Windows, which falls back
 * to Times New Roman. Web fonts are no help either: `@font-face` does not load in Gmail or
 * Outlook, so the stack has to name faces that are already installed.
 *
 * These are the conventional email-safe stacks: an Apple face first (Apple Mail, iOS), then
 * a Microsoft face (Outlook Windows), then a generic. Nothing here needs to load.
 */

export const EMAIL_FONTS = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  mono: "'SF Mono', Menlo, Consolas, 'Courier New', monospace",
} as const

export type FontFamily = keyof typeof EMAIL_FONTS

/**
 * The email-safe stack for a cascivo font token.
 *
 * Deliberately ignores the token's own value rather than trying to repair it: the token is
 * authored for browsers, and picking it apart to drop the keywords would produce a stack
 * that is neither the designer's intent nor a known-good email stack.
 */
export function fontStack(family: FontFamily = 'sans'): string {
  return EMAIL_FONTS[family]
}
