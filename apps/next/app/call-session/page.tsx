// apps/next/app/call-session/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VideoCall } from 'app/features/call/VideoCall';
import { getSocket } from 'app/utils/socket';
import { YStack, Text } from 'tamagui';
import { CallRequest } from 'app/types/Request';

export default function CallSessionPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const roomId = searchParams.get('roomId');
  const isVideoCall = searchParams.get('video') !== 'false';

  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const checkSocket = () => {
      const socket = getSocket()
      if (socket) setIsSocketReady(true)
      else timeoutId = setTimeout(checkSocket, 200)
    }
    checkSocket()
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isSocketReady) return
    const socket = getSocket()
    if (!socket) return

    socket.emit('join_room', roomId);

    const handleCallCancelled = (data: CallRequest) => {
      if (data.roomId === roomId) {
        console.log("Cuộc gọi bị hủy từ xa, đang đóng cửa sổ...");
        window.close();
      }
    };

    socket.on('call_cancelled', handleCallCancelled);

    // Cleanup khi đóng cửa sổ hoặc rời phòng
    return () => {
      socket.emit('leave_room', roomId);
      socket.off('call_cancelled', handleCallCancelled);
    };
  }, [roomId, isSocketReady]);

  if (!token || !roomId) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Text>Không tìm thấy thông tin cấu hình cuộc gọi.</Text>
      </YStack>
    );
  }

  return (
    <VideoCall
      token={token}
      isVideoCall={isVideoCall}
      onLeave={() => {
        const socket = getSocket();
        if (socket) {
          socket.emit('cancel_call', { roomId: roomId });
        }
        window.close(); // Đóng cửa sổ popup
      }}
    />
  );
}