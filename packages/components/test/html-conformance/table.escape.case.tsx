import { DataTable } from '../../src/data-table/data-table'

export default (
  <DataTable columns={[{ key: 'c0', header: '<b>H</b>' }, { key: 'c1', header: 'a&b' }]} rows={[{ c0: '<script>x</script>', c1: "q 's" }]} />
)
