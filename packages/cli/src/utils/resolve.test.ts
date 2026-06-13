import { describe, it, expect } from 'vitest'
import { parseAddress } from './resolve.js'

describe('parseAddress', () => {
  it('bare name', () => {
    const addr = parseAddress('button')
    expect(addr.kind).toBe('bare')
    expect(addr.name).toBe('button')
  })

  it('full https URL', () => {
    const addr = parseAddress('https://example.com/r/button.json')
    expect(addr.kind).toBe('url')
  })

  it('relative file path', () => {
    const addr = parseAddress('./public/r/button.json')
    expect(addr.kind).toBe('url')
  })

  it('namespace @ns/name', () => {
    const addr = parseAddress('@acme/button')
    expect(addr.kind).toBe('namespace')
    expect(addr.namespace).toBe('@acme')
    expect(addr.name).toBe('button')
  })

  it('github owner/repo/item', () => {
    const addr = parseAddress('myorg/my-registry/callout')
    expect(addr.kind).toBe('github')
    expect(addr.ref).toBe('main')
  })

  it('github with #ref', () => {
    const addr = parseAddress('myorg/my-registry/callout#v1.2.0')
    expect(addr.kind).toBe('github')
    expect(addr.ref).toBe('v1.2.0')
  })

  it('@cascade namespace', () => {
    const addr = parseAddress('@cascade/button')
    expect(addr.kind).toBe('namespace')
    expect(addr.namespace).toBe('@cascade')
    expect(addr.name).toBe('button')
  })
})

describe('env expansion', () => {
  it('fails when required env var is unset', async () => {
    const { resolveItemUrl } = await import('./resolve.js')
    const config = {
      registry: 'https://cascivo.com/r',
      outputDir: 'src/components/ui',
      theme: 'light' as const,
      registries: {
        '@priv': 'https://priv.dev/r/{name}.json?token=${PRIV_TOKEN}',
      },
    }
    const addr = parseAddress('@priv/widget')
    await expect(resolveItemUrl(addr, config, {})).rejects.toThrow('PRIV_TOKEN')
  })
})
