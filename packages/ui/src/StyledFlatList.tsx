import React, { forwardRef } from 'react';
import { FlatList, FlatListProps } from 'react-native'
import { styled } from 'tamagui'

// Tạo một component FlatList mang sức mạnh style của Tamagui
// export const StyledFlatList = styled(FlatList as React.ComponentType<FlatListProps<any>>, {
//   flex: 1,
//   backgroundColor: '$background',
//   padding: '$3',
// })

function BaseFlatListInner<T>(
  props: FlatListProps<T>,
  ref: React.Ref<FlatList<T>>
) {
  return <FlatList ref={ref} {...props} />
}

const BaseFlatList = forwardRef(BaseFlatListInner) as <T>(
  props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement

const Styled = styled(BaseFlatList, {
  flex: 1,
  backgroundColor: '$background',
  padding: '$3',
})

export const StyledFlatList = Styled as unknown as <T>(
  props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement