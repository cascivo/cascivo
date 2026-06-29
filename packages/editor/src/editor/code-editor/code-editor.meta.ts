import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'CodeEditor',
  description:
    'Lightweight code editor — a native textarea overlaid on a syntax-highlighted layer, with line numbers and Tab indent.',
  category: 'inputs',
  states: ['default'],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'string', required: false, description: 'Controlled value' },
    {
      name: 'defaultValue',
      type: 'string',
      required: false,
      description: 'Initial value for uncontrolled use',
    },
    {
      name: 'onValueChange',
      type: '(value: string) => void',
      required: false,
      description: 'Called with the new text on every edit',
    },
    {
      name: 'language',
      type: 'string',
      required: false,
      default: 'plaintext',
      description: 'Grammar name (plaintext/json/javascript/typescript/css/html/markdown/bash)',
    },
    {
      name: 'lineNumbers',
      type: 'boolean',
      required: false,
      default: 'true',
      description: 'Show the line-number gutter',
    },
    {
      name: 'tabSize',
      type: 'number',
      required: false,
      default: '2',
      description: 'Spaces per tab stop',
    },
    {
      name: 'insertSpaces',
      type: 'boolean',
      required: false,
      default: 'true',
      description: 'Insert spaces vs a literal tab on Tab',
    },
    {
      name: 'wrap',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Soft-wrap long lines instead of scrolling horizontally',
    },
    {
      name: 'readOnly',
      description: 'When true, the value is shown but cannot be edited.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'disabled',
      description: 'When true, disables the control and removes it from the tab order.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'placeholder',
      description: 'Placeholder text shown when the field is empty.',
      type: 'string',
      required: false,
    },
    {
      name: 'label',
      type: 'string',
      required: false,
      description: 'Accessible label (defaults to the i18n "Code editor")',
    },
    {
      name: 'onSave',
      type: '(value: string) => void',
      required: false,
      description: 'Called on Mod-S; the browser save dialog is suppressed',
    },
    {
      name: 'bracketMatching',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Highlight the bracket matching the one adjacent to the caret',
    },
    {
      name: 'theme',
      type: 'EditorTheme',
      required: false,
      description: 'Per-instance --cascivo-editor-* overrides; swapping it re-themes live',
    },
    {
      name: 'keymap',
      type: 'KeyMap',
      required: false,
      description: 'Extra key bindings merged over the built-ins (user wins on a chord)',
    },
    {
      name: 'decorations',
      type: 'Decoration[] | ((value: string) => Decoration[])',
      required: false,
      description: 'Extra offset-range → CSS class decorations',
    },
    {
      name: 'commands',
      type: 'SlashCommand[]',
      required: false,
      description: 'Slash-command entries; typing "/" opens a filtered menu. Omit to disable.',
    },
    {
      name: 'ref',
      type: 'Ref<CodeEditorHandle>',
      required: false,
      description:
        'Imperative handle: applyEdit / getSelection / focus / undo / redo / openFind / openCommandMenu',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  tokens: [
    '--cascivo-editor-bg',
    '--cascivo-editor-fg',
    '--cascivo-editor-gutter-bg',
    '--cascivo-editor-gutter-fg',
    '--cascivo-editor-gutter-active',
    '--cascivo-editor-current-line',
    '--cascivo-editor-selection',
    '--cascivo-editor-border',
    '--cascivo-editor-match',
    '--cascivo-editor-match-current',
    '--cascivo-editor-bracket',
  ],
  accessibility: {
    role: 'textbox',
    wcag: '2.1-AA',
    keyboard: [
      'Tab (indent)',
      'Shift+Tab (dedent)',
      'Mod+Z / Mod+Shift+Z (undo / redo)',
      'Mod+F (find)',
      'Mod+Alt+F (replace)',
      'Mod+S (save)',
      '/ (open slash-command menu when commands are provided)',
      'Up/Down + Enter/Tab (navigate + insert a command), Escape (dismiss)',
      'Standard textarea editing',
    ],
    reducedMotion: true,
    forcedColors: true,
  },
  examples: [
    {
      title: 'Basic editor',
      code: `import { CodeEditor } from '@cascivo/editor'
import '@cascivo/editor/styles.css'

<CodeEditor language="typescript" lineNumbers defaultValue={'const x = 1\\n'} />`,
    },
    {
      title: 'Controlled',
      code: `<CodeEditor language="json" value={value} onValueChange={setValue} />`,
    },
    {
      title: 'Notes editing — find, save, brackets',
      code: `<CodeEditor
  language="markdown"
  value={doc}
  onValueChange={setDoc}
  onSave={save} // Mod-S
  bracketMatching
/> // Mod-F to search`,
    },
    {
      title: 'Slash commands',
      description: 'Type "/" to open a filtered command menu; arrows + Enter insert.',
      code: `const commands = [
  { id: 'fence', label: 'Code block', keywords: ['code'], insert: '\\u0060\\u0060\\u0060\\n\\n\\u0060\\u0060\\u0060' },
  { id: 'todo', label: 'TODO', insert: '// TODO: ' },
  { id: 'date', label: 'Date', run: (e) => e.applyEdit(e.getSelection(), new Date().toISOString()) },
]

<CodeEditor language="markdown" commands={commands} />`,
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['editor', 'code', 'syntax-highlighting', 'textarea', 'inputs'],
  intent: {
    whenToUse: [
      'Editing code or config inline — JSON, snippets, web languages — with line numbers and syntax colors',
      'A lightweight, themeable code field where a full IDE editor (Monaco/CodeMirror) would be overkill',
      'Editing Markdown notes — find/replace, real undo/redo, save, and selection-preserving external sync',
      'Editing long-form Markdown — generated docs, concatenated books, big notes — windowed (viewport-scoped) tokenization keeps scrolling/typing smooth well past ~5,000 lines',
    ],
    whenNotToUse: [
      'You need IntelliSense/LSP, multi-cursor, folding, a minimap, or diff view — use a full editor framework',
      'Plain prose or a single-line value — use Textarea or Input',
      'Sustained editing of 100k+-line documents — use a full editor framework / dedicated worker pipeline (the windowed tokenizer keeps per-render work O(viewport), but a worker offload is intentionally out of scope)',
      'Soft-wrap (wrap) on a very large document — rendering is O(n) under wrap; disable wrap above ~10k lines for sustained editing',
    ],
    antiPatterns: [
      {
        bad: 'Reaching for Monaco to show an editable snippet',
        good: 'Use CodeEditor for the basic set (line numbers + highlighting) at a fraction of the weight',
        why: 'The overlay technique keeps the bundle tiny and themes via the cascivo token system',
      },
    ],
    related: [
      {
        name: 'Highlight',
        relationship: 'pairs-with',
        reason: 'The read-only renderer sharing the same tokenizer — for snippets and docs',
      },
      {
        name: 'Textarea',
        relationship: 'alternative',
        reason: 'Use for free-form prose without syntax highlighting',
      },
    ],
    a11yRationale:
      'The native <textarea> is the editing surface, so caret, selection, IME, undo, and the a11y tree come from the browser; the highlight layer and gutter are aria-hidden.',
    flexibility: [
      {
        area: 'languages',
        level: 'flexible',
        note: 'Ships a small grammar set; registerGrammar adds custom languages without bundle bloat',
      },
      {
        area: 'large documents',
        level: 'flexible',
        note: 'Windowed tokenization (tokenizeRange + LineStateIndex) makes per-render work O(viewport) and per-edit work O(changed suffix); long Markdown edits well past ~5,000 lines. Worker offload / 100k+-line sustained editing stay out of scope',
      },
    ],
  },
}
