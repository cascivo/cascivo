import { Sources } from '../../src/sources/sources'

export default (
  <Sources
    items={[
      { title: 'Bad', url: 'javascript:alert(1)' },
      { title: 'Relative', url: '/docs' },
      { title: 'Data', url: 'data:text/html' },
    ]}
  />
)
