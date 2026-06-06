import { Move, Search, SunMedium, Upload, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface ViewerToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onUploadClick: () => void;
  onResetView: () => void;
  isSyncing: boolean;
  onSyncToggle: () => void;
}

export function ViewerToolbar({
  activeTool,
  onToolChange,
  onUploadClick,
  onResetView,
  isSyncing,
  onSyncToggle,
}: ViewerToolbarProps) {
  const tools = [
    { id: 'WindowLevel', icon: SunMedium, label: 'Window / Level' },
    { id: 'Pan', icon: Move, label: 'Pan' },
    { id: 'Zoom', icon: Search, label: 'Zoom' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-20">

      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <Tooltip key={t.id} content={t.label}>
            <button
              id={`tool-${t.id.toLowerCase()}`}
              onClick={() => onToolChange(t.id)}
              aria-label={t.label}
              aria-pressed={isActive}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_-3px_rgba(37,99,235,0.5)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
            </button>
          </Tooltip>
        );
      })}

      <div className="w-px h-8 bg-slate-700/50 mx-1" />

      <Tooltip content="Reset View">
        <button
          id="tool-reset"
          onClick={onResetView}
          aria-label="Reset View"
          className="p-3 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </Tooltip>

      <Tooltip content={isSyncing ? 'Sync ON — click to disable' : 'Sync OFF — click to enable'}>
        <button
          id="tool-sync-toggle"
          onClick={onSyncToggle}
          aria-label="Toggle sync"
          aria-pressed={isSyncing}
          className={`p-3 rounded-xl flex items-center justify-center transition-all ${
            isSyncing
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isSyncing ? <Wifi size={20} /> : <WifiOff size={20} />}
        </button>
      </Tooltip>

      <div className="w-px h-8 bg-slate-700/50 mx-1" />

      <Tooltip content="Upload DICOM">
        <button
          id="tool-upload"
          onClick={onUploadClick}
          aria-label="Upload DICOM"
          className="p-3 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all group"
        >
          <Upload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </Tooltip>
    </div>
  );
}
