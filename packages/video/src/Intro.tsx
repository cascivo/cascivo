import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import type { TransitionPresentation } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'
import { Frame } from './components/Frame'
import { Accessibility } from './scenes/Accessibility'
import { AiFirst } from './scenes/AiFirst'
import { Components } from './scenes/Components'
import { Cta } from './scenes/Cta'
import { LogoReveal } from './scenes/LogoReveal'
import { ModernCss } from './scenes/ModernCss'
import { Problem } from './scenes/Problem'
import { Signals } from './scenes/Signals'
import { Themes } from './scenes/Themes'
import { Tokens } from './scenes/Tokens'
import { type SceneId, SCENES, TRANSITION_FRAMES, sceneFrames } from './timeline'

const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  logo: LogoReveal,
  problem: Problem,
  modernCss: ModernCss,
  signals: Signals,
  themes: Themes,
  components: Components,
  tokens: Tokens,
  aiFirst: AiFirst,
  accessibility: Accessibility,
  cta: Cta,
}

/** Varied transitions keep the scene changes quick and lively. */
const PRESENTATIONS: TransitionPresentation<Record<string, unknown>>[] = [
  fade(),
  slide({ direction: 'from-right' }),
  wipe({ direction: 'from-bottom' }),
  fade(),
  slide({ direction: 'from-left' }),
  wipe({ direction: 'from-top' }),
  fade(),
  slide({ direction: 'from-bottom' }),
  fade(),
]

export const Intro: React.FC = () => {
  const children: React.ReactNode[] = []

  SCENES.forEach((scene, i) => {
    const Scene = SCENE_COMPONENTS[scene.id]
    children.push(
      <TransitionSeries.Sequence key={scene.id} durationInFrames={sceneFrames(scene)}>
        <Scene />
      </TransitionSeries.Sequence>,
    )
    if (i < SCENES.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${scene.id}`}
          presentation={PRESENTATIONS[i] ?? fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />,
      )
    }
  })

  return (
    <AbsoluteFill>
      <TransitionSeries>{children}</TransitionSeries>
      <Frame />
    </AbsoluteFill>
  )
}
