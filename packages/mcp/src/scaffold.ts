export interface ScaffoldOptions {
  description: string
  components?: string[]
}

const DEFAULT_COMPONENTS = ['card', 'input', 'button']

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** A reasonable default usage snippet per component for the scaffold. */
function usage(component: string, Tag: string): string {
  switch (component) {
    case 'button':
      return `      <${Tag}>Get started</${Tag}>`
    case 'input':
      return `      <${Tag} label="Email" placeholder="you@example.com" />`
    case 'card':
      return `      <${Tag}>\n        <h2>Card title</h2>\n        <p>Card content goes here.</p>\n      </${Tag}>`
    case 'badge':
      return `      <${Tag}>New</${Tag}>`
    default:
      return `      <${Tag} />`
  }
}

/**
 * Generate a JSX page layout string from a natural-language description and an
 * optional list of cascade components to include.
 */
export function scaffoldPage(options: ScaffoldOptions): string {
  const components = options.components?.length ? options.components : DEFAULT_COMPONENTS
  const unique = [...new Set(components.map((c) => c.toLowerCase()))]

  const imports = unique
    .map((c) => `import { ${pascalCase(c)} } from './components/ui/${c}/${c}'`)
    .join('\n')

  const body = unique.map((c) => usage(c, pascalCase(c))).join('\n')

  return `${imports}

/* ${options.description} */
export function Page() {
  return (
    <main
      data-theme="light"
      style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem', display: 'grid', gap: '1rem' }}
    >
${body}
    </main>
  )
}
`
}
