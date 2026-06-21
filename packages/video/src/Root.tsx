import { Composition } from 'remotion'
import { FPS, HEIGHT, WIDTH } from './constants'
import { Intro } from './Intro'
import { totalDurationInFrames } from './timeline'

/**
 * Registry of cascivo films. The intro is the flagship explainer; add further
 * compositions (component spotlights, release teasers) alongside it over time.
 */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Intro"
    component={Intro}
    durationInFrames={totalDurationInFrames}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
)
