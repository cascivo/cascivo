import { Toc } from '../../src/toc/toc'

export default (
  <Toc
    items={[
      { id: 'intro', label: 'Intro' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API', level: 3 },
    ]}
  />
)
