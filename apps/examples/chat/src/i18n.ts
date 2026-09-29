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
})
