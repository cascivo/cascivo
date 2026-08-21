/**
 * Where does a `label` / `ariaLabel` prop's value actually go?
 *
 * The manifest declares `nameVisibility: 'visible' | 'invisible'`. This resolves the same
 * fact from the component's own JSX, so the declaration can be checked against behaviour
 * instead of against a sentence — see `scripts/checks/name-visibility-parity.test.ts` and the
 * TSDoc on `PropMeta.nameVisibility` for why prose was not enough.
 *
 * The two positions are syntactically distinct, which is what makes this mechanical:
 *
 *   - `aria-label={label}`            — a JSX *attribute* initializer. Invisible evidence.
 *   - `<span>{label}</span>`          — a JSX *child* expression. Visible evidence.
 *
 * Values are followed through local aliasing, because components routinely resolve a default
 * first (`const resolvedLabel = label ?? t(builtin.commandMenu.label)` in `command-menu.tsx`,
 * then `aria-label={resolvedLabel}`). Without that hop the classifier sees nothing at all on
 * exactly the component the 2026-08-21 report tripped over.
 *
 * When neither position is reached — the prop is forwarded to another component, e.g.
 * `<Tooltip label={label}>` — the verdict is `'unknown'` and the caller must not guess. A
 * classifier that invents an answer for the cases it cannot see is the failure mode this
 * whole exercise exists to remove.
 */
import { Node, Project, SyntaxKind, type SourceFile } from 'ts-morph'

export type NameVisibility = 'visible' | 'invisible'
export type Verdict = NameVisibility | 'unknown'

/**
 * Does `expr` evaluate to the prop's own string?
 *
 * Deliberately narrow. An earlier version tainted any variable whose initializer merely
 * *mentioned* the prop, which taints `const margins = label === '' ? A : B` (a margin object)
 * and `const mainButton = <button aria-label={label}/>` (an element) — and then reports the
 * prop as painted wherever those get rendered. Only the forms that pass the string through
 * count: aliasing, defaulting, a ternary between them, and string interpolation.
 */
function carriesValue(expr: Node, tainted: ReadonlySet<string>): boolean {
  if (Node.isIdentifier(expr)) return tainted.has(expr.getText())
  if (Node.isParenthesizedExpression(expr) || Node.isAsExpression(expr)) {
    return carriesValue(expr.getExpression(), tainted)
  }
  if (Node.isNonNullExpression(expr)) return carriesValue(expr.getExpression(), tainted)
  if (Node.isBinaryExpression(expr)) {
    const op = expr.getOperatorToken().getKind()
    if (op !== SyntaxKind.QuestionQuestionToken && op !== SyntaxKind.BarBarToken) return false
    return carriesValue(expr.getLeft(), tainted) || carriesValue(expr.getRight(), tainted)
  }
  if (Node.isConditionalExpression(expr)) {
    return carriesValue(expr.getWhenTrue(), tainted) || carriesValue(expr.getWhenFalse(), tainted)
  }
  if (Node.isTemplateExpression(expr)) {
    return expr.getTemplateSpans().some((span) => carriesValue(span.getExpression(), tainted))
  }
  return false
}

/** Identifiers that carry the prop's value: the prop itself, plus anything derived from it. */
function taintedNames(file: SourceFile, propName: string): Set<string> {
  const tainted = new Set([propName])
  // Fixed point over local declarations: `const a = label ?? x` taints `a`, `const b = a` then
  // taints `b`. Bounded by the declaration count, so it terminates.
  for (let pass = 0; pass < 8; pass++) {
    const before = tainted.size
    for (const decl of file.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      const nameNode = decl.getNameNode()
      if (!Node.isIdentifier(nameNode)) continue
      const init = decl.getInitializer()
      if (init && carriesValue(init, tainted)) tainted.add(nameNode.getText())
    }
    if (tainted.size === before) break
  }
  return tainted
}

