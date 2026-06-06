import { useCallback, useEffect, useRef } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { DataPacket_Kind, RoomEvent, type RemoteParticipant } from 'livekit-client';
import { ViewportSyncPayload, StudyLoadCommand, ViewportSyncPayloadSchema, StudyLoadCommandSchema } from '@voxelsync/types';

export function useViewportSync(
  onViewportSync?: (payload: ViewportSyncPayload) => void,
  onStudyLoad?: (payload: StudyLoadCommand) => void
) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const lastSyncTime = useRef<number>(0);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string
    ) => {
      // Decode the payload
      const strData = new TextDecoder().decode(payload);
      try {
        const data = JSON.parse(strData);
        
        if (data.type === 'viewport-sync' && onViewportSync) {
          const result = ViewportSyncPayloadSchema.safeParse(data);
          if (result.success) {
            onViewportSync(result.data);
          }
        } else if (data.type === 'study-load' && onStudyLoad) {
          const result = StudyLoadCommandSchema.safeParse(data);
          if (result.success) {
            onStudyLoad(result.data);
          }
        }
      } catch (err) {
        console.error('Failed to parse incoming data channel message:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, onViewportSync, onStudyLoad]);

  const sendViewportState = useCallback((state: ViewportSyncPayload) => {
    if (!localParticipant) return;
    
    // Throttle to max 30fps (~33ms) to prevent flooding
    const now = Date.now();
    if (now - lastSyncTime.current < 33) return;
    lastSyncTime.current = now;

    const payload = new TextEncoder().encode(JSON.stringify(state));
    // LOSSY is ideal for continuous viewport sync (fast, drops are okay)
    localParticipant.publishData(payload, { reliable: false });
  }, [localParticipant]);

  const sendStudyCommand = useCallback((cmd: StudyLoadCommand) => {
    if (!localParticipant) return;
    
    const payload = new TextEncoder().encode(JSON.stringify(cmd));
    // RELIABLE is required for commands to ensure delivery
    localParticipant.publishData(payload, { reliable: true });
  }, [localParticipant]);

  return {
    sendViewportState,
    sendStudyCommand,
  };
}
