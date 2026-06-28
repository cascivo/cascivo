import { describe, expect, it } from 'vitest'
import type { RegistryItem } from '@cascivo/registry'
import { formatItem } from './view.js'

const TEMPLATE: RegistryItem = {
  schemaVersion: 2,
  name: 'dashboard',
  type: 'template',
  description: 'An analytics dashboard template',
  version: '1.0.0',
  license: 'MIT',
  files: [{ url: 'https://example.com/dashboard.tsx', target: 'src/pages/dashboard.tsx' }],
  dependencies: [],
  registryDependencies: ['card', 'line-chart'],
  tags: ['dashboard'],
  meta: {
    intent: 'Analytics dashboard',
    framework: 'react-vite',
    category: 'dashboard',
    screenshots: [{ light: 'https://example.com/light.png', alt: 'preview' }],
    demoUrl: 'https://example.github.io/demo',
    fileRoles: { 'src/pages/dashboard.tsx': 'page' },
    pages: [{ name: 'Dashboard', target: 'src/pages/dashboard.tsx' }],
  },
}

describe('formatItem (template)', () => {
  it('renders template intent, framework, demo, and pages', () => {
    const out = formatItem(TEMPLATE)
    expect(out).toContain('Template: Analytics dashboard')
    expect(out).toContain('Framework: react-vite')
    expect(out).toContain('Demo: https://example.github.io/demo')
    expect(out).toContain('Dashboard → src/pages/dashboard.tsx')
  })

  it('labels registry deps as Components for a template', () => {
    expect(formatItem(TEMPLATE)).toContain('Components: card, line-chart')
  })

  it('shows the file target arrow', () => {
    expect(formatItem(TEMPLATE)).toContain('→ src/pages/dashboard.tsx')
  })
})

describe('formatItem (component)', () => {
  const component: RegistryItem = {
    schemaVersion: 2,
    name: 'button',
    type: 'component',
    description: 'A button',
    version: '1.0.0',
    files: [{ url: 'https://example.com/button.tsx' }],
    dependencies: ['@cascivo/core'],
    registryDependencies: ['icon'],
    tags: ['input'],
  }

  it('uses the Registry dependencies label and omits template fields', () => {
    const out = formatItem(component)
    expect(out).toContain('Registry dependencies: icon')
    expect(out).not.toContain('Template:')
  })
})
