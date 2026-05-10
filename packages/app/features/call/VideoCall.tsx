"use client";

import { YStack, Button } from 'tamagui';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

export function VideoCall({ token, onLeave }: { token: string; onLeave: () => void }) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  return (
    <YStack flex={1} backgroundColor="$background" width="100%" height="100vh">
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onLeave}
        data-lk-theme="default"
        style={{ height: '100%', flex: 1 }}
      >
        {/* Component này sẽ tự động vẽ ra toàn bộ giao diện: Lưới video, Nút bật/tắt mic cam, Nút chia sẻ màn hình... */}
        <VideoConference />
      </LiveKitRoom>
    </YStack>
  );
}