'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ConnectionStateToast,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { VideoGrid } from './VideoGrid';
import { CornerstoneInit } from '../viewer/CornerstoneInit';
import { DicomViewport } from '../viewer/DicomViewport';
import { ViewerToolbar } from '../viewer/ViewerToolbar';
import { StudyUploader } from '../viewer/StudyUploader';
import { MetadataPanel } from '../viewer/MetadataPanel';
import { useViewportSync } from '@/hooks/useViewportSync';
import { DicomMetadata } from '@voxelsync/types';

interface RoomViewProps {
  roomId: string;
  participantName: string;
}

export default function RoomView({ roomId, participantName }: RoomViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/livekit-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: roomId, participantName }),
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch token');
        }
        
        const data = await res.json();
        if (mounted) {
          setToken(data.token);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    };
    
    fetchToken();
    
    return () => { mounted = false; };
  }, [roomId, participantName]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-500">
        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-blue-500 animate-pulse font-medium">Connecting to secure room...</div>
      </div>
    );
  }

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-50 flex flex-col overflow-hidden" data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        className="flex h-full flex-col"
      >
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Video Grid Panel (Left) */}
          <div className="w-full md:w-1/4 min-w-[280px] bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-10">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
              <h2 className="font-semibold text-slate-200">Room: {roomId}</h2>
              <p className="text-xs text-slate-400 mt-1">LiveKit Connected</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
              <VideoGrid />
            </div>
          </div>
          
          {/* Main DICOM Viewer Panel (Right) */}
          <div className="flex-1 bg-black relative">
            <CornerstoneInit>
              <ViewerContent />
            </CornerstoneInit>
          </div>
        </div>

        {/* LiveKit Control Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-2">
          <ControlBar />
        </div>
        
        <RoomAudioRenderer />
        <ConnectionStateToast />
      </LiveKitRoom>
    </div>
  );
}

// Separate component to use hooks that depend on CornerstoneInit provider
function ViewerContent() {
  const [activeTool, setActiveTool] = useState('WindowLevel');
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [activeStudyUrl, setActiveStudyUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DicomMetadata | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useViewportSync(undefined, (cmd) => {
    // Handle incoming study load command from peer
    setActiveStudyUrl(`voxelsync:${process.env.NEXT_PUBLIC_DICOM_SERVER_URL || 'http://localhost:3001'}/api/dicom/${cmd.studyId}/frames/0`);
    setMetadata(cmd.metadata);
  });

  const handleUploadSuccess = (studyId: string, md: DicomMetadata) => {
    setActiveStudyUrl(`voxelsync:${process.env.NEXT_PUBLIC_DICOM_SERVER_URL || 'http://localhost:3001'}/api/dicom/${studyId}/frames/0`);
    setMetadata(md);
  };

  const handleResetView = () => {
    // Reset by re-setting the same stack — Cornerstone resets camera to default
    if (activeStudyUrl) {
      const temp = activeStudyUrl;
      setActiveStudyUrl(null);
      setTimeout(() => setActiveStudyUrl(temp), 50);
    }
  };

  return (
    <>
      <DicomViewport studyUrl={activeStudyUrl} activeTool={activeTool} isSyncing={isSyncing} />
      <MetadataPanel metadata={metadata} />
      <ViewerToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onUploadClick={() => setIsUploaderOpen(true)}
        onResetView={handleResetView}
        isSyncing={isSyncing}
        onSyncToggle={() => setIsSyncing(prev => !prev)}
      />
      <StudyUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
