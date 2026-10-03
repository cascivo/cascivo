import type { DatabaseSync } from 'node:sqlite'
import type { Database, DbStatement } from './db'

/** D1's shape over a real SQLite database (foreign keys on, as D1 enforces them). */
export function d1(sqlite: DatabaseSync): Database {
  const statement = (sql: string, params: unknown[] = []): DbStatement => ({
    bind: (...values) => statement(sql, values),
    all: async () => ({ results: sqlite.prepare(sql).all(...(params as never[])) }),
    first: async () => sqlite.prepare(sql).get(...(params as never[])) ?? null,
    run: async () => sqlite.prepare(sql).run(...(params as never[])),
  })
  return {
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      sqlite.exec('BEGIN')
      try {
        const results = []
        for (const s of statements) results.push(await s.run())
        sqlite.exec('COMMIT')
        return results
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
  }
}

/** An RS256 signer and the JWKS that verifies it: an OpenID provider's keys, for tests. */
export async function rsaIssuer(kid = 'k1') {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const b64url = (bytes: Uint8Array | string) =>
    Buffer.from(typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes).toString(
      'base64url',
    )
  return {
    jwks: { keys: [{ kid, kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256' }] },
    async sign(claims: Record<string, unknown>): Promise<string> {
      const head = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }))
      const body = b64url(JSON.stringify(claims))
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        pair.privateKey,
        new TextEncoder().encode(`${head}.${body}`),
      )
      return `${head}.${body}.${b64url(new Uint8Array(signature))}`
    },
  }
}
