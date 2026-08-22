/**
 * The data-prop vocabulary, derived from `registry.json`.
 *
 * ## Why this is generated rather than written
 *
 * `llms.txt` published a hand-written sentence naming seven components under `items`. Two of
 * them were wrong: `Steps` takes `steps` and `CommandMenu` takes `groups`. The paragraph
 * exists *because* nine wrong prop guesses were reported on 2026-08-08, so it is the one
 * sentence in the file that most needs to be true — and an adopter following it hit a type
 * error on the component it named wrongly (2026-08-22 report item 10).
 *
 * Its guard did not catch that, because the guard was also a hand-written list: a `claims`
 * array of eight pairs in `vocabulary.test.ts` that did not mention `Steps` at all.
 * `link-item-id-parity.test.ts` had already recorded the lesson — *"a guard that enumerates
 * its own subjects can only catch the instances its author already knew about, which is the
 * failure it was written to prevent, one level up"* — and it simply had not been applied here.
 *
 * So both the published sentence and the guard now read this module, and this module reads the
 * registry. The claim cannot drift from the catalog because it is computed from it.
 *
 * ## Why three families, not one
 *
 * The published rule said "a config-driven collection -> `items`" full stop. Measured against
 * the registry that is true of 16 components and false of 22: choice controls take `options`
 * and charts take `data`. An agent following the rule literally guessed wrong more often than
 * right. The rule now states what the catalog actually does.
 */
import { readFileSync } from 'node:fs'

/** The collection-prop families, most-specific reason first. */
export const FAMILIES = [
  {
    prop: 'items',
    when: 'a config-driven collection (nav, list, menu)',
  },
  {
    prop: 'options',
    when: 'the choices on a form control',
  },
  {
    prop: 'data',
    when: "a chart's data points",
  },
] as const

/**
 * Components whose collection prop is neither `items`/`options`/`data` nor an accepted alias,
 * with the reason. These are the guesses that cost a compile cycle, so they are named in full
 * on every surface rather than summarised.
 */
export const EXCEPTIONS: Record<string, { prop: string; reason: string }> = {
  DataTable: { prop: 'rows', reason: 'it renders a real <table>, where "rows" is the domain word' },
  Textarea: { prop: 'rows', reason: 'the HTML `rows` attribute, not a collection' },
  CommandMenu: { prop: 'groups', reason: 'its items are nested inside labelled groups' },
  ProgressIndicator: { prop: 'steps', reason: 'the domain word for a stepper' },
  Steps: { prop: 'steps', reason: 'the domain word for a stepper; also accepts `items`' },
}

interface Entry {
  meta: { name: string; props?: { name: string }[] }
}

/** Component display names declaring `prop`, in registry order. */
export function componentsWithProp(registryPath: string, prop: string): string[] {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as { components: Entry[] }
  return registry.components
    .filter((c) => (c.meta.props ?? []).some((p) => p.name === prop))
    .map((c) => c.meta.name)
}

/**
 * The vocabulary sentence for `llms.txt` and `docs/AI-RULES.md`.
 *
 * Every component name in the output is read from the registry at generation time, so a new
 * component joins the right family with no edit here, and a renamed prop moves it.
 */
export function collectionVocabularySentence(registryPath: string): string {
  const parts = FAMILIES.map(({ prop, when }) => {
    const names = componentsWithProp(registryPath, prop).filter((n) => !(n in EXCEPTIONS))
    return `${when} -> **\`${prop}\`** (${names.length}: ${names.join(', ')})`
  })
  const exceptions = Object.entries(EXCEPTIONS)
    .map(([name, { prop, reason }]) => `\`${name}.${prop}\` (${reason})`)
    .join('; ')
  return (
    'Data/shape prop vocabulary (the other half of handler naming — nine wrong guesses in one ' +
    `2026-08-08 dashboard, two more on 2026-08-22): ${parts.join('; ')}. ` +
    `Exceptions, named in full because they are where the guesses go wrong: ${exceptions}. ` +
    'A visual style enum -> **`variant`**, never `shape`/`kind`/`type`; a discriminated-union ' +
    "tag -> **`kind`**, never `type` (e.g. annotations: [{ kind: 'line' }]); a rich replaceable " +
    'slot -> **`actions`** as ReactNode (Notification, CardHeader, PageHeader — only ' +
    '`Alert.action` is the {label,onClick} shorthand); body text on a feedback component -> ' +
    '**`description`**, NOT children (Notification renders nothing for children).'
  )
}
