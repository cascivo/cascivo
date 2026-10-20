/** Every `enum` array found anywhere in a JSON Schema document. */
export function enums(node: unknown, out: unknown[][] = []): unknown[][] {
  if (Array.isArray(node)) node.forEach((n) => enums(n, out))
  else if (typeof node === 'object' && node !== null) {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'enum' && Array.isArray(v)) out.push(v)
      else enums(v, out)
    }
  }
  return out
}

/** TS type names that must never appear as enum members. */
export const TS_TYPE_NAME = /^(React\.)?React(Node|Element)$|^boolean$|^string$|^number$/
