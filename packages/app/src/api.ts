// `@cascivo/app/api` — the typed client ↔ server contract. No React and no DOM, so a
// Cloudflare Worker imports the same module the browser does.
export { defineApi, endpoint, stream } from './contract'
export type {
  AnyEndpoint,
  Api,
  CallArgs,
  CallArgsTuple,
  JsonEndpoint,
  Method,
  Parser,
  StreamEndpoint,
} from './contract'
export { createClient } from './client'
export type { Client, ClientOptions } from './client'
export { createHandler } from './server'
export type { HandlerContext, Handlers } from './server'
export { buildPath } from './path'
export type { PathParams } from './path'
export { HttpError } from '@cascivo/data'
