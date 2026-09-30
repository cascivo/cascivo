import { defineApi, stream } from '@cascivo/app/api'
import { parseChatRequest, parseToken } from './lib/protocol'

/**
 * The contract the Worker serves and the browser calls. Both import this file, so a change
 * that breaks either side is a type error — and each side validates what crosses the wire:
 * the Worker parses the request body, the client parses every streamed token.
 */
export const api = defineApi({
  chat: stream({ method: 'POST', path: '/api/chat', input: parseChatRequest, event: parseToken }),
})
