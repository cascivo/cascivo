import { describe, expect, it } from 'vitest'
import { scaffoldPage } from './scaffold.js'

describe('scaffoldPage', () => {
  it('uses default components when none are given', () => {
    const jsx = scaffoldPage({ description: 'Landing page' })
    expect(jsx).toContain("import { Card } from './components/ui/card/card'")
    expect(jsx).toContain("import { Button } from './components/ui/button/button'")
    expect(jsx).toContain('/* Landing page */')
    expect(jsx).toContain('export function Page()')
  })

  it('imports and renders the requested components', () => {
    const jsx = scaffoldPage({ description: 'Form', components: ['input', 'button'] })
    expect(jsx).toContain("import { Input } from './components/ui/input/input'")
    expect(jsx).toContain('<Button>Get started</Button>')
    expect(jsx).not.toContain('card/card')
  })

  it('deduplicates and lowercases component names', () => {
    const jsx = scaffoldPage({ description: 'x', components: ['Button', 'button'] })
    expect(jsx.match(/button\/button'/g)).toHaveLength(1)
  })
})
