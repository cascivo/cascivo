import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'TagsInput',
  description: 'Free-form multi-value chip input',
  category: 'inputs',
  states: ['idle', 'focused', 'disabled'],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'string[]', required: true },
    { name: 'onValueChange', type: '(v: string[]) => void', required: true },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'validate', type: '(tag: string) => boolean', required: false },
    { name: 'max', type: 'number', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-accent',
    '--cascivo-color-destructive',
    '--cascivo-color-bg-subtle',
    '--cascivo-radius-input',
    '--cascivo-radius-full',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'textbox',
    wcag: '2.2-AA',
    keyboard: ['Enter', ',', 'Backspace'],
  },
  examples: [
    {
      title: 'Basic',
      code: `<TagsInput value={['react', 'vue']} onValueChange={() => {}} placeholder="Add tag…" />`,
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['form', 'tags', 'chips', 'multi', 'input'],
  intent: {
    whenToUse: [
      'Collecting an open-ended set of free-text values the user types themselves (keywords, emails, labels)',
      'Each entry should appear as a removable chip and there is no fixed list to pick from',
      'You need per-tag validation or a cap on how many entries are allowed',
    ],
    whenNotToUse: [
      'Values come from a fixed, known list — use MultiSelect',
      'Only a single line of free text is needed — use Input',
    ],
    antiPatterns: [
      {
        bad: '<TagsInput value={selectedRoles} ... /> // roles are a fixed enum',
        good: '<MultiSelect options={roleOptions} />',
        why: 'Free-text entry invites typos and inconsistent values when the set is actually constrained; pick from options instead',
      },
    ],
    related: [
      {
        name: 'MultiSelect',
        relationship: 'alternative',
        reason: 'Use when values come from a fixed list rather than free text',
      },
      {
        name: 'Input',
        relationship: 'alternative',
        reason: 'Use for a single free-text value with no chips',
      },
    ],
    a11yRationale:
      'The typing surface is a real <input> and each tag exposes a dedicated remove button with an aria-label naming the tag, so screen-reader users can both add (Enter/comma) and delete (Backspace or the button) without ambiguity.',
    content: {
      tone: 'Short, lowercase tag tokens; placeholder is an invite to add',
      notes: 'Placeholder defaults from the i18n catalog and only shows while empty',
    },
    flexibility: [
      {
        area: 'tag values',
        level: 'flexible',
        note: 'Free text, optionally constrained by the validate predicate and max count',
      },
      {
        area: 'commit keys',
        level: 'strict',
        note: 'Enter and comma commit a tag; Backspace on empty removes the last — fixed interaction contract',
      },
    ],
  },
}
