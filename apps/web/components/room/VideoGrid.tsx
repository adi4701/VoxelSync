'use client';

import { useTracks, ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="grid gap-2 grid-cols-1">
      {tracks.map((track) => (
        <div 
          key={track.participant.identity + track.source} 
          className="aspect-video rounded-xl overflow-hidden bg-slate-800 relative ring-1 ring-white/5 shadow-lg"
        >
          <ParticipantTile
            trackRef={track}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      
      {tracks.length === 0 && (
        <div className="aspect-video rounded-xl bg-slate-800/50 border border-slate-700/50 border-dashed flex items-center justify-center p-4 text-center">
          <p className="text-slate-400 text-sm">Waiting for participants...</p>
        </div>
      )}
    </div>
  );
}
