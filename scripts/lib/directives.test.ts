/**
 * These cover the exact failure that motivated the module: a minified chunk is ONE line, so
 * every line-based directive scan silently answers "there is no prologue here".
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dedupeDirectives, insertAfterDirectives, isClientCode, prologueEnd } from './directives.ts'

describe('prologueEnd', () => {
  it('finds the prologue on a minified single line', () => {
    const code = `"use client";import{a}from"./a.js";`
    assert.equal(code.slice(0, prologueEnd(code)), '"use client";')
  })

  it('finds it across newlines too', () => {
    assert.equal(prologueEnd("'use client';\nimport x from 'x'"), "'use client';".length)
  })

  it('spans several directives', () => {
    const code = `"use client";"use strict";var a=1;`
    assert.equal(code.slice(0, prologueEnd(code)), '"use client";"use strict";')
  })

  it('is zero when there is none', () => {
    assert.equal(prologueEnd('var a=1;'), 0)
    // A directive that is not the first statement is not a directive.
    assert.equal(prologueEnd(`import"./a.css";"use client";`), 0)
  })
})

describe('insertAfterDirectives', () => {
  it('puts the statement after the directive, never before it', () => {
    const out = insertAfterDirectives(`"use client";import{a}from"./a.js";`, `import './a.css';`)
    assert.equal(out, `"use client";\nimport './a.css';\nimport{a}from"./a.js";`)
    assert.ok(isClientCode(out))
  })

  it('leads with the statement when there is no prologue', () => {
    assert.equal(
      insertAfterDirectives('var a=1;', `import './a.css';`),
      `import './a.css';\nvar a=1;`,
    )
  })

  it('keeps the statement on a line of its own', () => {
    for (const code of [`"use client";var a=1;`, `'use client'\nvar a=1;`, 'var a=1;']) {
      const out = insertAfterDirectives(code, `import './a.css';`)
      assert.ok(
        out.split('\n').includes(`import './a.css';`),
        `not on its own line for ${JSON.stringify(code)}: ${out}`,
      )
    }
  })

  it('does not glue itself to a directive that omits its semicolon', () => {
    assert.equal(
      insertAfterDirectives(`"use client"\nvar a=1;`, `import './a.css';`),
      `"use client"\nimport './a.css';\nvar a=1;`,
    )
  })
})

describe('dedupeDirectives', () => {
  it('collapses a repeat, minified', () => {
    assert.equal(dedupeDirectives(`"use client";"use client";var a=1;`), `"use client";var a=1;`)
  })

  it('keeps distinct directives', () => {
    assert.equal(
      dedupeDirectives(`"use client";"use strict";var a=1;`),
      `"use client";"use strict";var a=1;`,
    )
  })

  it('leaves a module with no prologue alone', () => {
    assert.equal(dedupeDirectives('var a=1;'), 'var a=1;')
  })
})

describe('isClientCode', () => {
  it('accepts a minified client chunk', () => {
    assert.ok(isClientCode(`"use client";import{a}from"./a.js";`))
  })

  it('rejects one whose directive lost its place', () => {
    // Exactly what the CSS-edge plugin produced once the chunks were minified.
    assert.ok(!isClientCode(`import './charts.css';"use client";var a=1;`))
  })
})
