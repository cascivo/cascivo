/**
 * Prop and summary extraction for the email primitive reference.
 *
 * The props table an adopter reads has to come from the types, not from a hand-written
 * copy beside them. `@cascivo/email`'s primitives carry no `.meta.ts` — the manifest
 * pipeline is for the registry components — so the TypeScript source is the only source of
 * truth there is, and anything transcribed out of it drifts the first time a prop is added.
 *
 * ts-morph rather than a regex for the same reason `scripts/checks/lib/component-props.ts`
 * uses it: the defaults live in the destructured parameter of the function, the
 * descriptions live in TSDoc above the interface member, and the optionality lives in the
 * `?`. Three shapes in two places is more than a text heuristic can keep straight.
 */
import { join } from 'node:path'
import { Node, Project, ts } from 'ts-morph'

const PACKAGE_ROOT = join(import.meta.dirname, '..', '..')

export interface PrimitiveProp {
  name: string
  /** The type exactly as written in the source, not the checker's expansion of it. */
  type: string
  required: boolean
  /** The initializer from the component's destructured parameter, when it has one. */
  default?: string
  /** First paragraph of the member's TSDoc, collapsed to one line. */
  description?: string
}

export interface PrimitiveDocs {
  /** First paragraph of the component function's own TSDoc, collapsed to one line. */
  description: string
  props: PrimitiveProp[]
}

/** First paragraph of a TSDoc body, whitespace-collapsed. Empty when there is none. */
function summarize(doc: string | undefined): string {
  if (!doc) return ''
  const [first = ''] = doc.trim().split(/\n\s*\n/)
  // `{@link Column}` is a TSDoc cross-reference, not prose — the docs surfaces render the
  // bare name and link it themselves, and a literal `{@link …}` on the page reads as a bug.
  return first
    .replace(/\{@link\s+([^}|]+?)(?:\s*\|[^}]*)?\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Read every `<Name>Props` interface and `<Name>` function under `src/components`.
 *
 * Keyed by component name so the gallery can stay the single owner of order and grouping —
 * this file only answers "what does this primitive take, and what is it for".
 */
export function extractPrimitiveDocs(): Map<string, PrimitiveDocs> {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      strict: true,
      skipLibCheck: true,
    },
  })
  project.addSourceFilesAtPaths(join(PACKAGE_ROOT, 'src/components/*.tsx'))

  const docs = new Map<string, PrimitiveDocs>()
  const interfaces = new Map<string, PrimitiveProp[]>()

  for (const file of project.getSourceFiles()) {
    for (const decl of file.getInterfaces()) {
      const match = /^(.+)Props$/.exec(decl.getName())
      if (!match || !decl.isExported()) continue
      interfaces.set(
        match[1]!,
        decl.getProperties().map((prop) => ({
          name: prop.getName(),
          type: prop.getTypeNode()?.getText() ?? prop.getType().getText(prop),
          required: !prop.hasQuestionToken(),
          description: summarize(prop.getJsDocs().at(-1)?.getDescription()) || undefined,
        })),
      )
    }
  }

  for (const file of project.getSourceFiles()) {
    for (const fn of file.getFunctions()) {
      const name = fn.getName()
      if (!name || !fn.isExported()) continue
      const props = interfaces.get(name)
      if (!props) continue

      // Defaults are written as initializers in the destructured parameter, which is the
      // only place they exist — `padding = 24` in `Card({ padding = 24 })`.
      const binding = fn.getParameters()[0]?.getNameNode()
      if (binding && Node.isObjectBindingPattern(binding)) {
        for (const element of binding.getElements()) {
          const initializer = element.getInitializer()
          if (!initializer) continue
          const prop = props.find((p) => p.name === element.getName())
          if (prop) prop.default = initializer.getText()
        }
      }

      docs.set(name, { description: summarize(fn.getJsDocs().at(-1)?.getDescription()), props })
    }
  }

  return docs
}
