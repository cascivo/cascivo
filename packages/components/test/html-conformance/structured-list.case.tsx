import { StructuredList } from '../../src/structured-list/structured-list'

export default (
  <StructuredList
    headers={['Name', 'Role']}
    items={[
      { id: '0', cells: ['Ann', 'Admin'] },
      { id: '1', cells: ['Bob', 'Dev'] },
    ]}
  />
)
