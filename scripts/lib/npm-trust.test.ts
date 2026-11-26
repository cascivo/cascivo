import { describe, expect, it } from 'vitest'
import { publishedByTrustedPublisher, trustGithubArgs } from './npm-trust.mjs'

describe('publishedByTrustedPublisher', () => {
  it('is true for a version CI published over OIDC', () => {
    const doc = {
      version: '1.11.0',
      _npmUser: { name: 'GitHub Actions', trustedPublisher: { id: 'github' } },
    }
    expect(publishedByTrustedPublisher(doc)).toBe(true)
  })

  it('is false for a hand-published version and for junk', () => {
    expect(publishedByTrustedPublisher({ _npmUser: { name: 'someone' } })).toBe(false)
    expect(publishedByTrustedPublisher({ version: '0.0.0' })).toBe(false)
    expect(publishedByTrustedPublisher({ _npmUser: 'x' })).toBe(false)
    expect(publishedByTrustedPublisher(null)).toBe(false)
  })
})

describe('trustGithubArgs', () => {
  it('grants publish permission, which npm 12 requires', () => {
    const args = trustGithubArgs('@cascivo/ai', 'cascivo/cascivo', 'release.yml')
    expect(args).toContain('--allow-publish')
    expect(args).not.toContain('--allow-stage-publish')
    expect(args.slice(0, 3)).toEqual(['trust', 'github', '@cascivo/ai'])
  })
})
