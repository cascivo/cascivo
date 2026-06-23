// Highlight engine — pure, deterministic, zero runtime dependencies.
export type { Token, TokenKind, GrammarState, LineTokens, Grammar } from './engine/types.ts'
export { tokenize, tokenizeDocument } from './engine/tokenize.ts'
export type { TokenizeResult } from './engine/tokenize.ts'
export { registerGrammar, getGrammar, listGrammars } from './engine/registry.ts'
export { createRuleGrammar } from './grammars/rules.ts'
export type { Rule, RuleSpec } from './grammars/rules.ts'

// Built-in grammars. Importing the package registers them (each module
// self-registers, so language strings resolve out of the box); a consumer who
// imports a single grammar module by path gets only that one.
export { plaintext } from './grammars/plaintext.ts'
export { json } from './grammars/json.ts'
export { javascript } from './grammars/javascript.ts'
export { typescript } from './grammars/typescript.ts'
export { css } from './grammars/css.ts'
export { html } from './grammars/html.ts'
export { markdown } from './grammars/markdown.ts'
export { bash } from './grammars/bash.ts'

// React surfaces.
export { CodeEditor } from './editor/code-editor/code-editor.tsx'
export type { CodeEditorProps } from './editor/code-editor/code-editor.tsx'
export { Highlight } from './editor/highlight/highlight.tsx'
export type { HighlightProps } from './editor/highlight/highlight.tsx'
