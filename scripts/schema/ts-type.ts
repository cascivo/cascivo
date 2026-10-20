/**
 * Parses the free-text `type` strings found in component manifests into a small tree.
 * Pure on purpose: later steps classify the tree and emit JSON Schema, so this only has to
 * recognise the subset manifests actually use and say `null` for everything else.
 */

export type TsType =
  | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' | 'null' | 'undefined' }
  | { kind: 'literal'; value: string | number | boolean }
  | { kind: 'union'; members: TsType[] }
  | { kind: 'array'; element: TsType }
  | { kind: 'object'; fields: TsField[] }
  | { kind: 'function' }
  | { kind: 'ref'; name: string; args: TsType[] }

export interface TsField {
  name: string
  optional: boolean
  type: TsType
}

type Token =
  | { t: 'id'; v: string }
  | { t: 'str'; v: string }
  | { t: 'num'; v: number }
  | { t: 'p'; v: string }

const PRIMITIVES = new Set(['string', 'number', 'boolean', 'null', 'undefined'])

/** Thrown internally for anything outside the supported subset; never escapes. */
class Unsupported extends Error {}

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src.charAt(i)
    if (/\s/.test(c)) {
      i++
    } else if (c === '=' && src[i + 1] === '>') {
      out.push({ t: 'p', v: '=>' })
      i += 2
    } else if ('|&()[]{}<>;,?:'.includes(c)) {
      out.push({ t: 'p', v: c })
      i++
    } else if (c === "'" || c === '"') {
      const end = src.indexOf(c, i + 1)
      if (end < 0) throw new Unsupported()
      out.push({ t: 'str', v: src.slice(i + 1, end) })
      i = end + 1
    } else if (/[0-9-]/.test(c)) {
      const m = /^-?\d+(\.\d+)?/.exec(src.slice(i))
      if (!m) throw new Unsupported()
      out.push({ t: 'num', v: Number(m[0]) })
      i += m[0].length
    } else if (/[A-Za-z_$]/.test(c)) {
      const m = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*/.exec(src.slice(i))
      if (!m) throw new Unsupported()
      out.push({ t: 'id', v: m[0] })
      i += m[0].length
    } else {
      throw new Unsupported()
    }
  }
  return out
}

class Parser {
  private pos = 0
  private readonly toks: Token[]
  constructor(toks: Token[]) {
    this.toks = toks
  }

  private peek(): Token | undefined {
    return this.toks[this.pos]
  }

  private isP(v: string, at = this.pos): boolean {
    const tok = this.toks[at]
    return tok?.t === 'p' && tok.v === v
  }

  private expectP(v: string): void {
    if (!this.isP(v)) throw new Unsupported()
    this.pos++
  }

  get done(): boolean {
    return this.pos >= this.toks.length
  }

  parseType(): TsType {
    const members: TsType[] = []
    do {
      if (members.length > 0) this.pos++
      const m = this.parsePostfix()
      // Flatten so `'a' | ('b' | 'c')` is one union.
      if (m.kind === 'union') members.push(...m.members)
      else members.push(m)
    } while (this.isP('|'))
    const [first] = members
    return members.length === 1 && first ? first : { kind: 'union', members }
  }

  private parsePostfix(): TsType {
    let t = this.parsePrimary()
    while (this.isP('[') && this.isP(']', this.pos + 1)) {
      this.pos += 2
      t = { kind: 'array', element: t }
    }
    return t
  }

  /** True when the `(` at the cursor opens a function's parameter list. */
  private parenStartsFunction(): boolean {
    let depth = 0
    for (let i = this.pos; i < this.toks.length; i++) {
      if (this.isP('(', i)) depth++
      else if (this.isP(')', i) && --depth === 0) return this.isP('=>', i + 1)
    }
    throw new Unsupported()
  }

  private parsePrimary(): TsType {
    const tok = this.peek()
    if (!tok) throw new Unsupported()
    if (tok.t === 'str' || tok.t === 'num') {
      this.pos++
      return { kind: 'literal', value: tok.v }
    }
    if (tok.t === 'id') return this.parseIdentifier(tok.v)
    if (tok.v === '(') {
      if (this.parenStartsFunction()) return this.parseFunction()
      this.pos++
      const inner = this.parseType()
      this.expectP(')')
      return inner
    }
    if (tok.v === '{') return this.parseObject()
    // `[`: tuples are not representable downstream.
    throw new Unsupported()
  }

  private parseFunction(): TsType {
    let depth = 0
    do {
      if (this.isP('(')) depth++
      else if (this.isP(')')) depth--
      this.pos++
    } while (depth > 0)
    this.expectP('=>')
    this.parseType()
    return { kind: 'function' }
  }

  private parseIdentifier(name: string): TsType {
    this.pos++
    if (name === 'true' || name === 'false') return { kind: 'literal', value: name === 'true' }
    if (PRIMITIVES.has(name)) {
      return { kind: 'primitive', name: name as Extract<TsType, { kind: 'primitive' }>['name'] }
    }
    const args: TsType[] = []
    if (this.isP('<')) {
      this.pos++
      do {
        if (args.length > 0) this.pos++
        args.push(this.parseType())
      } while (this.isP(','))
      this.expectP('>')
    }
    if (name === 'Array' && args.length === 1 && args[0]) {
      return { kind: 'array', element: args[0] }
    }
    return { kind: 'ref', name, args }
  }

  private parseObject(): TsType {
    this.expectP('{')
    const fields: TsField[] = []
    while (!this.isP('}')) {
      const key = this.peek()
      if (key?.t !== 'id' && key?.t !== 'str') throw new Unsupported()
      this.pos++
      const optional = this.isP('?')
      if (optional) this.pos++
      this.expectP(':')
      fields.push({ name: key.v, optional, type: this.parseType() })
      if (this.isP(';') || this.isP(',')) this.pos++
      else if (!this.isP('}')) throw new Unsupported()
    }
    this.expectP('}')
    return { kind: 'object', fields }
  }
}

/** null when the string is not in the supported subset (tuples, mapped/conditional types, …). */
export function parseTsType(src: string): TsType | null {
  try {
    const p = new Parser(tokenize(src))
    const t = p.parseType()
    return p.done ? t : null
  } catch (e) {
    if (e instanceof Unsupported) return null
    throw e
  }
}
