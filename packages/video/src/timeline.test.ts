import { expect, test } from 'vitest'
import { FPS } from './constants'
import { SCENES, TRANSITION_FRAMES, sceneFrames, totalDurationInFrames } from './timeline'

test('scene ids are unique', () => {
  const ids = SCENES.map((s) => s.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('every scene is long enough to absorb transitions on both sides', () => {
  const minFrames = TRANSITION_FRAMES * 2
  for (const scene of SCENES) {
    expect(sceneFrames(scene), `${scene.id} is too short`).toBeGreaterThan(minFrames)
  }
})

test('total runtime stays within the 2–3 minute brief', () => {
  const seconds = totalDurationInFrames / FPS
  expect(seconds).toBeGreaterThanOrEqual(120)
  expect(seconds).toBeLessThanOrEqual(180)
})
