import { StructuredList } from '../../src/structured-list/structured-list'

export default (
  <StructuredList
    ariaLabel="Pick"
    selectable
    value="1"
    headers={['Name', 'Role']}
    items={[
      { id: '0', cells: ['Ann', 'Admin'] },
      { id: '1', cells: ['Bob', 'Dev'] },
    ]}
  />
)
