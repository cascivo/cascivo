import { describe, expect, it } from 'vitest'
import { validateTemplate } from '@cascivo/registry'
import { buildTemplateScaffold } from './template-init.js'

describe('buildTemplateScaffold', () => {
  it('produces a template item that passes validateTemplate', () => {
    const { item } = buildTemplateScaffold({
      name: 'dashboard',
      category: 'dashboard',
      framework: 'react-vite',
      components: ['card', 'line-chart'],
      repo: 'acme/templates',
      license: 'MIT',
    })
    expect(item.type).toBe('template')
    expect(validateTemplate(item)).toEqual([])
  })

  it('scaffolds the source folder, css, fixtures, and a .template.ts manifest', () => {
    const { files } = buildTemplateScaffold({
      name: 'auth',
      category: 'auth',
      framework: 'react-vite',
      components: ['card'],
      license: 'MIT',
    })
    const paths = files.map((f) => f.path)
    expect(paths).toContain('src/auth/auth.tsx')
    expect(paths).toContain('src/auth/auth.module.css')
    expect(paths).toContain('src/auth/fixtures.ts')
    expect(paths).toContain('src/auth/auth.template.ts')
  })

  it('maps every file target into meta.fileRoles', () => {
    const { item } = buildTemplateScaffold({
      name: 'settings',
      category: 'settings',
      framework: 'react-next',
      components: ['toggle'],
      license: 'MIT',
    })
    const meta = item.meta as { fileRoles: Record<string, string> }
    for (const file of item.files) {
      expect(file.target && meta.fileRoles[file.target]).toBeTruthy()
    }
  })

  it('uses raw GitHub URLs when a repo is given', () => {
    const { item } = buildTemplateScaffold({
      name: 'landing',
      category: 'marketing',
      framework: 'react-vite',
      components: ['button'],
      repo: 'acme/templates',
      license: 'MIT',
    })
    expect(item.files[0]!.url).toContain('raw.githubusercontent.com/acme/templates/main/')
  })
})
