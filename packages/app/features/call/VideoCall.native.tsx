import React from 'react';
import { YStack, Text, Button } from 'tamagui';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from '@tamagui/lucide-icons';
import {
  LiveKitRoom,
  VideoTrack,
  AudioSession,
  useTracks,
  useLocalParticipant,
  useRoomContext
} from '@livekit/react-native';
import { Track } from 'livekit-client';
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL;
export function VideoCall({ token, onLeave }: { token: string; onLeave: () => void }) {
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
    <YStack flex={1} backgroundColor="black">
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={onLeave}
      >
        <RoomContent />
        <CallControls onLeave={onLeave} />
      </LiveKitRoom>
    </YStack>
  );
}

function RoomContent() {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera]);
  const isGroup = room.name && !room.name.includes('_');

  if (isGroup) {
    return <GroupLayout tracks={tracks} />;
  }

  return <OneOnOneLayout tracks={tracks} />;
}

import { Dimensions, FlatList } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function GroupLayout({ tracks }: { tracks: any[] }) {
  const room = useRoomContext();
  const allRemoteParticipants = Array.from(room.remoteParticipants.values());
  const { localParticipant, isCameraEnabled } = useLocalParticipant();
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const myTrack = tracks.find(t => t.participant.isLocal);
  const localCameraRef = cameraPublication
    ? { source: Track.Source.Camera, participant: localParticipant, publication: cameraPublication }
    : myTrack;

  const page1Remotes = allRemoteParticipants.slice(0, 2);
  const remainingRemotes = allRemoteParticipants.slice(2);
  const pagedRemotes = chunkArray(remainingRemotes, 4);

  const pages = [
    { type: 'first', data: page1Remotes },
    ...pagedRemotes.map(group => ({ type: 'grid', data: group }))
  ];

  return (
    <YStack flex={1} backgroundColor="black">
      <FlatList
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `page-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'first') {
            return (
              <YStack width={SCREEN_WIDTH} flex={1}>
                <YStack flex={1.5} backgroundColor="#111" position="relative">
                  {isCameraEnabled && cameraPublication ? (
                    <VideoTrack
                      trackRef={localCameraRef}
                      style={{ flex: 1 }}
                      zOrder={0}
                      mirror={true}
                    />
                  ) : (
                    <YStack flex={1} justifyContent="center" alignItems="center">
                      <YStack p="$4" borderRadius="$10" backgroundColor="$gray4">
                        <VideoOff size={40} color="$gray8" />
                      </YStack>
                      <Text color="$gray8" marginTop="$2">Bạn đang tắt camera</Text>
                    </YStack>
                  )}
                  <YStack position="absolute" top={10} left={10} backgroundColor="rgba(0,0,0,0.5)" padding="$1" borderRadius="$2">
                    <Text color="white" fontSize={10}>Bạn (Host)</Text>
                  </YStack>
                </YStack>

                <YStack flex={1} padding="$2">
                  <Text color="$gray10" fontSize={12} marginBottom="$2" fontWeight="bold">
                    THÀNH VIÊN ({allRemoteParticipants.length})
                  </Text>
                  <YStack flexDirection="row" flex={1} gap="$2">
                    {item.data.map((participant: any) => (
                      <ParticipantItem key={participant.sid} participant={participant} tracks={tracks} width="49%" height="100%" />
                    ))}
                    {item.data.length === 0 && (
                      <YStack flex={1} justifyContent="center" alignItems="center">
                        <Text color="$gray8">Chưa có thành viên khác</Text>
                      </YStack>
                    )}
                  </YStack>
                </YStack>
              </YStack>
            );
          }
          return (
            <YStack width={SCREEN_WIDTH} flex={1} padding="$2" paddingTop="$10">
              <YStack flexDirection="row" flexWrap="wrap" gap="$2" flex={1} justifyContent="center">
                {item.data.map((participant: any) => (
                  <ParticipantItem key={participant.sid} participant={participant} tracks={tracks} width="48%" height="45%" />
                ))}
              </YStack>
            </YStack>
          );
        }}
      />
    </YStack>
  );
}


function ParticipantItem({ participant, tracks, width, height }: any) {
  const pTrack = tracks.find((t) => t.participant.sid === participant.sid);
  const isMicOn = participant.isMicrophoneEnabled;

  return (
    <YStack
      width={width}
      height={height}
      borderRadius={12}
      overflow="hidden"
      backgroundColor="#222"
      borderWidth={1}
      borderColor="#333"
      position="relative"
    >
      {pTrack?.publication?.track && !pTrack.publication.isMuted ? (
        <VideoTrack trackRef={pTrack} style={{ flex: 1 }} zOrder={1} />
      ) : (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <YStack p="$3" borderRadius={100} backgroundColor="$gray3">
            <VideoOff size={24} color="$gray8" />
          </YStack>
        </YStack>
      )}
      {/* Hiển thị trạng thái Microphone và tên người tham gia */}
      <YStack
        position="absolute"
        bottom={0} left={0} right={0}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="$2"
        paddingVertical="$1.5"
        backgroundColor="rgba(0,0,0,0.4)"
      >
        <YStack backgroundColor={isMicOn ? "rgba(255,255,255,0.2)" : "$red9"} p="$1" borderRadius={100}>
          {isMicOn ? <Mic size={12} color="white" /> : <MicOff size={12} color="white" />}
        </YStack>
        <YStack backgroundColor="rgba(0,0,0,0.6)" px="$2" py="$0.5" borderRadius="$2" maxWidth="70%">
          <Text color="white" fontSize={10} numberOfLines={1}>{participant.identity}</Text>
        </YStack>
      </YStack>
    </YStack>
  );
}


function chunkArray(array: any[], size: number) {
  const result: any[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function OneOnOneLayout({ tracks }: { tracks: any[] }) {
  const { localParticipant, isCameraEnabled } = useLocalParticipant();
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const localTrack = tracks.find((t) => t.participant.isLocal);
  const remoteTrack = tracks.find((t) => !t.participant.isLocal);
  const isRemoteVideoOn = remoteTrack && remoteTrack.publication?.track && !remoteTrack.publication.isMuted;
  return (
    <YStack flex={1} backgroundColor="black">
      {isRemoteVideoOn ? (
        <VideoTrack trackRef={remoteTrack} style={{ flex: 1 }} zOrder={0} />
      ) : (
        <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="black">

          <YStack p="$5" borderRadius={100} backgroundColor="$gray2" opacity={0.5}>
            <VideoOff size={20} color="white" />
          </YStack>
        </YStack>
      )}

      <YStack
        position="absolute"
        top={50}
        right={20}
        width={120}
        height={180}
        zIndex={1000}
        borderRadius={10}
        overflow="hidden"
        borderWidth={1}
        borderColor="white"
        backgroundColor="#111"
      >
        {isCameraEnabled && cameraPublication ? (
          <VideoTrack
            trackRef={{ source: Track.Source.Camera, participant: localParticipant, publication: cameraPublication }}
            style={{ flex: 1 }}
            zOrder={1}
            mirror
          />
        ) : (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <VideoOff size={24} color="gray" />
            <Text color="gray" fontSize={10} marginTop={5}>Camera tắt</Text>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}


function CallControls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  const toggleMicrophone = React.useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleCamera = React.useCallback(async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  }, [localParticipant, isCameraEnabled]);

  return (
    <YStack position="absolute" bottom={40} alignSelf="center" zIndex={100} flexDirection="row" gap="$3">
      <Button
        size="$5" circular
        backgroundColor={isMicrophoneEnabled ? '$gray8' : '$red10'}
        icon={isMicrophoneEnabled ? <Mic size={20} color="white" /> : <MicOff size={20} color="white" />}
        onPress={toggleMicrophone}
      />
      <Button
        size="$5" circular
        backgroundColor={isCameraEnabled ? '$gray8' : '$red10'}
        icon={isCameraEnabled ? <Video size={20} color="white" /> : <VideoOff size={20} color="white" />}
        onPress={toggleCamera}
      />
      <Button
        size="$5" circular
        backgroundColor="$red10"
        icon={<PhoneOff size={20} color="white" />}
        onPress={onLeave}
      />
    </YStack>
  );
}