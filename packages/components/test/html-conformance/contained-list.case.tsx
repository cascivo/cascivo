import { ContainedList, ContainedListItem } from '../../src/contained-list/contained-list'
import { Text } from '../../src/text/text'

export default (
  <ContainedList label="Members">
    <ContainedListItem>
      <Text as="span">Ada</Text>
    </ContainedListItem>
    <ContainedListItem>
      <Text as="span">Alan</Text>
    </ContainedListItem>
  </ContainedList>
)
