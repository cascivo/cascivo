import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { auditFallbacks } from './css-fallback.ts'

describe('auditFallbacks', () => {
  it('PASS: static fallback immediately before @function call — no violation', () => {
    const css = `
.button {
  padding: 0.5rem;
  padding: --cascade-step(2);
}
`
    const violations = auditFallbacks(css, 'test.css')
    assert.equal(violations.length, 0)
  })

  it('FAIL: bare @function call with no preceding static value — 1 violation', () => {
    const css = `
.button {
  padding: --cascade-step(2);
}
`
    const violations = auditFallbacks(css, 'test.css')
    assert.equal(violations.length, 1)
    assert.equal(violations[0]!.property, 'padding')
    assert.match(violations[0]!.reason, /No static fallback/)
  })

  it('PASS: @supports-guarded pair — base rule outside, @function inside @supports', () => {
    const css = `
.button {
  padding-block: 0.5rem;
}
@supports (padding-block: --cascade-step(2)) {
  .button {
    padding-block: --cascade-step(2);
  }
}
`
    const violations = auditFallbacks(css, 'test.css')
    assert.equal(violations.length, 0)
  })

  it('PASS: if() expression preceded by static background — no violation', () => {
    const css = `
.badge {
  background: red;
  background: if(style(--variant: primary): blue; else: green);
}
`
    const violations = auditFallbacks(css, 'test.css')
    assert.equal(violations.length, 0)
  })

  it('FAIL: bare if() expression with no preceding value — violation', () => {
    const css = `
.badge {
  background: if(style(--variant: primary): blue; else: green);
}
`
    const violations = auditFallbacks(css, 'test.css')
    assert.equal(violations.length, 1)
    assert.equal(violations[0]!.property, 'background')
    assert.match(violations[0]!.reason, /No static fallback/)
  })
})
