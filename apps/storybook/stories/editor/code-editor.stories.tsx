import { useSignal, useSignals } from '@cascivo/core'
import {
  CodeEditor,
  type CodeEditorHandle,
  type Decoration,
  type EditorTheme,
  type SlashCommand,
} from '@cascivo/editor'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef } from 'react'
// Reuse the shared benchmark/test fixture so the demo matches the measured doc shape.
import { makeMarkdownDoc } from '../../../../packages/editor/src/engine/large-doc.fixture.ts'

const tsSample = `interface User {
  id: string
  name: string
}

// Greet a user
function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}
`

const notesSample = `# Meeting notes

- [x] Ship the editor
- [ ] Write the docs
- [ ] Demo find & replace

> Remember to **review** the ~~old~~ new plan before Friday.

See [the roadmap](/roadmap) and \`packages/editor\`.

\`\`\`ts
const ok = true
\`\`\`
`

const bracketSample = `function f(x) {
  return [x, (x + 1), { y: x }]
}
`

// A ~50,000-line Markdown document (generated once at module scope, not per render).
const longSample = makeMarkdownDoc(50_000)

const meta: Meta<typeof CodeEditor> = {
  title: 'Editor/CodeEditor',
  component: CodeEditor,
  args: {
    language: 'typescript',
    lineNumbers: true,
    readOnly: false,
    wrap: false,
    bracketMatching: false,
    defaultValue: tsSample,
  },
  argTypes: {
    language: {
      control: 'select',
      options: ['plaintext', 'json', 'javascript', 'typescript', 'css', 'html', 'markdown', 'bash'],
    },
    bracketMatching: { control: 'boolean' },
    onSave: { action: 'save' },
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

// ── v46 feature variants ──────────────────────────────────────────────────────

export const FindAndReplace: Story = {
  args: { language: 'markdown', defaultValue: notesSample },
  parameters: {
    docs: { description: { story: 'Press **Mod-F** to find, **Mod-Alt-F** to replace.' } },
  },
}

export const Save: Story = {
  parameters: {
    docs: { description: { story: 'Press **Mod-S** — `onSave` fires (see the Actions panel).' } },
  },
}

export const UndoRedo: Story = {
  args: { language: 'plaintext', defaultValue: 'edit me, then press Mod-Z / Mod-Shift-Z' },
  parameters: {
    docs: {
      description: {
        story: 'Owned history survives programmatic value changes. **Mod-Z** / **Mod-Shift-Z**.',
      },
    },
  },
}

export const BracketMatching: Story = {
  args: { language: 'javascript', defaultValue: bracketSample, bracketMatching: true },
  parameters: {
    docs: { description: { story: 'Move the caret onto a bracket to highlight its partner.' } },
  },
}

export const ActiveLineGutter: Story = {
  args: { language: 'typescript', lineNumbers: true },
  parameters: {
    docs: { description: { story: 'The caret’s line is highlighted in the gutter.' } },
  },
}

export const Markdown: Story = {
  args: { language: 'markdown', defaultValue: notesSample, bracketMatching: true },
  parameters: {
    docs: {
      description: { story: 'A notes document — headings, task lists, quotes, fenced code.' },
    },
  },
}

export const LargeDocument: Story = {
  args: { language: 'markdown', defaultValue: longSample },
  parameters: {
    docs: {
      description: {
        story:
          'Scroll and edit a 50,000-line document — only the visible window is tokenized (O(viewport) per render), so scrolling and typing stay smooth.',
      },
    },
  },
}

const zenTheme: EditorTheme = {
  '--cascivo-editor-bg': '#0b1021',
  '--cascivo-editor-fg': '#e6edf3',
  '--cascivo-editor-gutter-bg': '#0b1021',
  '--cascivo-editor-gutter-fg': '#56607a',
  '--cascivo-editor-current-line': 'rgba(255, 255, 255, 0.05)',
}

function ThemeSwitchDemo(args: Parameters<typeof CodeEditor>[0]) {
  useSignals()
  const zen = useSignal(false)
  return (
    <div style={{ display: 'grid', gap: '0.75rem', inlineSize: '40rem' }}>
      <button
        type="button"
        onClick={() => (zen.value = !zen.value)}
        style={{ justifySelf: 'start' }}
      >
        {zen.value ? 'Default theme' : 'Zen theme'}
      </button>
      <div style={{ blockSize: '16rem' }}>
        <CodeEditor {...args} theme={zen.value ? zenTheme : {}} />
      </div>
    </div>
  )
}

export const ThemeSwitch: Story = {
  render: (args) => <ThemeSwitchDemo {...args} />,
  parameters: {
    docs: {
      description: { story: 'Per-instance theme that switches live (Zen mode) — no remount.' },
    },
  },
}

function ImperativeHandleDemo(args: Parameters<typeof CodeEditor>[0]) {
  useSignals()
  const ref = useRef<CodeEditorHandle>(null)
  return (
    <div style={{ display: 'grid', gap: '0.75rem', inlineSize: '40rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            const sel = ref.current?.getSelection()
            if (sel) ref.current?.applyEdit({ from: sel.start, to: sel.end }, '★')
          }}
        >
          Insert ★ at caret
        </button>
        <button type="button" onClick={() => ref.current?.undo()}>
          Undo
        </button>
        <button type="button" onClick={() => ref.current?.openFind()}>
          Open find
        </button>
      </div>
      <div style={{ blockSize: '16rem' }}>
        <CodeEditor ref={ref} {...args} />
      </div>
    </div>
  )
}

export const ImperativeHandle: Story = {
  render: (args) => <ImperativeHandleDemo {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Drive the editor via its ref — applyEdit (undoable), undo, openFind.',
      },
    },
  },
}

