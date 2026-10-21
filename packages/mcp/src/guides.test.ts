import { describe, expect, it } from 'vitest'
import { listGuides, loadGuide } from './guides'

// These run in the monorepo, so guidesDir() resolves apps/site/public/docs and
// the guides are read locally with no network.
describe('guides loader', () => {
  it('lists the concept guides (getting-started, theming present)', () => {
    const guides = listGuides()
    expect(guides).toContain('getting-started')
    expect(guides).toContain('theming')
    // The components index is not a concept guide.
    expect(guides).not.toContain('components')
  })

  it('loads a guide by slug from the local source (no network)', async () => {
    const md = await loadGuide('theming')
    expect(md).toBeTruthy()
    expect((md ?? '').length).toBeGreaterThan(100)
  })

  it('returns null for an unknown slug when the network is unavailable', async () => {
    const failFetch = async () => ({ ok: false, status: 404 }) as Response
    const md = await loadGuide('no-such-guide-xyz', failFetch)
    expect(md).toBeNull()
  })

  // A slug is agent input. `../` used to reach any .md the server process could read (the repo
  // README, an adopter's notes) and shaped the fallback URL.
  it.each([
    '../../../../README',
    '../../../packages/mcp/README',
    'theming/../../index',
    '/etc/x',
    'a b',
    '',
  ])('refuses the slug %j without reading a file or the network', async (slug) => {
    let fetched = false
    const spyFetch = async () => {
      fetched = true
      return { ok: true, status: 200, text: async () => '# leaked' } as Response
    }
    expect(await loadGuide(slug, spyFetch)).toBeNull()
    expect(fetched).toBe(false)
  })
})
