export const generateDirectRoomId = (myId, otherUserId) => {
  const ids = [myId, otherUserId].sort()
  return `${ids[0]}_${ids[1]}`
}
