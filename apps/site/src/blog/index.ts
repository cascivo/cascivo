import type { BlogPost } from './types'
import { post as accessibleCommandPalette } from './posts/accessible-command-palette.ts'
import { post as aiAgentsWithoutHallucination } from './posts/ai-agents-without-hallucination.ts'
import { post as cascivoVsIbmCarbon } from './posts/cascivo-vs-ibm-carbon.ts'
import { post as modernCssComponentLibrary } from './posts/modern-css-component-library.ts'
import { post as ownedCodeShadcn } from './posts/owned-code-shadcn.ts'
import { post as signalsVsUsestate } from './posts/signals-vs-usestate.ts'
import { post as themingCssCustomProperties } from './posts/theming-css-custom-properties.ts'

/** Newest first. Add new posts here. */
export const POSTS: BlogPost[] = [
  aiAgentsWithoutHallucination,
  signalsVsUsestate,
  ownedCodeShadcn,
  modernCssComponentLibrary,
  accessibleCommandPalette,
  themingCssCustomProperties,
  cascivoVsIbmCarbon,
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
