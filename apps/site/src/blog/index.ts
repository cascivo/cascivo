import type { BlogPost } from './types'
import { post as aiAgentsWithoutHallucination } from './posts/ai-agents-without-hallucination.ts'
import { post as ownedCodeShadcn } from './posts/owned-code-shadcn.ts'
import { post as signalsVsUsestate } from './posts/signals-vs-usestate.ts'

/** Newest first. Add new posts here. */
export const POSTS: BlogPost[] = [aiAgentsWithoutHallucination, signalsVsUsestate, ownedCodeShadcn]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
