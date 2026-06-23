import { Highlight } from '@cascivo/editor'
import type { Meta, StoryObj } from '@storybook/react-vite'

const tsSample = `export const sum = (a: number, b: number): number => a + b
// a one-line comment
const total = sum(2, 3)
`

const meta: Meta<typeof Highlight> = {
  title: 'Editor/Highlight',
  component: Highlight,
  args: {
    language: 'typescript',
    value: tsSample,
    lineNumbers: false,
  },
  argTypes: {
    language: {
      control: 'select',
      options: ['plaintext', 'json', 'javascript', 'typescript', 'css', 'html', 'markdown', 'bash'],
    },
  },
  render: (args) => (
    <div style={{ inlineSize: '40rem' }}>
      <Highlight {...args} />
    </div>
  ),
}
export default meta

type Story = StoryObj<typeof Highlight>

export const Basic: Story = {}

export const WithLineNumbers: Story = {
  args: { lineNumbers: true },
}

const samples: Record<string, string> = {
  json: `{ "ok": true, "items": [1, 2, 3] }`,
  css: `.x { color: var(--cascivo-color-accent); }`,
  html: `<a href="/" class="link">Home</a>`,
  markdown: `# Title\n\n**bold** and \`code\``,
  bash: `echo "$HOME"`,
}

export const Languages: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', inlineSize: '40rem' }}>
      {Object.entries(samples).map(([language, value]) => (
        <Highlight key={language} language={language} value={value} lineNumbers />
      ))}
    </div>
  ),
}
