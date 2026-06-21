import { FPS } from './constants'

/**
 * The intro film is assembled from an ordered list of scenes. This module is the
 * single source of truth for their order and length — pure data, no JSX, so it
 * can be unit-tested and imported by both the composition and the test runner.
 */
export type SceneId =
  | 'logo'
  | 'problem'
  | 'modernCss'
  | 'signals'
  | 'themes'
  | 'components'
  | 'tokens'
  | 'aiFirst'
  | 'accessibility'
  | 'cta'

export interface SceneSpec {
  id: SceneId
  /** Chapter label shown in the persistent frame. */
  label: string
  /** On-screen duration in seconds (before transition overlap). */
  seconds: number
}

export const SCENES: SceneSpec[] = [
  { id: 'logo', label: 'cascivo', seconds: 8 },
  { id: 'problem', label: 'The problem', seconds: 13 },
  { id: 'modernCss', label: 'Modern CSS', seconds: 17 },
  { id: 'signals', label: 'Signal-driven', seconds: 16 },
  { id: 'themes', label: 'Beautiful by default', seconds: 17 },
  { id: 'components', label: '165 components', seconds: 16 },
  { id: 'tokens', label: 'Three-level tokens', seconds: 13 },
  { id: 'aiFirst', label: 'AI-first', seconds: 18 },
  { id: 'accessibility', label: 'Accessibility', seconds: 12 },
  { id: 'cta', label: 'Get started', seconds: 18 },
]

/** Cross-scene transition length. Adjacent scenes overlap by this much. */
export const TRANSITION_FRAMES = 14

export const sceneFrames = (scene: SceneSpec): number => Math.round(scene.seconds * FPS)

/** Total composition length once transition overlaps are subtracted. */
export const totalDurationInFrames =
  SCENES.reduce((sum, scene) => sum + sceneFrames(scene), 0) -
  (SCENES.length - 1) * TRANSITION_FRAMES
