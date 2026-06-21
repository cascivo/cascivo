import { useCurrentFrame, useVideoConfig } from 'remotion'
import { SCENES, TRANSITION_FRAMES, sceneFrames } from '../timeline'
import { color, font, gradient } from '../theme'
import { Mark } from './Mark'

/** Resolve the active chapter label from the global composition frame. */
function chapterLabel(frame: number): string {
  let start = 0
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i]!
    const dur = sceneFrames(scene)
    if (frame < start + dur) return scene.label
    start += dur - TRANSITION_FRAMES
  }
  return SCENES[SCENES.length - 1]!.label
}

/** Persistent broadcast furniture: wordmark, chapter label, progress bar. */
export const Frame: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const progress = Math.min(1, frame / durationInFrames)

  return (
    <>
      <div
        style={{
          position: 'absolute',
          insetBlockEnd: 56,
          insetInlineStart: 70,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: font.sans,
        }}
      >
        <Mark size={40} />
        <span
          style={{ fontSize: 34, fontWeight: 700, color: color.text, letterSpacing: '-0.02em' }}
        >
          cascivo
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          insetBlockEnd: 62,
          insetInlineEnd: 70,
          fontFamily: font.sans,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: color.textFaint,
        }}
      >
        {chapterLabel(frame)}
      </div>
      <div
        style={{
          position: 'absolute',
          insetBlockEnd: 0,
          insetInline: 0,
          height: 6,
          background: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ height: '100%', width: `${progress * 100}%`, background: gradient.brand }} />
      </div>
    </>
  )
}
