import { ContainedList, ContainedListItem } from '../../src/contained-list/contained-list'
import { Text } from '../../src/text/text'

export default (
  <ContainedList label={'<b>&"'} action={'<b>&"'}>
    <ContainedListItem>
      <Text as="span">{'<b>&"'}</Text>
    </ContainedListItem>
  </ContainedList>
)
