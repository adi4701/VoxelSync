'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';

export default function LobbyPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !participantName) return;
    
    setIsLoading(true);
    // URL encode to handle spaces or special characters
    router.push(`/room/${encodeURIComponent(roomName)}?name=${encodeURIComponent(participantName)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-500 mb-6 ring-1 ring-blue-500/50 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]">
            <Video size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">VoxelSync</h1>
          <p className="text-slate-400 mt-3 text-lg">Collaborative Medical Imaging</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 ring-1 ring-white/10 shadow-2xl">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Room Name</label>
              <input
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="e.g. trauma-bay-1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Your Name</label>
              <input
                type="text"
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Dr. Smith"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !roomName || !participantName}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.6)]"
            >
              {isLoading ? 'Joining...' : 'Join Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