/**
 * True when this identifier is a *reference to the value*, not a same-spelled name in some
 * other position. Without this, `{entry.label}` inside `Switcher`'s item loop and
 * `{activeScopeMeta.label}` inside `CommandMenu` both read as "the prop is painted" — which
 * is how a first cut of this classifier declared two invisible names visible, reproducing in
 * code the exact error the prose guard made in English.
 */
function isValueReference(id: Node): boolean {
  const parent = id.getParent()
  if (!parent) return false
  // Compare by source position, not node identity: ts-morph re-wraps nodes, so `===` on two
  // wrappers for the same syntax node is not dependable.
  const isNameOf = (owner: { getNameNode(): Node }) =>
    owner.getNameNode().getStart() === id.getStart()
  // `x.label` — the member name, not our binding.
  if (Node.isPropertyAccessExpression(parent) && isNameOf(parent)) return false
  // `{ label: … }` in an object literal, and `label: string` in an interface/type.
  if (Node.isPropertyAssignment(parent) && isNameOf(parent)) return false
  if (Node.isPropertySignature(parent) && isNameOf(parent)) return false
  // The destructuring site itself (`{ label, ariaLabel }` in the parameter list) and any
  // other declaration name.
  if (Node.isBindingElement(parent) && isNameOf(parent)) return false
  if (Node.isVariableDeclaration(parent) && isNameOf(parent)) return false
  // `label={…}` as a JSX attribute NAME on some other component.
  if (Node.isJsxAttribute(parent) && isNameOf(parent)) return false
  return true
}

/** True when `node` sits inside a JSX attribute whose name is one of `attributes`. */
function insideAttribute(node: Node, attributes: readonly string[]): boolean {
  for (let cur: Node | undefined = node; cur; cur = cur.getParent()) {
    if (Node.isJsxAttribute(cur)) return attributes.includes(cur.getNameNode().getText())
    if (Node.isJsxElement(cur) || Node.isJsxSelfClosingElement(cur)) return false
  }
  return false
}

/** True when `node` sits in a JSX *child* position — i.e. it is painted. */
function insideJsxChild(node: Node): boolean {
  for (let cur: Node | undefined = node; cur; cur = cur.getParent()) {
    const parent = cur.getParent()
    if (!parent) return false
    if (Node.isJsxExpression(cur) && (Node.isJsxElement(parent) || Node.isJsxFragment(parent))) {
      return true
    }
    if (Node.isJsxAttribute(cur)) return false
  }
  return false
}

/**
 * Classify one prop of one component.
 *
 * Visible evidence wins over invisible: a component that both paints the string and mirrors
 * it into `aria-label` (`Toggle`, `Field`) is visible — the user sees it, which is the fact
 * an adopter needs before they duplicate a heading.
 */
export function classifyNameVisibility(sourcePaths: string[], propName: string): Verdict {
  const project = new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true })
  let visible = false
  let invisible = false

  for (const path of sourcePaths) {
    let file: SourceFile
    try {
      file = project.addSourceFileAtPath(path)
    } catch {
      continue
    }
    const tainted = taintedNames(file, propName)
    for (const id of file.getDescendantsOfKind(SyntaxKind.Identifier)) {
      if (!tainted.has(id.getText())) continue
      if (!isValueReference(id)) continue
      if (insideJsxChild(id)) visible = true
      // Only `aria-label` counts as invisible evidence. `title` was tried and is ambiguous:
      // `<ChartFrame title={label}>` is an accessible name, but `<Axis title={label}>` paints
      // the string under the axis. An attribute on another component is a hop this classifier
      // cannot see through, and inventing a verdict for it is the failure this file exists to
      // avoid — those land in `'unknown'`, where the declaration stands unchallenged.
      if (insideAttribute(id, ['aria-label'])) invisible = true
    }
  }

  if (visible) return 'visible'
  if (invisible) return 'invisible'
  return 'unknown'
}
