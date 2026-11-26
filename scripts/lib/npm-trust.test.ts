import { describe, expect, it } from 'vitest'
import { trustGithubArgs, trustsRepo } from './npm-trust.mjs'

const REPO = 'cascivo/cascivo'
const FILE = 'release.yml'

describe('trustsRepo', () => {
  it('finds a matching relationship at any depth', () => {
    expect(trustsRepo([{ repository: REPO, file: FILE }], REPO, FILE)).toBe(true)
    expect(
      trustsRepo({ items: [{ repository: REPO, file: `.github/workflows/${FILE}` }] }, REPO, FILE),
    ).toBe(true)
  })

  it('needs repo and workflow on the same entry', () => {
    expect(trustsRepo([{ repository: REPO, claims: { file: FILE } }], REPO, FILE)).toBe(false)
  })

  it('rejects another repo, another workflow and non-objects', () => {
    expect(trustsRepo([{ repository: 'evil/fork', file: FILE }], REPO, FILE)).toBe(false)
    expect(trustsRepo([{ repository: REPO, file: 'ci.yml' }], REPO, FILE)).toBe(false)
    expect(trustsRepo(null, REPO, FILE)).toBe(false)
    expect(trustsRepo(`${REPO} ${FILE}`, REPO, FILE)).toBe(false)
  })
})

describe('trustGithubArgs', () => {
  it('grants publish permission, which npm 12 requires', () => {
    const args = trustGithubArgs('@cascivo/ai', REPO, FILE)
    expect(args).toContain('--allow-publish')
    expect(args).not.toContain('--allow-stage-publish')
    expect(args.slice(0, 3)).toEqual(['trust', 'github', '@cascivo/ai'])
  })
})
