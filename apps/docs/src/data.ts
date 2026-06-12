import registryJson from '../../../registry.json'

export interface PropMeta {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

export interface ComponentMeta {
  name: string
  description: string
  category: Category
  states: string[]
  variants: string[]
  sizes: string[]
  props: PropMeta[]
  tokens: string[]
  accessibility: { role: string; wcag: string; keyboard: string[] }
  examples: { title: string; code: string; description?: string }[]
  dependencies: string[]
  tags: string[]
}

export type EntryType = 'component' | 'layout' | 'block' | 'chart' | 'section'

export interface RegistryEntry {
  name: string
  type?: EntryType
  description: string
  category: Category
  version: string
  files: string[]
  dependencies: string[]
  tags: string[]
  meta: ComponentMeta
}

export type Category = 'inputs' | 'display' | 'overlay' | 'navigation' | 'feedback'

export const CATEGORY_ORDER: Category[] = ['inputs', 'display', 'overlay', 'navigation', 'feedback']

export const CATEGORY_LABELS: Record<Category, string> = {
  inputs: 'Inputs',
  display: 'Display',
  overlay: 'Overlay',
  navigation: 'Navigation',
  feedback: 'Feedback',
}

export const components: RegistryEntry[] = (
  registryJson as unknown as { components: RegistryEntry[] }
).components

export function getComponent(name: string): RegistryEntry | undefined {
  const target = name.toLowerCase()
  return components.find((c) => c.name.toLowerCase() === target)
}
