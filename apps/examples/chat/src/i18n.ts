import { defineMessages } from '@cascivo/i18n'

export const msg = defineMessages('chat', {
  appTitle: 'Cascivo Chat',
  newChat: 'New chat',
  deleteChat: 'Delete chat',
  model: 'Model',
  history: 'History',
  emptyTitle: 'Ask anything',
  emptyDescription:
    'Replies stream from Workers AI over server-sent events. Your history stays in this browser, in IndexedDB.',
  stop: 'Stop generating',
  stopped: 'Stopped',
  errorTitle: 'The reply failed',
  retry: 'Retry',
  loading: 'Loading history…',
  conversationMissing: 'Conversation not found',
  conversationMissingDescription:
    'History is stored in the browser that created it, so this link does not open here.',
  pageMissing: 'Page not found',
  pageMissingDescription: 'There is nothing at this address.',
})
