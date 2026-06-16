export type BlockCategory = 'auth' | 'dashboard' | 'marketing' | 'shell'

export type BlockMeta = {
  name: string
  displayName: string
  description: string
  category: BlockCategory
  tags: string[]
  screenshot: {
    light: string
    dark: string
  }
}
