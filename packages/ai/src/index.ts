// StreamingText and Terminal are the registry components, re-exported unchanged so this
// package and `cascivo add` ship one implementation of each.
export { StreamingText } from '../../components/src/streaming-text/streaming-text'
export type { StreamingTextProps } from '../../components/src/streaming-text/streaming-text'
export { AiLabel } from './ai-label'
export type { AiLabelProps, AiLabelVariant } from './ai-label'
export { Terminal } from '../../components/src/terminal/terminal'
export type {
  TerminalProps,
  TerminalLine,
  TerminalLineType,
} from '../../components/src/terminal/terminal'
export { AiChat } from './ai-chat'
export type { AiChatProps, ChatMessage } from './ai-chat'
