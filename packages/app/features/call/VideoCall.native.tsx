import React from 'react';
import { YStack, Text, Button } from 'tamagui';
import { LiveKitRoom, useTracks, VideoTrack, AudioSession } from '@livekit/react-native';
import { Track } from 'livekit-client';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL;

export function VideoCall({ token, onLeave }: { token: string; onLeave: () => void }) {

  // Quản lý âm thanh trên điện thoại (đảm bảo loa ngoài/tai nghe hoạt động đúng)
  React.useEffect(() => {
    const start = async () => {
      await AudioSession.startAudioSession();
    };
    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <YStack flex={1}>
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={onLeave}
      >
        <RoomContent />

        {/* Nút tắt gọi nổi trên màn hình */}
        <YStack position="absolute" bottom={40} alignSelf="center" zIndex={10}>
          <Button backgroundColor="red" color="white" onPress={onLeave}>
            Kết thúc cuộc gọi
          </Button>
        </YStack>
      </LiveKitRoom>
    </YStack>
  );
}

// Component hiển thị lưới Video
function RoomContent() {
  // Lấy tất cả các luồng Camera đang có trong phòng
  const videoTracks = useTracks([Track.Source.Camera]);

  if (videoTracks.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text color="white">Đang kết nối hoặc không có ai bật cam...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} padding="$2" flexWrap="wrap" flexDirection="row">
      {videoTracks.map((trackReference) => (
        <YStack
          key={trackReference.participant.sid}
          width="50%" // Chia đôi màn hình nếu có nhiều người
          height={300}
          padding="$1"
        >
          {/* Render Video của từng người */}
          <VideoTrack
            trackRef={trackReference}
            style={{ flex: 1, borderRadius: 10, backgroundColor: '#333' }}
          />
          <Text position="absolute" bottom={10} left={10} color="white" fontWeight="bold">
            {trackReference.participant.identity}
          </Text>
        </YStack>
      ))}
    </YStack>
  );
}