function highlightWord(value: string, word: string, className: string): Decoration[] {
  const decos: Decoration[] = []
  value.split('\n').forEach((line, i) => {
    let idx = line.indexOf(word)
    while (idx !== -1) {
      decos.push({ line: i, start: idx, end: idx + word.length, className })
      idx = line.indexOf(word, idx + word.length)
    }
  })
  return decos
}

export const Decorations: Story = {
  args: {
    language: 'javascript',
    defaultValue: '// TODO: wire it up\nconst x = 1 // TODO: rename\n',
  },
  render: (args) => (
    <div style={{ inlineSize: '40rem', blockSize: '16rem' }}>
      <style>{`.sb-todo { background: rgba(250, 204, 21, 0.5); border-radius: 2px; }`}</style>
      <CodeEditor {...args} decorations={(value) => highlightWord(value, 'TODO', 'sb-todo')} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'A `decorations` provider highlighting every TODO.' } },
  },
}

const slashCommands: SlashCommand[] = [
  { id: 'fence', label: 'Code block', hint: '```', keywords: ['code'], insert: '```\n\n```' },
  { id: 'todo', label: 'TODO comment', keywords: ['task'], insert: '// TODO: ' },
  { id: 'divider', label: 'Divider', keywords: ['hr', 'rule'], insert: '---\n' },
  { id: 'date', label: 'Insert date', keywords: ['now', 'time'], insert: '2026-06-28' },
  { id: 'focus', label: 'Refocus editor', hint: 'action', run: (editor) => editor.focus() },
]

export const SlashCommands: Story = {
  args: { language: 'markdown', defaultValue: 'Type "/" on a new line…\n\n' },
  render: (args) => (
    <div style={{ inlineSize: '40rem', blockSize: '16rem' }}>
      <CodeEditor {...args} commands={slashCommands} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Type **/** at a word boundary to open a filtered command menu. **Up/Down** + **Enter/Tab** insert; **Escape** dismisses. An entry can `insert` text or `run` an action.',
      },
    },
  },
}

export const CustomKeymap: Story = {
  args: {
    language: 'plaintext',
    defaultValue: 'select a word, press Mod-Backslash to wrap it in **\n',
  },
  render: (args) => (
    <div style={{ inlineSize: '40rem', blockSize: '12rem' }}>
      <CodeEditor
        {...args}
        keymap={{
          'Mod-\\': ({ textarea, setText }) => {
            const { selectionStart: s, selectionEnd: e, value } = textarea
            textarea.setRangeText(`**${value.slice(s, e)}**`, s, e, 'end')
            setText(textarea.value)
            return true
          },
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'A custom `keymap` binding (Mod-\\) merged over the built-ins.' },
    },
  },
}
