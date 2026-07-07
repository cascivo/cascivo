import type { BlogPost } from './types'
import { post as aiAgentsWithoutHallucination } from './posts/ai-agents-without-hallucination.ts'

/** Newest first. Add new posts here. */
export const POSTS: BlogPost[] = [aiAgentsWithoutHallucination]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
