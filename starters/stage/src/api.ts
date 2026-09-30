import { defineApi, endpoint } from '@cascivo/app/api'
import {
  parseAskInput,
  parseCreated,
  parseCreatedId,
  parseCreateInput,
  parseModerateInput,
  parseOk,
  parsePollInput,
  parsePollStateInput,
  parseSpotlightInput,
  parseUpvoteInput,
  parseVoteInput,
} from './model'

/**
 * The contract between the page and the Worker. The Worker serves it with `createHandler`,
 * the page calls it with `createClient`; both import this file.
 *
 * Every write goes through here, never through the room's socket: the room is read-only
 * to browsers, so a vote is counted once and only the host can moderate. Host endpoints
 * take the host key as `Authorization: Bearer <key>`.
 */
export const api = defineApi({
  createSession: endpoint({
    method: 'POST',
    path: '/api/sessions',
    input: parseCreateInput,
    output: parseCreated,
  }),
  checkHost: endpoint({ method: 'GET', path: '/api/sessions/:code/host', output: parseOk }),

  ask: endpoint({
    method: 'POST',
    path: '/api/sessions/:code/questions',
    input: parseAskInput,
    output: parseCreatedId,
  }),
  upvote: endpoint({
    method: 'POST',
    path: '/api/sessions/:code/questions/:id/upvote',
    input: parseUpvoteInput,
    output: parseOk,
  }),
  vote: endpoint({
    method: 'POST',
    path: '/api/sessions/:code/polls/:id/vote',
    input: parseVoteInput,
    output: parseOk,
  }),

  // Host only.
  moderate: endpoint({
    method: 'PATCH',
    path: '/api/sessions/:code/questions/:id',
    input: parseModerateInput,
    output: parseOk,
  }),
  createPoll: endpoint({
    method: 'POST',
    path: '/api/sessions/:code/polls',
    input: parsePollInput,
    output: parseCreatedId,
  }),
  setPoll: endpoint({
    method: 'PATCH',
    path: '/api/sessions/:code/polls/:id',
    input: parsePollStateInput,
    output: parseOk,
  }),
  spotlight: endpoint({
    method: 'PUT',
    path: '/api/sessions/:code/spotlight',
    input: parseSpotlightInput,
    output: parseOk,
  }),
})

/** The room's WebSocket, outside the contract: `roomResponse` answers it, not `createHandler`. */
export const roomPath = (code: string) => `/api/sessions/${code}/room`
