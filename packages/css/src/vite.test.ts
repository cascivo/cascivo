import { describe, expect, it } from 'vitest'
import { cascivoScopedName, createCascivoScopedName } from './vite.ts'

const BUTTON = '/app/src/components/ui/button/button.module.css'

describe('cascivoScopedName', () => {
  it('gives a contract local of a known unit its contract class', () => {
    expect(cascivoScopedName('label', BUTTON)).toBe('cv-button-label')
    expect(cascivoScopedName('button', BUTTON)).toBe('cv-button-button')
  })

  it('reads the unit from Windows paths and ignores a query string', () => {
    expect(cascivoScopedName('label', 'C:\\app\\button\\button.module.css?used')).toBe(
      'cv-button-label',
    )
  })

  it('hashes a local the contract does not have (an adopter rename leaves the contract)', () => {
    const name = cascivoScopedName('renamed', BUTTON)
    expect(name).toMatch(/^_renamed_[a-z0-9]{5}$/)
    expect(name).toBe(cascivoScopedName('renamed', BUTTON))
    expect(name).not.toBe(cascivoScopedName('renamed', '/other/button/button.module.css'))
  })

  it('hashes modules outside a contract unit directory', () => {
    expect(cascivoScopedName('label', '/app/src/pages/home.module.css')).toMatch(/^_label_/)
  })
})

describe('createCascivoScopedName', () => {
  it('takes the unit from a custom resolver', () => {
    const scoped = createCascivoScopedName({
      unit: (file) => /\/widgets\/([^/]+)\.module\.css$/.exec(file)?.[1],
    })
    expect(scoped('label', '/x/widgets/button.module.css')).toBe('cv-button-label')
    expect(scoped('label', '/x/button/button.module.css')).toMatch(/^_label_/)
  })

  it('ignores units the contract does not know', () => {
    expect(createCascivoScopedName()('root', '/x/blocks/hero.module.css')).toMatch(/^_root_/)
  })

  it('with `locals: "any"` keeps the pattern for locals not yet in the contract', () => {
    expect(createCascivoScopedName({ locals: 'any' })('fresh', BUTTON)).toBe('cv-button-fresh')
  })
})
