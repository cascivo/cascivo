import { CodeEditor } from '@cascivo/editor'
import type { Meta, StoryObj } from '@storybook/react-vite'

const tsSample = `interface User {
  id: string
  name: string
}

// Greet a user
function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}
`

const meta: Meta<typeof CodeEditor> = {
  title: 'Editor/CodeEditor',
  component: CodeEditor,
  args: {
    language: 'typescript',
    lineNumbers: true,
    readOnly: false,
    wrap: false,
    defaultValue: tsSample,
  },
  argTypes: {
    language: {
      control: 'select',
      options: ['plaintext', 'json', 'javascript', 'typescript', 'css', 'html', 'markdown', 'bash'],
    },
  },
  render: (args) => (
    <div style={{ inlineSize: '40rem', blockSize: '18rem' }}>
      <CodeEditor {...args} />
    </div>
  ),
}
export default meta

type Story = StoryObj<typeof CodeEditor>

export const Basic: Story = {}

export const WithLineNumbers: Story = {
  args: { lineNumbers: true },
}

export const ReadOnly: Story = {
  args: { readOnly: true },
}

export const Wrap: Story = {
  args: {
    wrap: true,
    lineNumbers: false,
    defaultValue:
      'A deliberately long single line of prose that soft-wraps inside the editor instead of scrolling horizontally so every word stays visible.',
  },
}

const samples: Record<string, string> = {
  json: `{
  "name": "@cascivo/editor",
  "ok": true,
  "count": 42
}`,
  css: `.btn {
  color: var(--cascivo-color-accent);
  padding-inline: 1rem;
}`,
  html: `<!-- fragment -->
<a href="/" class="link">Home</a>`,
  markdown: `# Title

**bold** and _italic_

\`\`\`bash
echo hi
\`\`\``,
  bash: `#!/usr/bin/env bash
for i in 1 2 3; do
  echo "n: $i"
done`,
}

export const Languages: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', inlineSize: '40rem' }}>
      {Object.entries(samples).map(([language, value]) => (
        <CodeEditor key={language} language={language} defaultValue={value} />
      ))}
    </div>
  ),
}

export const Themed: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', inlineSize: '40rem' }}>
      <div data-theme="dark">
        <CodeEditor {...args} />
      </div>
      <div data-theme="warm">
        <CodeEditor {...args} />
      </div>
    </div>
  ),
}
