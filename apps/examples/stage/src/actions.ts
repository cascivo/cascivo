import { client } from './session'
import { hostKey, rememberHost, setMyVote, setUpvoted, voter } from './local'
import type { QuestionState, Spotlight } from './model'

/**
 * Every write the page makes. Each goes through the typed API, never the room's socket
 * (the room is read-only to browsers); the room then shows the result to everyone,
 * this page included.
 */

export async function createSession(title: string): Promise<string> {
  const { code, hostKey: key } = await client.createSession({ body: { title } })
  rememberHost({ code, key, title, at: Date.now() })
  return code
}

export async function ask(code: string, text: string, author: string | null): Promise<void> {
  await client.ask({ params: { code }, body: { text, author, voter: voter() } })
}

export async function upvote(code: string, id: string, on: boolean): Promise<void> {
  setUpvoted(code, id, on) // optimistic; undone below if the room refuses
  try {
    await client.upvote({ params: { code, id }, body: { voter: voter(), on } })
  } catch (error) {
    setUpvoted(code, id, !on)
    throw error
  }
}

export async function vote(code: string, id: string, option: number): Promise<void> {
  await client.vote({ params: { code, id }, body: { voter: voter(), option } })
  setMyVote(code, id, option)
}

function auth(code: string): HeadersInit {
  const key = hostKey(code)
  if (!key) throw new Error('This browser does not hold the host key for this session')
  return { authorization: `Bearer ${key}` }
}

export async function checkHost(code: string): Promise<boolean> {
  if (!hostKey(code)) return false
  try {
    await client.checkHost({ params: { code }, headers: auth(code) })
    return true
  } catch {
    return false
  }
}

export async function moderate(code: string, id: string, state: QuestionState): Promise<void> {
  await client.moderate({ params: { code, id }, body: { state }, headers: auth(code) })
}

export async function createPoll(code: string, question: string, options: string[]): Promise<void> {
  await client.createPoll({ params: { code }, body: { question, options }, headers: auth(code) })
}

export async function setPoll(code: string, id: string, open: boolean): Promise<void> {
  await client.setPoll({ params: { code, id }, body: { open }, headers: auth(code) })
}

export async function spotlight(code: string, target: Spotlight): Promise<void> {
  await client.spotlight({ params: { code }, body: { spotlight: target }, headers: auth(code) })
}
