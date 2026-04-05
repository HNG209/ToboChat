import { FlatList, FlatListProps } from 'react-native'
import { styled } from 'tamagui'

// Tạo một component FlatList mang sức mạnh style của Tamagui
export const StyledFlatList = styled(FlatList as React.ComponentType<FlatListProps<any>>, {
  flex: 1,
  backgroundColor: '$color2',
  padding: '$3',
})
