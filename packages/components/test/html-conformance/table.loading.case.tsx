import { DataTable } from '../../src/data-table/data-table'

export default (
  <DataTable loading columns={[{ key: 'c0', header: 'Name' }, { key: 'c1', header: 'Qty' }]} rows={[{ c0: 'a', c1: '1' }]} />
)
