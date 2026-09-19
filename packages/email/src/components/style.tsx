/**
 * `Style` — a rule that an inline `style` attribute cannot express.
 *
 * Almost everything in this package is inlined, because Gmail's mobile app strips a
 * `<style>` block for non-Gmail accounts and Outlook Windows ignores `@media` entirely. Two
 * things genuinely cannot be inlined, and they are the whole reason `<style>` exists at all:
 * a media query and a pseudo-class. A width override below a breakpoint is the first kind.
 *
 * Wherever a `Style` appears in the tree, `renderEmail` lifts it into `<head>` and merges it
 * with every other one, so a rule can be declared next to the component that needs it
 * without that component having to reach up to the document. Identical blocks collapse to
 * one copy, which is what keeps a repeated `Container` from repeating its own rule.
 *
 * The content is written straight through rather than as a text child. React escapes text,
 * and `>` inside a selector would arrive as `&gt;` and silently stop matching.
 */

/** Marks a block for {@link hoistStyles} to lift. Never appears in the delivered HTML. */
export const HOIST_ATTRIBUTE = 'data-cascivo-hoist'

export interface StyleProps {
  /** CSS text. Written verbatim — it is authored, not user input. */
  children: string
}

/**
 * A `<style>` block, hoisted into `<head>` by the renderer.
 *
 * The escape hatch for the two things an inline `style` attribute cannot express — a media
 * query and a pseudo-class. Declare it beside the component that needs it; identical blocks
 * collapse to one copy in the delivered document.
 */
export function Style({ children }: StyleProps) {
  return (
    <style
      {...{ [HOIST_ATTRIBUTE]: '' }}
      // eslint-disable-next-line react/no-danger -- CSS text cannot be expressed as JSX children: React escapes `>` and the selector stops matching. The content is authored by the caller, and every built-in use is a fixed literal.
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}
