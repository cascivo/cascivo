---
'@cascivo/react': minor
'@cascivo/i18n': minor
'@cascivo/mcp': minor
'@cascivo/eslint-plugin': minor
---

AI agent progress components. `ChainOfThought` lists the steps an agent takes. Each step has a
status from the shared `Progress` vocabulary (`pending | active | complete | error`, the same
one Timeline and Steps use), which is spoken as text after the title, and can have
collapsible detail. The list is `aria-busy` while a step is active. `ToolCall` is a card for
one tool invocation. It shows the tool name and a status badge for the AI SDK lifecycle
(`pending`, `running`, `awaiting-approval`, `complete`, `error`, `denied`), and puts the input
and output in a native disclosure that opens itself on error. It has an always-visible
`actions` slot for approval. Both server-render with no client JS. New
`builtin.chainOfThought` and `builtin.toolCall` messages (en, de).
`@cascivo/eslint-plugin`'s vocabulary maps `ThoughtChain`, `AgentSteps`, `Tool` and
`FunctionCall` to them.
